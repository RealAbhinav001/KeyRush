import crypto from "node:crypto";
import { requestContext } from "../utils/requestContext.js";
import logger from "../config/logger.js";

export const requestContextMiddleware = (_req, res, next) => {
  const store = {};

  const requestId = crypto.randomUUID();
  store.requestId = requestId;

  res.set("X-Request-ID", requestId);

  requestContext.run(store, () => {
    next();
  });
};

export const requestLogger = (req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const duration = performance.now() - start;
    const level = res.statusCode >= 500 ? "error" : "info";
    logger[level](
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(duration),
      },
      "Request Completed",
    );
  });

  next();
};
