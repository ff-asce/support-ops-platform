import mongoose, { Schema, Document } from "mongoose";
import type { Ticket as ITicket, AuditEntry, Resolution, AISuggestion } from "@support-ops/shared";

export interface TicketDocument extends Omit<ITicket, "_id">, Document {}

const AuditEntrySchema = new Schema<AuditEntry>(
  {
    actor: { type: String, required: true },
    action: { type: String, required: true },
    diff: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const ResolutionSchema = new Schema<Resolution>(
  {
    text: { type: String, required: true },
    resolvedBy: { type: String, required: true },
    resolvedAt: { type: Date, required: true },
  },
  { _id: false }
);

const AISuggestionSchema = new Schema<AISuggestion>(
  {
    suggestionId: { type: String, required: true },
    text: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    generatedAt: { type: Date, required: true },
    accepted: { type: Boolean, default: null },
  },
  { _id: false }
);

const TicketSchema = new Schema<TicketDocument>(
  {
    ticketId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["open", "pending", "resolved", "escalated"],
      required: true,
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    category: {
      type: String,
      enum: ["billing", "shipping", "account", "returns", "other"],
      required: true,
    },
    subject: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    customerId: { type: String, required: true, index: true },
    assignedAgentId: { type: String, index: true },
    tags: [{ type: String }],
    resolution: { type: ResolutionSchema },
    aiSuggestion: { type: AISuggestionSchema },
    auditLog: [AuditEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for queue views
TicketSchema.index({ status: 1, priority: 1, createdAt: 1 });

// Text index for search
TicketSchema.index({ subject: "text", description: "text" });

// Generate ticket ID before saving
TicketSchema.pre("save", async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

export const TicketModel = mongoose.model<TicketDocument>("Ticket", TicketSchema);

// Made with Bob
