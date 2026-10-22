
import express from "express";

import {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
} from "../controllers/contactController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require login
router.use(authMiddleware);

// Add emergency contact
router.post("/", addContact);

// Get all emergency contacts
router.get("/", getContacts);

// Update emergency contact
router.put("/:id", updateContact);

// Delete emergency contact
router.delete("/:id", deleteContact);

export default router;
