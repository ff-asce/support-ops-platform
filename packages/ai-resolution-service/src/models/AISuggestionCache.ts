import mongoose, { Schema, Document } from "mongoose";
import type { AISuggestionResponse } from "@support-ops/shared";

interface AISuggestionCacheDocument extends Document {
  ticketId: string;
  suggestion: AISuggestionResponse;
  expiresAt: Date;
  createdAt: Date;
}

const AISuggestionCacheSchema = new Schema<AISuggestionCacheDocument>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    suggestion: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour TTL
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - MongoDB will automatically delete documents after expiresAt
AISuggestionCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AISuggestionCacheModel = mongoose.model<AISuggestionCacheDocument>(
  "AISuggestionCache",
  AISuggestionCacheSchema
);

// Made with Bob
