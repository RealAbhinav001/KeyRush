import pino from "pino";
import { getRequestId } from "../utils/requestContext.js";

const logger = pino({
  mixin() {
    return { requestId: getRequestId() };
  },
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
  level: process.env.LOG_LEVEL || "info",
});

export default logger;
