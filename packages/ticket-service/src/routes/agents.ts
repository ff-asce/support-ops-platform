import { Router, Request, Response, NextFunction } from "express";
import { AgentModel } from "../models/Agent";
import { ErrorCodes, AppError } from "@support-ops/shared";
import { logger } from "../utils/logger";

const router = Router();

// GET /agents/:id - Get agent by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await AgentModel.findOne({ agentId: req.params.id })
      .select("-passwordHash")
      .lean();

    if (!agent) {
      throw new AppError(
        ErrorCodes.AGENT_NOT_FOUND,
        "Agent not found",
        { agentId: req.params.id },
        404
      );
    }

    logger.info({ agentId: agent.agentId }, "Agent retrieved");
    res.json(agent);
  } catch (error) {
    next(error);
  }
});

// POST /agents - Create agent (for seeding/admin)
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role, passwordHash } = req.body;

    // Check if agent already exists
    const existing = await AgentModel.findOne({ email });
    if (existing) {
      throw new AppError(
        ErrorCodes.AGENT_ALREADY_EXISTS,
        "Agent with this email already exists",
        { email },
        409
      );
    }

    const agent = new AgentModel({
      name,
      email,
      role: role || "agent",
      passwordHash,
      activeTickets: 0,
    });

    await agent.save();

    logger.info({ agentId: agent.agentId, email }, "Agent created");

    // Return without password hash
    const agentObj: any = agent.toObject();
    delete agentObj.passwordHash;

    res.status(201).json(agentObj);
  } catch (error) {
    next(error);
  }
});

// GET /agents - List all agents
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await AgentModel.find()
      .select("-passwordHash")
      .sort({ name: 1 })
      .lean();

    logger.info({ count: agents.length }, "Agents listed");
    res.json(agents);
  } catch (error) {
    next(error);
  }
});

export default router;

// Made with Bob
