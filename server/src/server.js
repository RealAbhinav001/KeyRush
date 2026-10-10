import app from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 4000;

const shutdownDataBase = async () => {
  try {
    await disconnectDB();
    logger.info("Database Disconnected");
    process.exit(0);
  } catch (error) {
    logger.fatal(error, "Error During Resource CleanUp");
    process.exit(1);
  }
};

let server;
let isShuttingDown = false;

const startUp = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, (error) => {
      if (error) {
        logger.fatal(error, "Failed to start server");
        process.exit(1);
      }

      logger.info(`Keyrush server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.fatal(error, "Failed to start server");
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close((err) => {
      if (err) {
        logger.fatal(err, "Error During Resource Cleanup");
        process.exit(1);
      } else {
        logger.info("HTTP server closed. Active requests finished.");
        shutdownDataBase();
      }
    });
  } else {
    shutdownDataBase();
  }

  setTimeout(() => {
    logger.fatal("ShutDown Time Exceed.Forcing Shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startUp();
