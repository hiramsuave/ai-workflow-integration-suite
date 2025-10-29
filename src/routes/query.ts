// src/routes/query.ts
import express from "express";
import { askQuestion } from "../services/ragQuery";

const router = express.Router();

/**
 * POST /api/query
 * Request Body: { "question": "What does RAG mean?" }
 */
router.post("/", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'question' field." });
    }

    const result = await askQuestion(question);

    res.json({
      success: true,
      answer: result.answer,
      citations: Array.from(new Set(result.citations)), // deduplicate
    });
  } catch (err: any) {
    console.error("❌ RAG Query Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error", details: err.message });
  }
});

export default router;
