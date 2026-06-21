import express from "express";

import {
  getInsights,
  generateInsight
} from "../Controllers/insightController.js";

import protect from "../MiddleWares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getInsights);

router.post(
  "/generate",
  generateInsight
);

export default router;