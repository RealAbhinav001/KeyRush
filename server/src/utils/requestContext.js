import { AsyncLocalStorage } from "node:async_hooks";

export const requestContext = new AsyncLocalStorage();

export const getRequestId = () => {
  const store = requestContext.getStore();
  return store?.requestId;
};
