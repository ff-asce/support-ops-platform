import { Router, Request, Response } from "express";
import { getDatabaseStatus } from "../utils/database";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    db: dbStatus,
    timestamp: new Date().toISOString(),
    service: "ticket-service",
  });
});

export default router;

