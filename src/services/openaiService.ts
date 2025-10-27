import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Standard non-streaming
// src/services/openaiService.ts
export async function getAIResponse(message: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }],
  });

  const text = response.choices[0].message.content ?? "No response received.";
  const usage = response.usage;
  return { text, usage };
}


// Streaming version
export async function streamAIResponse(message: string, res: any) {
  try {
    const stream = await client.chat.completions.stream({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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
