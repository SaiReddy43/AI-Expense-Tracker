import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "⚠ WARNING: GEMINI_API_KEY is not set. AI features will not work."
  );
}

const stripMarkdown = (text) => {
  let cleaned = text.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned
      .replace(/```json\n?/g, "")
      .replace(/```\n?$/g, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```\n?/g, "");
  }

  return cleaned.trim();
};

/*
====================================
MONTHLY INSIGHT
====================================
*/
export const generateMonthlyInsight = async ({
  totalIncome,
  totalExpenses,
  savingsRate,
  expenseBreakdown,
  previousMonths,
  currency = "USD",
}) => {
  const breakdownText =
    expenseBreakdown.length > 0
      ? expenseBreakdown
          .map(
            (c) =>
              `${c.category}: ${currency} ${Number(
                c.amount
              ).toFixed(2)}`
          )
          .join("\n")
      : "No expenses recorded.";

  const trendText =
    previousMonths.length > 0
      ? previousMonths
          .map(
            (m) =>
              `${m.month}: Income ${currency} ${m.income}, Expense ${currency} ${m.expense}`
          )
          .join("\n")
      : "No trend data.";

  const prompt = `
Analyze this user's financial data.

Income: ${currency} ${totalIncome}
Expenses: ${currency} ${totalExpenses}
Savings Rate: ${savingsRate}%

Expense Breakdown:
${breakdownText}

Monthly Trend:
${trendText}

Return ONLY valid JSON:

{
  "summary":"string",
  "highlights":["string","string"],
  "concerns":["string","string"],
  "recommendations":[
    {
      "title":"string",
      "detail":"string"
    }
  ],
  "topSpendingCategory":"string",
  "estimatedMonthlySavings":0,
  "healthScore":0
}
`;

  try {
    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

    const cleaned = stripMarkdown(
      response.text
    );

    return JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "Gemini Monthly Insight Error:",
      error
    );

    return {
  summary:
    "Monthly analysis unavailable.",
  highlights: [],
  concerns: [],
  recommendations: [],
  topSpendingCategory: "",
  estimatedMonthlySavings: 0,
  healthScore: 50
};
  }
};

/*
====================================
BUDGET ALERT
====================================
*/
export const generateBudgetAlert = async ({
  categoryName,
  budgetAmount,
  spentAmount,
  daysIntoPeriod,
  totalPeriodDays,
  currency = "USD",
}) => {
  const percentUsed = (
    (spentAmount / budgetAmount) *
    100
  ).toFixed(1);

  const daysLeft =
    totalPeriodDays - daysIntoPeriod;

  const prompt = `
A user is tracking a budget.

Category: ${categoryName}
Budget: ${currency} ${budgetAmount}
Spent: ${currency} ${spentAmount}
Usage: ${percentUsed}%
Days Remaining: ${daysLeft}

Return ONLY JSON:

{
  "severity":"info",
  "title":"string",
  "message":"string",
  "suggestions":[
    "string",
    "string",
    "string"
  ]
}
`;

  try {
    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

    const cleaned = stripMarkdown(
      response.text
    );

    return JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "Gemini Budget Alert Error:",
      error
    );

    throw new Error(
      "Failed to generate budget alert"
    );
  }
};

/*
====================================
SAVINGS TIPS
====================================
*/
export const generateSavingsTips =
  async ({
    topCategories,
    monthlyIncome,
    currency = "USD",
  }) => {
    const categoryText =
      topCategories.length > 0
        ? topCategories
            .map(
              (c) =>
                `${c.category}: ${currency} ${c.amount}`
            )
            .join("\n")
        : "No spending data";

    const prompt = `
Generate personalized savings tips.

Monthly Income:
${currency} ${monthlyIncome}

Top Spending Categories:
${categoryText}

Return ONLY JSON:

{
  "overallTip":"string",
  "tips":[
    {
      "category":"string",
      "title":"string",
      "detail":"string",
      "estimatedSavings":0
    }
  ]
}
`;

    try {
      const response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

      const cleaned =
        stripMarkdown(response.text);

      return JSON.parse(cleaned);
    } catch (error) {
  console.error(
    "Gemini Savings Tips Error:",
    error
  );

  return {
    overallTip:
      "Reduce spending in your highest expense categories and track recurring purchases.",
    tips: [
      {
        category: "General",
        title: "Review Expenses",
        detail:
          "Review your recent transactions and identify non-essential spending.",
        estimatedSavings: 500
      }
    ]
  };
}
  };

/*
====================================
TRANSACTION ANALYSIS
====================================
*/
export const analyzeTransactionList =
  async ({
    transactions,
    currency = "USD",
  }) => {
    const lines = transactions
      .slice(0, 50)
      .map((t) => {
        const date =
          new Date(
            t.transaction_date
          )
            .toISOString()
            .split("T")[0];

        return `${date} | ${t.type} | ${currency} ${t.amount} | ${
          t.category_name || "uncategorized"
        } | ${t.description || ""}`;
      })
      .join("\n");

    const prompt = `
Analyze these transactions.

${lines}

Return ONLY JSON:

{
  "insight":"string",
  "highlight":"string"
}
`;

    try {
      const response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

      const cleaned =
        stripMarkdown(response.text);

      return JSON.parse(cleaned);
    } catch (error) {
      console.error(
        "Gemini Transaction Analysis Error:",
        error
      );

      throw new Error(
        "Failed to analyze transactions"
      );
    }
  };

/*
====================================
BUDGET ANALYSIS
====================================
*/
export const analyzeBudgetList =
  async ({
    budgets,
    currency = "USD",
  }) => {
    const lines = budgets
      .map((b) => {
        const spent =
          Number(b.spent) || 0;

        const limit =
          Number(b.amount) || 0;

        const pct =
          limit > 0
            ? (
                (spent / limit) *
                100
              ).toFixed(1)
            : 0;

        return `
Category: ${b.category_name}
Budget: ${currency} ${limit}
Spent: ${currency} ${spent}
Usage: ${pct}%
`;
      })
      .join("\n");

    const prompt = `
Analyze these budgets.

${lines}

Return ONLY JSON:

{
  "analyses":[
    {
      "status":"good",
      "message":"string"
    }
  ]
}
`;

    try {
      const response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

      const cleaned =
        stripMarkdown(response.text);

      return JSON.parse(cleaned);
    } catch (error) {
      console.error(
        "Gemini Budget Analysis Error:",
        error
      );

      throw new Error(
        "Failed to analyze budgets"
      );
    }
  };

export default {
  generateMonthlyInsight,
  generateBudgetAlert,
  generateSavingsTips,
  analyzeTransactionList,
  analyzeBudgetList,
};