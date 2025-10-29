// src/services/ragQuery.ts
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import OpenAI from "openai";
import { connect } from "@lancedb/lancedb";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANCE_DIR = path.resolve("./.lancedb");
const TABLE_NAME = "knowledge_chunks";
const EMBEDDING_MODEL = "text-embedding-3-large";

/**
 * Retrieve top-K most relevant chunks and ask OpenAI to answer using them.
 */
export async function askQuestion(question: string, topK = 10) {
  // 1️⃣ Embed the user question
  const qEmbedding = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: [question],
  });
  const vector = qEmbedding.data[0].embedding as number[];

// 2️⃣ Connect to LanceDB and search
const db = await connect(LANCE_DIR);
const table = await db.openTable(TABLE_NAME);

const search = table.search(vector).limit(topK).select(["id", "text", "source"]);

const results: any[] = [];

// Newer LanceDB returns RecordBatchIterator, not plain rows
for await (const batch of search) {
  const columns = batch.toArray(); // convert Arrow RecordBatch to JS objects
  for (const row of columns) {
    results.push(row);
  }
}

console.log(`🔍 Retrieved ${results.length} candidate chunks.`);



  if (results.length === 0) {
    console.log("ℹ️ No similar chunks returned.");
  }

  const contextTexts: string[] = results.map(r => r.text ?? "");
  const citations: string[] = results.map(r => r.source ?? "unknown");

  // 🛡️ Guard: if context is empty, avoid hallucinations
  if (!contextTexts.some(t => t && t.trim().length > 0)) {
    return { answer: "I don't know based on the provided documents.", citations: [] };
  }

  // 3️⃣ Build a grounded prompt
  const contextBlock = contextTexts.join("\n\n");
  const prompt = `Use the context below to answer the user's question.
If the answer isn't in the context, say "I don't know based on the provided documents."
Always include citations from the provided sources.

Context:
${contextBlock}

Question: ${question}
Answer (include citations):`;

  // 4️⃣ Ask OpenAI for a grounded answer
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const answer = completion.choices[0]?.message?.content ?? "No answer found.";

  return { answer, citations };
}

// Allow quick command-line testing
if (require.main === module) {
  const question = process.argv.slice(2).join(" ") || "What is RAG?";
  askQuestion(question).then((res) => {
    console.log("\n🧠 Answer:", res.answer);
    console.log("\n📚 Citations:", res.citations);
  });
}
