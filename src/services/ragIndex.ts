// src/services/ragIndex.ts
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { connect, Table } from "@lancedb/lancedb";
import OpenAI from "openai";
import { loadTxtDocs } from "../utils/files";
import { chunkText } from "../utils/chunk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANCE_DIR = path.resolve("./.lancedb");
const TABLE_NAME = "knowledge_chunks";
const EMBEDDING_MODEL = "text-embedding-3-large";

type Row = {
  id: string;
  text: string;
  source: string;
  vector: number[];
};

export async function buildIndex(knowledgeDir = "./knowledge"): Promise<void> {
  const docs = loadTxtDocs(knowledgeDir);
  console.log("📖 Debug: Loading docs from:", knowledgeDir);
  if (docs.length === 0) {
    console.log("⚠️ No .txt files found in", knowledgeDir);
    return;
  }
  console.log(`📂 Found ${docs.length} documents.`);

  // Chunk all documents
  const chunks: { id: string; text: string; source: string }[] = [];
  for (const doc of docs) {
    const parts = chunkText(doc.content);
    parts.forEach((p, idx) => {
      chunks.push({
        id: `${doc.id}::${idx}`,
        text: p,
        source: doc.source
      });
    });
  }
  console.log(`✂️ Prepared ${chunks.length} chunks.`);

  // Embed chunks in small batches
  const rows: Row[] = [];
  const BATCH = 64;

  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const inputs = slice.map(s => s.text);

    const emb = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputs
    });

    emb.data.forEach((d, j) => {
      const c = slice[j];
      rows.push({
        id: c.id,
        text: c.text,
        source: c.source,
        vector: d.embedding as unknown as number[]
      });
    });

    console.log(`🧠 Embedded ${Math.min(i + BATCH, chunks.length)} / ${chunks.length}`);
  }

  // Store in LanceDB
  const db = await connect(LANCE_DIR);
  const tableExists = (await db.tableNames()).includes(TABLE_NAME);
  let table: Table;

  if (tableExists) {
    table = await db.openTable(TABLE_NAME);
    await table.add(rows);
  } else {
    table = await db.createTable(TABLE_NAME, rows);
  }

  const count = await table.countRows();
  console.log(`✅ Index build complete. Rows in table: ${count}`);


}

// Run directly: npx ts-node src/services/ragIndex.ts
if (require.main === module) {
  buildIndex().catch((e) => {
    console.error("❌ Index build failed:", e);
    process.exit(1);
  });
}
