
import express from "express";
import {
  createSOSHistory,
  getSOSHistory,
  deleteSOSHistory,
  updateSOSHistory,
} from "../controllers/sosHistoryController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createSOSHistory);
router.get("/", authMiddleware, getSOSHistory);
router.delete("/:id", authMiddleware, deleteSOSHistory);
router.patch("/:id", authMiddleware, updateSOSHistory);

export default router;
