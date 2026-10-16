import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  logger.info("Database Connected");
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export default connectDB;
