import Budget from "../Models/Budget.js";
import Transaction from "../Models/Transaction.js";
import { generateBudgetAlert } from "../Utils/geminiApi.js";
import User from "../Models/User.js";
import { analyzeBudgetList } from "../Utils/geminiApi.js";


/*
====================================
GET ALL BUDGETS
GET /api/budgets
====================================
*/
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({
      user_id: req.user_id,
    }).populate({
      path: "category_id",
      select: "name icon color",
    });

    const result = [];

    for (const budget of budgets) {
      let startDate;

      if (budget.period === "monthly") {
        startDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        );
      } else {
        startDate = new Date();
        startDate.setDate(
          startDate.getDate() - startDate.getDay()
        );
        startDate.setHours(0, 0, 0, 0);
      }

      const transactions = await Transaction.find({
        user_id: req.user_id,
        category_id: budget.category_id._id,
        type: "expense",
        transaction_date: {
          $gte: startDate,
        },
      });

      const totalSpent = transactions.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0
      );

      result.push({
        _id: budget._id,

        category_id: budget.category_id._id,

        categoryName: budget.category_id.name,

        categoryIcon: budget.category_id.icon,

        categoryColor: budget.category_id.color,

        amount: budget.amount,

        period: budget.period,

        start_date: budget.start_date,

        spent: totalSpent,

        remaining: budget.amount - totalSpent,

        percentageUsed: (
          (totalSpent / budget.amount) *
          100
        ).toFixed(1),
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get Budgets Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/*
====================================
CREATE BUDGET
POST /api/budgets
====================================
*/
export const createBudget = async (
  req,
  res
) => {
  try {
    const {
      category_id,
      amount,
      period = "monthly",
      start_date,
    } = req.body;

    if (!category_id || !amount) {
      return res.status(400).json({
        message:
          "category_id and amount are required",
      });
    }

    if (
      !["monthly", "weekly"].includes(period)
    ) {
      return res.status(400).json({
        message:
          "Period must be monthly or weekly",
      });
    }

    const today = new Date();

    const effectiveStart =
      start_date ||
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    const budget = await Budget.create({
      user_id: req.user_id,
      category_id,
      amount,
      period,
      start_date: effectiveStart,
    });

    const populatedBudget =
      await Budget.findById(
        budget._id
      ).populate(
        "category_id",
        "name icon color"
      );

    res.status(201).json(
      populatedBudget
    );
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Budget already exists for this category and period",
      });
    }

    console.error(
      "CreateBudget Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/*
====================================
UPDATE BUDGET
PUT /api/budgets/:id
====================================
*/
export const updateBudget = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { amount, period } = req.body;

    if (
      period &&
      !["monthly", "weekly"].includes(period)
    ) {
      return res.status(400).json({
        message:
          "Period must be monthly or weekly",
      });
    }

    const budget =
      await Budget.findOneAndUpdate(
        {
          _id: id,
          user_id: req.user_id,
        },
        {
          ...(amount && { amount }),
          ...(period && { period }),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "category_id",
        "name icon color"
      );

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.status(200).json(budget);
  } catch (error) {
    console.error(
      "UpdateBudget Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/*
====================================
DELETE BUDGET
DELETE /api/budgets/:id
====================================
*/
export const deleteBudget = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const budget =
      await Budget.findOneAndDelete({
        _id: id,
        user_id: req.user_id,
      });

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted",
    });
  } catch (error) {
    console.error(
      "DeleteBudget Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const analyzeBudgets = async (
  req,
  res
) => {
  try {
    const budgets = await Budget.find({
      user_id: req.user_id,
    }).populate(
      "category_id",
      "name"
    );

    if (budgets.length === 0) {
      return res.json({
        analyses: [],
      });
    }

    const now = new Date();

    const budgetData = await Promise.all(
      budgets.map(async (budget) => {
        let startDate;

        if (budget.period === "weekly") {
          startDate = new Date(now);
          startDate.setDate(
            now.getDate() - 7
          );
        } else {
          // monthly
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
        }

        const expenses =
          await Transaction.aggregate([
            {
              $match: {
                user_id: budget.user_id,
                category_id:
                  budget.category_id._id,
                type: "expense",
                transaction_date: {
                  $gte: startDate,
                },
              },
            },
            {
              $group: {
                _id: null,
                spent: {
                  $sum: "$amount",
                },
              },
            },
          ]);

        const spent =
          expenses.length > 0
            ? expenses[0].spent
            : 0;

        return {
          id: budget._id,
          amount: budget.amount,
          period: budget.period,
          category_name:
            budget.category_id?.name ||
            "Unknown",
          spent,
        };
      })
    );

    const user =
      await User.findById(
        req.user_id
      );

    const currency =
      user?.currency || "USD";

    const data =
      await analyzeBudgetList({
        budgets: budgetData,
        currency,
      });

    return res.status(200).json(
      data
    );
  } catch (error) {
    console.error(
      "AnalyzeBudgets Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Server Error",
    });
  }
};