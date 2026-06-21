import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  analyzeTransactions
} from "../Controllers/transactionController.js";
import { protect } from "../MiddleWares/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.post("/analyze", analyzeTransactions);
router.get("/:id", getTransactionById);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;