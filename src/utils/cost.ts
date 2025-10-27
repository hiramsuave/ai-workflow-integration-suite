// src/utils/cost.ts
export type Usage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };

const IN_RATE = Number(process.env.COST_INPUT_PER_1K || 0.0005);
const OUT_RATE = Number(process.env.COST_OUTPUT_PER_1K || 0.0015);

export function estimateCost(usage: Usage | undefined) {
  if (!usage) return 0;
  const inTok = usage.prompt_tokens || 0;
  const outTok = usage.completion_tokens || 0;
  const cost = (inTok / 1000) * IN_RATE + (outTok / 1000) * OUT_RATE;
  return Number(cost.toFixed(6));
}

export function tokensFromUsage(usage: Usage | undefined) {
  return usage?.total_tokens || ((usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0));
}
