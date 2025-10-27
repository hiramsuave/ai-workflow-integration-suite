import OpenAI from "openai";
import dotenv from "dotenv";
import type { Response } from "express";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Non-streaming: returns { text, usage }
export async function getAIResponse(message: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    const text = response.choices[0]?.message?.content ?? "No response received.";
    const usage = response.usage; // { prompt_tokens, completion_tokens, total_tokens }
    return { text, usage };
  } catch (err) {
    console.error("getAIResponse error:", err);
    // IMPORTANT: return usage as undefined (NOT null) so types line up
    return { text: "An error occurred while generating the response.", usage: undefined };
  }
}

// Streaming (SSE) using create({ stream: true })
export async function streamAIResponse(message: string, res: Response) {
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
      if (content) res.write(content);
    }

    res.end();
  } catch (err) {
    console.error("streamAIResponse error:", err);
    // During SSE, headers/body may already be writing—keep it simple:
    try { res.status(500).end("Error during streaming"); } catch { /* noop */ }
  }
}
