"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRequestId = withRequestId;
exports.asyncHandler = asyncHandler;
exports.errorHandler = errorHandler;
// src/middleware/http.ts
const crypto_1 = require("crypto");
const logger_1 = require("../utils/logger");
function withRequestId(req, res, next) {
    const id = (0, crypto_1.randomUUID)();
    req.requestId = id;
    res.setHeader("X-Request-Id", id);
    next();
}
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function errorHandler(err, req, res, _next) {
    const id = req.requestId;
    logger_1.logger.error("Unhandled error", { requestId: id, err: String(err?.message || err) });
    res.status(500).json({ error: "Internal Server Error", requestId: id });
}
