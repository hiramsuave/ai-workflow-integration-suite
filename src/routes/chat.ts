// src/routes/chat.ts
import express, { Request, Response } from "express";
import { performance } from "perf_hooks";
import { getAIResponse, streamAIResponse } from "../services/openaiService";
import { estimateCost, tokensFromUsage } from "../utils/cost";
import { asyncHandler } from "../middleware/http";

const router = express.Router();

// Non-streaming route
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const start = performance.now();
  const { text, usage } = await getAIResponse(message);
  const end = performance.now();

  const latency = Number((end - start).toFixed(2));
  const tokens = tokensFromUsage(usage);
  const cost = estimateCost(usage);

  res.setHeader("X-Latency", `${latency}ms`);
  res.setHeader("X-Tokens-Used", String(tokens));
  res.setHeader("X-Estimated-Cost", String(cost));

  res.json({ reply: text, usage, meta: { latency_ms: latency, estimated_cost: cost } });
}));

// Streaming route
router.post("/stream", asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).end("Message required");
  await streamAIResponse(message, res);
}));

export default router;
