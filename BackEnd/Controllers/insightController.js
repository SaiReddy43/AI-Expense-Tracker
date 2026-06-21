import Transaction from "../Models/Transaction.js";
import Budget from "../Models/Budget.js";
import Category from "../Models/Category.js";
import AIInsight from "../Models/AiInsight.js";

import {
  generateMonthlyInsight,
  generateBudgetAlert,
  generateSavingsTips,
  analyzeBudgetList,
  analyzeTransactionList
} from "../Utils/geminiApi.js";

/*
====================================
GET SAVED INSIGHTS
====================================
*/

export const getInsights = async (
  req,
  res
) => {
  try {
    const insights =
      await AIInsight.find({
        user_id: req.user_id
      }).sort({
        created_at: -1
      });

    res.status(200).json(insights);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

/*
====================================
MONTHLY SUMMARY
====================================
*/

const buildMonthlyInsight =
  async (userId) => {
    const now = new Date();

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const transactions =
      await Transaction.find({
        user_id: userId,
        transaction_date: {
          $gte: monthStart
        }
      }).populate(
        "category_id",
        "name"
      );

    let totalIncome = 0;
    let totalExpenses = 0;

    const categoryMap = {};

    transactions.forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += Number(
          tx.amount
        );
      }

      if (tx.type === "expense") {
        totalExpenses += Number(
          tx.amount
        );

        const cat =
          tx.category_id?.name ||
          "Uncategorized";

        categoryMap[cat] =
          (categoryMap[cat] || 0) +
          Number(tx.amount);
      }
    });

    const expenseBreakdown =
      Object.entries(categoryMap).map(
        ([category, amount]) => ({
          category,
          amount
        })
      );

    const savingsRate =
      totalIncome > 0
        ? (
            ((totalIncome -
              totalExpenses) /
              totalIncome) *
            100
          ).toFixed(1)
        : 0;

    const content =
      await generateMonthlyInsight({
        totalIncome,
        totalExpenses,
        savingsRate,
        expenseBreakdown,
        previousMonths: [],
        currency: "USD"
      });

    return {
      content,
      periodStart: monthStart,
      periodEnd: now
    };
  };

/*
====================================
SAVINGS TIPS
====================================
*/

const buildSavingsTips =
  async (userId) => {
    const thirtyDaysAgo =
      new Date();

    thirtyDaysAgo.setDate(
      thirtyDaysAgo.getDate() - 30
    );

    const transactions =
      await Transaction.find({
        user_id: userId,
        type: "expense",
        transaction_date: {
          $gte: thirtyDaysAgo
        }
      }).populate(
        "category_id",
        "name"
      );

    const categoryMap = {};

    transactions.forEach((tx) => {
      const category =
        tx.category_id?.name ||
        "Uncategorized";

      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          amount: 0,
          transactionCount: 0
        };
      }

      categoryMap[category].amount +=
        Number(tx.amount);

      categoryMap[
        category
      ].transactionCount += 1;
    });

    const topCategories =
      Object.values(categoryMap)
        .sort(
          (a, b) =>
            b.amount - a.amount
        )
        .slice(0, 5);

    const incomeTx =
      await Transaction.find({
        user_id: userId,
        type: "income",
        transaction_date: {
          $gte: thirtyDaysAgo
        }
      });

    const monthlyIncome =
      incomeTx.reduce(
        (sum, tx) =>
          sum + Number(tx.amount),
        0
      );

    const content =
      await generateSavingsTips({
        topCategories,
        monthlyIncome,
        currency: "USD"
      });

    return {
      content,
      periodStart: null,
      periodEnd: null
    };
  };

/*
====================================
BUDGET ALERT
====================================
*/

const buildBudgetAlert =
  async (
    userId,
    categoryId
  ) => {
    const budget =
      await Budget.findOne({
        user_id: userId,
        category_id: categoryId
      }).populate(
        "category_id",
        "name"
      );

    if (!budget) {
      throw new Error(
        "Budget not found"
      );
    }

    const now = new Date();

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const expenses =
      await Transaction.find({
        user_id: userId,
        category_id: categoryId,
        type: "expense",
        transaction_date: {
          $gte: monthStart
        }
      });

    const spentAmount =
      expenses.reduce(
        (sum, tx) =>
          sum + Number(tx.amount),
        0
      );

    const totalPeriodDays =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

    const daysIntoPeriod =
      now.getDate();

    const content =
      await generateBudgetAlert({
        categoryName:
          budget.category_id.name,

        budgetAmount:
          budget.amount,

        spentAmount,

        daysIntoPeriod,

        totalPeriodDays,

        currency: "USD"
      });

    return {
      content,
      periodStart: monthStart,
      periodEnd: now
    };
  };

/*
====================================
GENERATE INSIGHT
====================================
*/

export const generateInsight =
  async (req, res) => {
    try {
      const {
        type,
        categoryId
      } = req.body;

      if (!type) {
        return res.status(400).json({
          message:
            "Insight type is required"
        });
      }

      let result;

      if (
        type === "monthly_summary"
      ) {
        result =
          await buildMonthlyInsight(
            req.user_id
          );
      } else if (
        type === "savings_tips"
      ) {
        result =
          await buildSavingsTips(
            req.user_id
          );
      } else if (
        type === "budget_alert"
      ) {
        result =
          await buildBudgetAlert(
            req.user_id,
            categoryId
          );
      } else {
        return res.status(400).json({
          message:
            "Unknown insight type"
        });
      }

      const insight =
        await AIInsight.create({
          user_id: req.user_id,

          insight_type: type,

          period_start:
            result.periodStart,

          period_end:
            result.periodEnd,

          content_json:
            result.content
        });

      res.status(201).json(
        insight
      );
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          error.message ||
          "Server Error"
      });
    }
  };