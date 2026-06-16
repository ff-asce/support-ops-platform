import { z } from "zod";

// Enums
export const TicketStatusSchema = z.enum(["open", "pending", "resolved", "escalated"]);
export const PrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const TicketCategorySchema = z.enum(["billing", "shipping", "account", "returns", "other"]);
export const AgentRoleSchema = z.enum(["agent", "supervisor"]);

// Input schemas
export const CreateTicketSchema = z.object({
  priority: PrioritySchema,
  category: TicketCategorySchema,
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  customerId: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
});

export const UpdateTicketStatusSchema = z.object({
  status: TicketStatusSchema,
  note: z.string().optional(),
});

export const AssignTicketSchema = z.object({
  agentId: z.string().min(1),
});

export const ResolveTicketSchema = z.object({
  resolution: z.string().min(1).max(5000),
});

export const AISuggestionRequestSchema = z.object({
  ticketId: z.string().min(1),
  category: TicketCategorySchema,
  subject: z.string().min(1),
  description: z.string().min(1),
});

export const AISuggestionResponseSchema = z.object({
  suggestedReply: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  degraded: z.boolean().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const TicketFilterSchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  category: TicketCategorySchema.optional(),
  assignedAgentId: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Type exports from schemas
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof AssignTicketSchema>;
export type ResolveTicketInput = z.infer<typeof ResolveTicketSchema>;
export type AISuggestionRequest = z.infer<typeof AISuggestionRequestSchema>;
export type AISuggestionResponse = z.infer<typeof AISuggestionResponseSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type TicketFilter = z.infer<typeof TicketFilterSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;

