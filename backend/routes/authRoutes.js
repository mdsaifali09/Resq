
import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/authController.js";

import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/authController.js";



import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);

router.get("/me", authMiddleware, getMyProfile);

router.put("/profile", authMiddleware, updateMyProfile);

export default router;
