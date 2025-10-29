// src/utils/chunk.ts

// 1) If the doc contains Q:/A: style FAQs, split those first into atomic chunks.
// 2) Otherwise fall back to sliding window sentence-ish chunking.

export function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();

  // First: extract Q/A blocks if present
  const faqChunks = extractQAChunks(cleaned);
  if (faqChunks.length > 0) {
    return faqChunks;
  }

  // Fallback: sliding window chunking with soft sentence boundary
  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + chunkSize, cleaned.length);
    let slice = cleaned.slice(i, end);

    const lastPeriod = slice.lastIndexOf(".");
    if (end < cleaned.length && lastPeriod > chunkSize * 0.6) {
      slice = slice.slice(0, lastPeriod + 1);
    }

    chunks.push(slice.trim());
    i += Math.max(slice.length - overlap, 1);
  }
  return chunks.filter(Boolean);
}

function extractQAChunks(text: string): string[] {
  // Split on blank-line or line breaks while preserving Q/A structure.
  // We'll collect minimal Q/A pairs as separate chunks.
  const lines = text.split(/\n+/);
  const chunks: string[] = [];
  let currentQ: string | null = null;
  let currentA: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^Q\s*:/i.test(line)) {
      // Flush previous
      if (currentQ) {
        chunks.push(formatQA(currentQ, currentA.join(" ").trim()));
      }
      currentQ = line.replace(/^Q\s*:\s*/i, "").trim();
      currentA = [];
    } else if (/^A\s*:/i.test(line)) {
      const ans = line.replace(/^A\s*:\s*/i, "").trim();
      currentA.push(ans);
    } else {
      // Continuation of an answer or context
      if (currentQ) currentA.push(line);
    }
  }

  // Flush trailing
  if (currentQ) {
    chunks.push(formatQA(currentQ, currentA.join(" ").trim()));
  }

  // Only return if we actually found any Q/A pairs
  return chunks.filter(Boolean);
}

function formatQA(q: string, a: string): string {
  return `Q: ${q}\nA: ${a}`;
}
