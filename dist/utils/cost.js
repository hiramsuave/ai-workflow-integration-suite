"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCost = estimateCost;
exports.tokensFromUsage = tokensFromUsage;
const IN_RATE = Number(process.env.COST_INPUT_PER_1K || 0.0005);
const OUT_RATE = Number(process.env.COST_OUTPUT_PER_1K || 0.0015);
function estimateCost(usage) {
    if (!usage)
        return 0;
    const inTok = usage.prompt_tokens || 0;
    const outTok = usage.completion_tokens || 0;
    const cost = (inTok / 1000) * IN_RATE + (outTok / 1000) * OUT_RATE;
    return Number(cost.toFixed(6));
}
function tokensFromUsage(usage) {
    return usage?.total_tokens || ((usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0));
}
