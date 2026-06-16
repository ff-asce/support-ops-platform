import mongoose from "mongoose";
import { logger } from "./logger";

export async function connectDatabase(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    logger.info({ uri: uri.replace(/\/\/.*@/, "//<credentials>@") }, "Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  } catch (error) {
    logger.error({ error }, "Failed to disconnect from MongoDB");
    throw error;
  }
}

export function getDatabaseStatus(): string {
  const state = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[state] || "unknown";
}

// Made with Bob
