import Transaction from "../Models/Transaction.js";

const pctChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
};

/*
====================================
GET DASHBOARD SUMMARY
GET /api/dashboard/summary
====================================
*/
export const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user_id: req.user_id,
    });

    const now = new Date();

    const currentMonth =
      now.toISOString().slice(0, 7);

    const previousDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const previousMonth =
      previousDate.toISOString().slice(0, 7);

    let incomeThisMonth = 0;
    let expenseThisMonth = 0;
    let incomeLastMonth = 0;
    let expenseLastMonth = 0;

    transactions.forEach((tx) => {
      const month =
        tx.transaction_date
          .toISOString()
          .slice(0, 7);

      if (month === currentMonth) {
        if (tx.type === "income") {
          incomeThisMonth += Number(
            tx.amount
          );
        }

        if (tx.type === "expense") {
          expenseThisMonth += Number(
            tx.amount
          );
        }
      }

      if (month === previousMonth) {
        if (tx.type === "income") {
          incomeLastMonth += Number(
            tx.amount
          );
        }

        if (tx.type === "expense") {
          expenseLastMonth += Number(
            tx.amount
          );
        }
      }
    });

    const balance =
      incomeThisMonth - expenseThisMonth;

    const savingsRate =
      incomeThisMonth > 0
        ? (
            (balance /
              incomeThisMonth) *
            100
          ).toFixed(1)
        : 0;

    res.status(200).json({
      incomeThisMonth,
      expenseThisMonth,
      balance,
      savingsRate: Number(
        savingsRate
      ),
      incomeDelta: pctChange(
        incomeThisMonth,
        incomeLastMonth
      ),
      expenseDelta: pctChange(
        expenseThisMonth,
        expenseLastMonth
      ),
    });
  } catch (error) {
    console.error(
      "GetSummary Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/*
====================================
CATEGORY BREAKDOWN
GET /api/dashboard/category-breakdown
====================================
*/
export const getCategoryBreakdown = async (
  req,
  res
) => {
  try {
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const transactions =
      await Transaction.find({
        user_id: req.user_id,
        type: "expense",
        transaction_date: {
          $gte: monthStart,
        },
      }).populate(
        "category_id",
        "name icon color"
      );

    const categoryMap = {};

    transactions.forEach((tx) => {
      if (!tx.category_id) return;

      const categoryId =
        tx.category_id._id.toString();

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          category_id: categoryId,
          category_name:
            tx.category_id.name,
          category_icon:
            tx.category_id.icon,
          category_color:
            tx.category_id.color,
          total: 0,
          transaction_count: 0,
        };
      }

      categoryMap[categoryId].total +=
        Number(tx.amount);

      categoryMap[
        categoryId
      ].transaction_count += 1;
    });

    const breakdown = Object.values(
      categoryMap
    ).sort((a, b) => b.total - a.total);

    res.status(200).json(breakdown);
  } catch (error) {
    console.error(
      "GetCategoryBreakdown Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/*
====================================
MONTHLY TREND
GET /api/dashboard/monthly-trend
====================================
*/
export const getMonthlyTrend = async (
  req,
  res
) => {
  try {
    const transactions =
      await Transaction.find({
        user_id: req.user_id,
      });

    const monthMap = {};

    transactions.forEach((tx) => {
      const month =
        tx.transaction_date
          .toISOString()
          .slice(0, 7);

      if (!monthMap[month]) {
        monthMap[month] = {
          month,
          income: 0,
          expense: 0,
        };
      }

      if (tx.type === "income") {
        monthMap[month].income +=
          Number(tx.amount);
      }

      if (tx.type === "expense") {
        monthMap[month].expense +=
          Number(tx.amount);
      }
    });

    const result = Object.values(
      monthMap
    ).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(
      "GetMonthlyTrend Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};