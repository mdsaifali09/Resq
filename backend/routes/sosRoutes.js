
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { prepareSOSAlert } from "../controllers/sosController.js";

const router = express.Router();

router.post("/alert", authMiddleware, prepareSOSAlert);

export default router;
