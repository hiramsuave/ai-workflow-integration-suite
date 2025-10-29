"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/chat.ts
const express_1 = __importDefault(require("express"));
const perf_hooks_1 = require("perf_hooks");
const openaiService_1 = require("../services/openaiService");
const cost_1 = require("../utils/cost");
const http_1 = require("../middleware/http");
const router = express_1.default.Router();
// Non-streaming route
router.post("/", (0, http_1.asyncHandler)(async (req, res) => {
    const { message } = req.body;
    if (!message)
        return res.status(400).json({ error: "Message required" });
    const start = perf_hooks_1.performance.now();
    const { text, usage } = await (0, openaiService_1.getAIResponse)(message);
    const end = perf_hooks_1.performance.now();
    const latency = Number((end - start).toFixed(2));
    const tokens = (0, cost_1.tokensFromUsage)(usage);
    const cost = (0, cost_1.estimateCost)(usage);
    res.setHeader("X-Latency", `${latency}ms`);
    res.setHeader("X-Tokens-Used", String(tokens));
    res.setHeader("X-Estimated-Cost", String(cost));
    res.json({ reply: text, usage, meta: { latency_ms: latency, estimated_cost: cost } });
}));
// Streaming route
router.post("/stream", (0, http_1.asyncHandler)(async (req, res) => {
    const { message } = req.body;
    if (!message)
        return res.status(400).end("Message required");
    await (0, openaiService_1.streamAIResponse)(message, res);
}));
exports.default = router;
