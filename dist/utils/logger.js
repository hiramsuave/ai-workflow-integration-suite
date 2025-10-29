"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// src/utils/logger.ts
exports.logger = {
    info: (msg, meta = {}) => console.log(JSON.stringify({ level: "info", ts: new Date().toISOString(), msg, ...meta })),
    error: (msg, meta = {}) => console.error(JSON.stringify({ level: "error", ts: new Date().toISOString(), msg, ...meta })),
};
