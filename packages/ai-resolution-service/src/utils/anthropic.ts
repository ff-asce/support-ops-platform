import Anthropic from "@anthropic-ai/sdk";
import { logger } from "./logger";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  logger.warn("ANTHROPIC_API_KEY not set - AI service will run in degraded mode");
}

export const anthropic = apiKey
  ? new Anthropic({
      apiKey,
    })
  : null;

export function isAnthropicAvailable(): boolean {
  return anthropic !== null;
}

// Made with Bob
