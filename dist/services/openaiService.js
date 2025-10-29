"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIResponse = getAIResponse;
exports.streamAIResponse = streamAIResponse;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
// Non-streaming: returns { text, usage }
async function getAIResponse(message) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: message }],
        });
        const text = response.choices[0]?.message?.content ?? "No response received.";
        const usage = response.usage; // { prompt_tokens, completion_tokens, total_tokens }
        return { text, usage };
    }
    catch (err) {
        console.error("getAIResponse error:", err);
        // IMPORTANT: return usage as undefined (NOT null) so types line up
        return { text: "An error occurred while generating the response.", usage: undefined };
    }
}
// Streaming (SSE) using create({ stream: true })
async function streamAIResponse(message, res) {
    try {
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: message }],
            stream: true, // <-- correct v4 way
        });
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content)
                res.write(content);
        }
        res.end();
    }
    catch (err) {
        console.error("streamAIResponse error:", err);
        // During SSE, headers/body may already be writing—keep it simple:
        try {
            res.status(500).end("Error during streaming");
        }
        catch { /* noop */ }
    }
}
