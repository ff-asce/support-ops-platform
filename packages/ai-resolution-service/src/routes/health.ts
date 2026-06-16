import { Router, Request, Response } from "express";
import { getDatabaseStatus } from "../utils/database";
import { isAnthropicAvailable } from "../utils/anthropic";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const aiAvailable = isAnthropicAvailable();
  const isHealthy = dbStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    db: dbStatus,
    ai: aiAvailable ? "available" : "unavailable",
    timestamp: new Date().toISOString(),
    service: "ai-resolution-service",
  });
});

export default router;

