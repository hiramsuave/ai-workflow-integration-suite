// src/routes/query.ts
import express from "express";
import fs from "fs";
import path from "path";
import { askQuestion } from "../services/ragQuery";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🔹 fallback if LanceDB not available
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const KNOWLEDGE_DIR = path.resolve("./knowledge");

router.post("/", async (req, res) => {
  try {
    const question = req.body?.question || req.query?.question || "";
    if (!question) {
      return res.status(400).json({ success: false, error: "Missing question" });
    }

    const lanceDir = path.resolve("./.lancedb");
    const hasLance = fs.existsSync(lanceDir);

    let answer = "";
    let citations: string[] = [];

    if (hasLance) {
      // ✅ Use vector search when LanceDB is present
      const ragResult = await askQuestion(question);
      answer = ragResult.answer;
      citations = ragResult.citations;
    } else {
      // ⚙️ Fallback mode – read text from ./knowledge folder
      const docs = fs.readdirSync(KNOWLEDGE_DIR)
        .filter(f => f.endsWith(".txt"))
        .map(f => fs.readFileSync(path.join(KNOWLEDGE_DIR, f), "utf-8"));

      const context = docs.join("\n\n");
      const prompt = `Use the following context to answer the user's question.
If the answer isn't found, say "I don't know based on the provided documents."

Context:
${context}

Question: ${question}
Answer (include file names if possible):`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      answer = completion.choices[0]?.message?.content ?? "No answer found.";
      citations = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith(".txt"));
    }

    res.json({ success: true, answer, citations });
  } catch (err) {
    console.error("❌ RAG Query Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
