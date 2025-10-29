// src/utils/files.ts
import fs from "fs";
import path from "path";

export type Doc = { id: string; content: string; source: string };

export function loadTxtDocs(dir: string): Doc[] {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs)) return [];

  const files = fs.readdirSync(abs).filter(f => f.toLowerCase().endsWith(".txt"));
  const docs: Doc[] = [];

  for (const f of files) {
    const p = path.join(abs, f);
    const content = fs.readFileSync(p, "utf8");
    docs.push({
      id: f,
      content,
      source: f
    });
  }

  return docs;
}
