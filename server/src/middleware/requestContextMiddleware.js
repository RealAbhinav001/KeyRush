import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();

export const requestContextMiddleware = (_req, res, next) => {
  const store = {};

  const requestId = crypto.randomUUID();
  store["requestId"] = requestId;

  res.set("X-Request-ID", requestId);

  requestContext.run(store, () => {
    next();
  });
};

export const getRequestID = () => {
  const store = requestContext.getStore();
  return store?.["requestId"];
};
