
import "dotenv/config";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import sosHistoryRoutes from "./routes/sosHistoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

import connectDB from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

console.log(
  "Gemini API key loaded:",
  Boolean(process.env.GEMINI_API_KEY)
);

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/sos-history", sosHistoryRoutes);
app.use("/api/ai", aiRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ResQ API is running 🚨",
  });
});

app.listen(PORT, () => {
  console.log(`ResQ server running on port ${PORT}`);
});
