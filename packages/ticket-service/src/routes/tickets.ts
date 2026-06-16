import { Router, Request, Response, NextFunction } from "express";
import { TicketModel } from "../models/Ticket";
import { AgentModel } from "../models/Agent";
import {
  CreateTicketSchema,
  UpdateTicketStatusSchema,
  AssignTicketSchema,
  ResolveTicketSchema,
  TicketFilterSchema,
  PaginationSchema,
  ErrorCodes,
  AppError,
  AISuggestionResponseSchema,
} from "@support-ops/shared";
import { validateStatusTransition } from "../utils/statusTransitions";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

const router = Router();

// GET /tickets - List tickets with filters and pagination
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = TicketFilterSchema.parse({
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      assignedAgentId: req.query.assignedAgentId,
      customerId: req.query.customerId,
      search: req.query.search,
    });

    const pagination = PaginationSchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });

    // Build MongoDB query
    const query: any = {};
    if (filter.status) query.status = filter.status;
    if (filter.priority) query.priority = filter.priority;
    if (filter.category) query.category = filter.category;
    if (filter.assignedAgentId) query.assignedAgentId = filter.assignedAgentId;
    if (filter.customerId) query.customerId = filter.customerId;
    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [tickets, total] = await Promise.all([
      TicketModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      TicketModel.countDocuments(query),
    ]);

    logger.info({ count: tickets.length, total, filter }, "Tickets listed");

    res.json({
      tickets,
      total,
      page: pagination.page,
      totalPages: Math.ceil(total / pagination.limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /tickets/:id - Get single ticket
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await TicketModel.findById(req.params.id).lean();

    if (!ticket) {
      throw new AppError(
        ErrorCodes.TICKET_NOT_FOUND,
        "Ticket not found",
        { ticketId: req.params.id },
        404
      );
    }

    logger.info({ ticketId: ticket.ticketId }, "Ticket retrieved");
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// POST /tickets - Create ticket
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateTicketSchema.parse(req.body);

    const ticket = new TicketModel({
      ...input,
      status: "open",
      auditLog: [
        {
          actor: "system",
          action: "created",
          diff: { status: "open" },
          timestamp: new Date(),
        },
      ],
    });

    await ticket.save();

    logger.info({ ticketId: ticket.ticketId }, "Ticket created");
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

// PATCH /tickets/:id/status - Update ticket status
router.patch("/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = UpdateTicketStatusSchema.parse(req.body);
    const actorId = req.headers["x-actor-id"] as string || "system";

    const ticket = await TicketModel.findById(req.params.id);

    if (!ticket) {
      throw new AppError(
        ErrorCodes.TICKET_NOT_FOUND,
        "Ticket not found",
        { ticketId: req.params.id },
        404
      );
    }

    // Validate status transition
    validateStatusTransition(ticket.status, status);

    const oldStatus = ticket.status;
    ticket.status = status;

    // Add audit log entry
    ticket.auditLog.push({
      actor: actorId,
      action: "status_changed",
      diff: { from: oldStatus, to: status, note },
      timestamp: new Date(),
    });

    await ticket.save();

    logger.info(
      { ticketId: ticket.ticketId, from: oldStatus, to: status },
      "Ticket status updated"
    );

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// PATCH /tickets/:id/assign - Assign ticket to agent
router.patch("/:id/assign", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = AssignTicketSchema.parse(req.body);
    const actorId = req.headers["x-actor-id"] as string || "system";

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const ticket = await TicketModel.findById(req.params.id).session(session);

      if (!ticket) {
        throw new AppError(
          ErrorCodes.TICKET_NOT_FOUND,
          "Ticket not found",
          { ticketId: req.params.id },
          404
        );
      }

      const agent = await AgentModel.findOne({ agentId }).session(session);

      if (!agent) {
        throw new AppError(
          ErrorCodes.AGENT_NOT_FOUND,
          "Agent not found",
          { agentId },
          404
        );
      }

      // Update previous agent's counter if exists
      if (ticket.assignedAgentId) {
        await AgentModel.findOneAndUpdate(
          { agentId: ticket.assignedAgentId },
          { $inc: { activeTickets: -1 } },
          { session }
        );
      }

      // Update new agent's counter
      await AgentModel.findOneAndUpdate(
        { agentId },
        { $inc: { activeTickets: 1 } },
        { session }
      );

      const oldAgentId = ticket.assignedAgentId;
      ticket.assignedAgentId = agentId;

      // Add audit log entry
      ticket.auditLog.push({
        actor: actorId,
        action: "assigned",
        diff: { from: oldAgentId, to: agentId },
        timestamp: new Date(),
      });

      await ticket.save({ session });
      await session.commitTransaction();

      logger.info(
        { ticketId: ticket.ticketId, agentId },
        "Ticket assigned"
      );

      res.json(ticket);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /tickets/:id/resolve - Mark ticket as resolved
router.patch("/:id/resolve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolution } = ResolveTicketSchema.parse(req.body);
    const actorId = req.headers["x-actor-id"] as string || "system";

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const ticket = await TicketModel.findById(req.params.id).session(session);

      if (!ticket) {
        throw new AppError(
          ErrorCodes.TICKET_NOT_FOUND,
          "Ticket not found",
          { ticketId: req.params.id },
          404
        );
      }

      if (ticket.status === "resolved") {
        throw new AppError(
          ErrorCodes.TICKET_ALREADY_RESOLVED,
          "Ticket is already resolved",
          { ticketId: ticket.ticketId },
          400
        );
      }

      // Validate status transition
      validateStatusTransition(ticket.status, "resolved");

      const oldStatus = ticket.status;
      ticket.status = "resolved";
      ticket.resolution = {
        text: resolution,
        resolvedBy: actorId,
        resolvedAt: new Date(),
      };

      // Add audit log entry
      ticket.auditLog.push({
        actor: actorId,
        action: "resolved",
        diff: { from: oldStatus, to: "resolved", resolution },
        timestamp: new Date(),
      });

      // Decrement agent's active tickets counter
      if (ticket.assignedAgentId) {
        await AgentModel.findOneAndUpdate(
          { agentId: ticket.assignedAgentId },
          { $inc: { activeTickets: -1 } },
          { session }
        );
      }

      await ticket.save({ session });
      await session.commitTransaction();

      logger.info({ ticketId: ticket.ticketId }, "Ticket resolved");

      res.json(ticket);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /tickets/:id/ai-suggestion - Store AI suggestion
router.patch("/:id/ai-suggestion", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suggestion = AISuggestionResponseSchema.parse(req.body);
    const { v4: uuidv4 } = await import("uuid");

    const ticket = await TicketModel.findById(req.params.id);

    if (!ticket) {
      throw new AppError(
        ErrorCodes.TICKET_NOT_FOUND,
        "Ticket not found",
        { ticketId: req.params.id },
        404
      );
    }

    ticket.aiSuggestion = {
      suggestionId: uuidv4(),
      text: suggestion.suggestedReply,
      confidence: suggestion.confidence,
      generatedAt: new Date(),
      accepted: null,
    };

    await ticket.save();

    logger.info(
      { ticketId: ticket.ticketId, confidence: suggestion.confidence },
      "AI suggestion stored"
    );

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

export default router;

