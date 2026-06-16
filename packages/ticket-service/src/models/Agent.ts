import mongoose, { Schema, Document } from "mongoose";
import type { Agent as IAgent } from "@support-ops/shared";

export interface AgentDocument extends Omit<IAgent, "_id">, Document {}

const AgentSchema = new Schema<AgentDocument>(
  {
    agentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["agent", "supervisor"],
      required: true,
      default: "agent",
    },
    passwordHash: { type: String, required: true },
    activeTickets: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

// Generate agent ID before saving
AgentSchema.pre("save", async function (next) {
  if (!this.agentId) {
    const count = await mongoose.model("Agent").countDocuments();
    this.agentId = `AGT-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

export const AgentModel = mongoose.model<AgentDocument>("Agent", AgentSchema);

