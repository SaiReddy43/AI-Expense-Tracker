import express from "express";
import protect from "../MiddleWares/authMiddleware.js";

import {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
} from "../Controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/summary",
  protect,
  getSummary
);

router.get(
  "/category-breakdown",
  protect,
  getCategoryBreakdown
);

router.get(
  "/monthly-trend",
  protect,
  getMonthlyTrend
);

export default router;