// src/utils/logger.ts
export const logger = {
  info: (msg: string, meta: Record<string, any> = {}) =>
    console.log(JSON.stringify({ level: "info", ts: new Date().toISOString(), msg, ...meta })),
  error: (msg: string, meta: Record<string, any> = {}) =>
    console.error(JSON.stringify({ level: "error", ts: new Date().toISOString(), msg, ...meta })),
};
