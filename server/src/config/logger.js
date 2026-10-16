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
  redact: [
    "password",
    "*.password",
    "token",
    "*.token",
    "refreshToken",
    "*.refreshToken",
    "headers.authorization",
    "*.headers.authorization",
    "headers.cookie",
    "*.headers.cookie",
  ],
});

export default logger;
