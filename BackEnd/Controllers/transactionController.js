import Transaction from "../Models/Transaction.js";
import { analyzeTransactionList } from "../Utils/geminiApi.js";
import User from "../Models/User.js";

export const createTransaction = async (req, res) => {
  try {
    const {
      category_id,
      amount,
      type,
      description,
      notes,
      transaction_date
    } = req.body;

    const transaction = await Transaction.create({
      user_id: req.user_id,
      category_id,
      amount,
      type,
      description,
      notes,
      transaction_date
    });

    const populatedTransaction = await Transaction.findById(
      transaction._id
    ).populate("category_id");

    res.status(201).json(populatedTransaction);

  } catch (error) {
    console.error("Create Transaction Error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


export const getTransactions = async (req, res) => {
  try {

    const {
      startDate,
      endDate,
      category_id,
      type,
      search,
      limit = 50,
      page = 1
    } = req.query;

    const filter = {
      user_id: req.user_id
    };

    if (startDate || endDate) {

      filter.transaction_date = {};

      if (startDate) {
        filter.transaction_date.$gte =
          new Date(startDate);
      }

      if (endDate) {
        filter.transaction_date.$lte =
          new Date(endDate);
      }
    }

    if (category_id) {
      filter.category_id = category_id;
    }

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        {
          description: {
            $regex: search,
            $options: "i"
          }
        },
        {
          notes: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    const transactions = await Transaction
      .find(filter)
      .populate({
        path: "category_id",
        select: "name icon color"
      })
      .sort({
        transaction_date: -1,
        _id: -1
      })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Transaction.countDocuments(
      filter
    );

    res.status(200).json({
      total,
      page: Number(page),
      transactions
    });

  } catch (error) {

    console.error(
      "Get Transactions Error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};


export const getTransactionById = async (
  req,
  res
) => {
  try {

    const transaction =
      await Transaction.findOne({
        _id: req.params.id,
        user_id: req.user_id
      }).populate({
        path: "category_id",
        select: "name icon color"
      });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    res.status(200).json(transaction);

  } catch (error) {

    console.error(
      "Get Transaction By Id Error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};


export const updateTransaction = async (
  req,
  res
) => {
  try {

    const transaction =
      await Transaction.findOneAndUpdate(
        {
          _id: req.params.id,
          user_id: req.user_id
        },
        req.body,
        {
          new: true,
          runValidators: true
        }
      ).populate({
        path: "category_id",
        select: "name icon color"
      });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    res.status(200).json(transaction);

  } catch (error) {

    console.error(
      "Update Transaction Error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};


export const deleteTransaction = async (
  req,
  res
) => {
  try {

    const transaction =
      await Transaction.findOneAndDelete({
        _id: req.params.id,
        user_id: req.user_id
      });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Transaction deleted successfully"
    });

  } catch (error) {

    console.error(
      "Delete Transaction Error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

export const analyzeTransactions = async (
  req,
  res
) => {
  try {
    const { transactionIds } = req.body;

    if (
      !Array.isArray(transactionIds) ||
      transactionIds.length === 0
    ) {
      return res.status(400).json({
        message:
          "transactionIds array is required",
      });
    }

    // limit to 50 transactions
    const ids = transactionIds.slice(0, 50);

    // fetch transactions
    const transactions =
      await Transaction.find({
        _id: { $in: ids },
        user_id: req.user_id,
      }).populate(
        "category_id",
        "name"
      );

    if (transactions.length === 0) {
      return res.status(404).json({
        message:
          "No transactions found for analysis",
      });
    }

    // fetch user currency
    const user =
      await User.findById(req.user_id);

    const currency =
      user?.currency || "USD";

    // format data for Gemini
    const formattedTransactions =
      transactions.map((t) => ({
        transaction_date:
          t.transaction_date,
        amount: t.amount,
        type: t.type,
        description:
          t.description || "",
        category_name:
          t.category_id?.name ||
          "Uncategorized",
      }));

    // AI Analysis
    const analysis =
      await analyzeTransactionList({
        transactions:
          formattedTransactions,
        currency,
      });

    return res.status(200).json(
      analysis
    );
  } catch (error) {
    console.error(
      "AnalyzeTransactions Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Server Error",
    });
  }
};