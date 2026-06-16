export type TicketStatus = "open" | "pending" | "resolved" | "escalated";
export type Priority = "low" | "medium" | "high" | "critical";
export type TicketCategory = "billing" | "shipping" | "account" | "returns" | "other";
export type AgentRole = "agent" | "supervisor";

export interface AuditEntry {
  actor: string;
  action: string;
  diff: Record<string, unknown>;
  timestamp: Date;
}

export interface Resolution {
  text: string;
  resolvedBy: string;
  resolvedAt: Date;
}

export interface AISuggestion {
  suggestionId: string;
  text: string;
  confidence: number;
  generatedAt: Date;
  accepted: boolean | null;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  status: TicketStatus;
  priority: Priority;
  category: TicketCategory;
  subject: string;
  description: string;
  customerId: string;
  assignedAgentId?: string;
  tags: string[];
  resolution?: Resolution;
  aiSuggestion?: AISuggestion;
  auditLog: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  _id: string;
  agentId: string;
  name: string;
  email: string;
  role: AgentRole;
  passwordHash: string;
  activeTickets: number;
  createdAt: Date;
}


export interface TicketPage {
  tickets: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuthPayload {
  token: string;
  agent: Agent;
}

// Made with Bob
