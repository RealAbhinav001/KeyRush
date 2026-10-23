import express from "express";
import { isDbConnected } from "./config/db.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import ApiError from "./utils/apiError.js";
import { requestContextMiddleware, requestLogger } from "./middleware/requestContextMiddleware.js";
import authRouter from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(requestContextMiddleware);
app.use(requestLogger);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  if (isDbConnected()) {
    res.json({
      status: "ok",
      db: "up",
    });
  } else {
    throw new ApiError(503, "Database is not connected", "SERVICE_UNAVAILABLE");
  }
});

app.use("/api/auth", authRouter);

app.use((req) => {
  throw new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`, "NOT_FOUND");
});

app.use(errorMiddleware);

export default app;
