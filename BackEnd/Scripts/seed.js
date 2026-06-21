import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "../Models/User.js";
import Category from "../Models/Category.js";
import Transaction from "../Models/Transaction.js";
import Budget from "../Models/Budget.js";
import defaultCategories from "../Utils/defaultCategories.js";

dotenv.config();

await mongoose.connect(process.env.DATABASE_URL);

const DEMO_USER = {
  name: "Sai",
  email: "sai@gmail.com",
  password: "123456",
  currency: "USD",
};

const BUDGETS = [
  {
    name: "Food & Dining",
    amount: 600,
  },
  {
    name: "Groceries",
    amount: 500,
  },
  {
    name: "Entertainment",
    amount: 120,
  },
  {
    name: "Transportation",
    amount: 350,
  },
  {
    name: "Shopping",
    amount: 200,
  },
];

async function seed() {
  try {
    console.log("Cleaning old demo user...");

    const existingUser = await User.findOne({
      email: DEMO_USER.email,
    });

    if (existingUser) {
      await Category.deleteMany({
        user_id: existingUser._id,
      });

      await Transaction.deleteMany({
        user_id: existingUser._id,
      });

      await Budget.deleteMany({
        user_id: existingUser._id,
      });

      await User.findByIdAndDelete(
        existingUser._id
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        DEMO_USER.password,
        10
      );

    const user = await User.create({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      passwordHash: hashedPassword,
      currency: DEMO_USER.currency,
    });

    console.log(
      "Demo user created:",
      user.email
    );

    const categories =
      defaultCategories.map((cat) => ({
        ...cat,
        user_id: user._id,
        is_default: true,
      }));

    const insertedCategories =
      await Category.insertMany(
        categories
      );

    console.log(
      insertedCategories.length,
      "categories inserted"
    );

    const categoryMap = {};

    insertedCategories.forEach((c) => {
      categoryMap[c.name] = c._id;
    });

    const transactions = [];

    for (let i = 1; i <= 30; i++) {
      transactions.push({
        user_id: user._id,
        category_id:
          categoryMap["Food & Dining"],
        amount:
          Math.floor(
            Math.random() * 50
          ) + 10,
        type: "expense",
        description: "Restaurant",
        transaction_date: new Date(
          2026,
          5,
          i
        ),
      });

      transactions.push({
        user_id: user._id,
        category_id:
          categoryMap["Transportation"],
        amount:
          Math.floor(
            Math.random() * 20
          ) + 5,
        type: "expense",
        description: "Travel",
        transaction_date: new Date(
          2026,
          5,
          i
        ),
      });
    }

    transactions.push({
      user_id: user._id,
      category_id:
        categoryMap["Salary"],
      amount: 2500,
      type: "income",
      description: "Salary",
      transaction_date: new Date(),
    });

    await Transaction.insertMany(
      transactions
    );

    console.log(
      transactions.length,
      "transactions inserted"
    );

    const budgetDocs = BUDGETS.map(
      (budget) => ({
        user_id: user._id,
        category_id:
          categoryMap[budget.name],
        amount: budget.amount,
        period: "monthly",
        start_date: new Date(),
      })
    );

    await Budget.insertMany(
      budgetDocs
    );

    console.log(
      budgetDocs.length,
      "budgets inserted"
    );

    console.log(
      "\nSeed completed successfully"
    );

    console.log(
      "Email:",
      DEMO_USER.email
    );

    console.log(
      "Password:",
      DEMO_USER.password
    );

    process.exit(0);
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

seed();