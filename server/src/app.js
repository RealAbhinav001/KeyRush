import express from "express";
import { isDbConnected } from "./config/db.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import ApiError from "./utils/apiError.js";

const app = express();

app.use(express.json({ limit: "10kb" }));

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

app.use((req) => {
  throw new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`, "NOT_FOUND");
});

app.use(errorMiddleware);

export default app;
