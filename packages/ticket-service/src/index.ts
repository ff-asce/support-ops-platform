import express from "express";
import dotenv from "dotenv";
import { connectDatabase } from "./utils/database";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import ticketsRouter from "./routes/tickets";
import agentsRouter from "./routes/agents";
import healthRouter from "./routes/health";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/support-ops";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      requestId: req.headers["x-request-id"],
    }, "Request completed");
  });
  
  next();
});

// Routes
app.use("/health", healthRouter);
app.use("/tickets", ticketsRouter);
app.use("/agents", agentsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: "NOT_FOUND",
    message: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Connect to database
    await connectDatabase(MONGODB_URI);
    
    // Start listening
    app.listen(PORT, () => {
      logger.info({ port: PORT }, "Ticket service started");
    });
  } catch (error) {
    logger.error({ error }, "Failed to start ticket service");
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start the server
start();

// Made with Bob
