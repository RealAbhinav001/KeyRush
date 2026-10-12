import crypto from "node:crypto";
import { requestContext } from "../utils/requestContext.js";

export const requestContextMiddleware = (_req, res, next) => {
  const store = {};

  const requestId = crypto.randomUUID();
  store.requestId = requestId;

  res.set("X-Request-ID", requestId);

  requestContext.run(store, () => {
    next();
  });
};
