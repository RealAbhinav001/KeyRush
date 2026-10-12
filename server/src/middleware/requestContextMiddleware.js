import crypto from "node:crypto";

const randomRequestId = (_req, res, next) => {
  res.set("X-Request-ID", crypto.randomUUID());

  next();
};

export default randomRequestId;
