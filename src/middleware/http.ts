// src/middleware/http.ts
import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function withRequestId(req: Request, res: Response, next: NextFunction) {
  const id = randomUUID();
  (req as any).requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}

export function asyncHandler(fn: any) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const id = (req as any).requestId;
  logger.error("Unhandled error", { requestId: id, err: String(err?.message || err) });
  res.status(500).json({ error: "Internal Server Error", requestId: id });
}
