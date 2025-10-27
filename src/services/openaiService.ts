import OpenAI from "openai";
import dotenv from "dotenv";
import { Response } from "express";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//
// 🧠 Standard (non-streaming) version
//
export async function getAIResponse(message: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    const text = response.choices[0].message.content ?? "No response received.";
    const usage = response.usage;
    return { text, usage };
  } catch (error: any) {
    console.error("Error in getAIResponse:", error);
    return { text: "An error occurred while generating the response.", usage: null };
  }
}

//
// ⚡ Streaming version (Server-Sent Events compatible)
//
export async function streamAIResponse(message: string, res: Response) {
  try {
    const stream = await openai.chat.completions.stream({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    // Configure streaming headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send streamed tokens as they arrive
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(content);
    }

    res.end();
  } catch (error: any) {
    console.error("Streaming error:", error);
    res.status(500).end("Error during streaming");
  }
}
