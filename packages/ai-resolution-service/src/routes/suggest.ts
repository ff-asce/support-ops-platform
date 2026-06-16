import { Router, Request, Response, NextFunction } from "express";
import { AISuggestionRequestSchema, AISuggestionResponseSchema } from "@support-ops/shared";
import { AISuggestionCacheModel } from "../models/AISuggestionCache";
import { anthropic, isAnthropicAvailable } from "../utils/anthropic";
import { buildResolutionPrompt } from "../prompts/resolution";
import { logger } from "../utils/logger";

const router = Router();

// POST /suggest - Generate or return cached AI suggestion
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const input = AISuggestionRequestSchema.parse(req.body);
    const { ticketId, category, subject, description } = input;

    logger.info({ ticketId, category }, "AI suggestion requested");

    // Check cache first
    const cached = await AISuggestionCacheModel.findOne({
      ticketId,
      expiresAt: { $gt: new Date() },
    });

    if (cached) {
      logger.info({ ticketId }, "Returning cached AI suggestion");
      return res.json(cached.suggestion);
    }

    // If Anthropic is not available, return degraded response
    if (!isAnthropicAvailable()) {
      logger.warn({ ticketId }, "Anthropic API not available - returning degraded response");
      return res.json({
        suggestedReply: "I apologize for the inconvenience. Our AI assistant is temporarily unavailable. A human agent will review your ticket shortly.",
        confidence: 0,
        rationale: "AI service unavailable",
        degraded: true,
      });
    }

    try {
      // Build prompt
      const prompt = buildResolutionPrompt(category, subject, description);

      logger.debug({ ticketId, promptLength: prompt.length }, "Calling Anthropic API");

      // Call Anthropic API
      const message = await anthropic!.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Extract text content
      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Anthropic");
      }

      const responseText = content.text;
      logger.debug({ ticketId, responseLength: responseText.length }, "Received Anthropic response");

      // Parse JSON response
      let parsedResponse;
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        logger.error({ ticketId, responseText, error: parseError }, "Failed to parse Anthropic response");
        throw new Error("Invalid JSON response from AI");
      }

      // Validate response with Zod
      const suggestion = AISuggestionResponseSchema.parse(parsedResponse);

      // Cache the suggestion
      await AISuggestionCacheModel.findOneAndUpdate(
        { ticketId },
        {
          ticketId,
          suggestion,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
        { upsert: true, new: true }
      );

      logger.info(
        { ticketId, confidence: suggestion.confidence },
        "AI suggestion generated and cached"
      );

      res.json(suggestion);
    } catch (aiError: any) {
      // Graceful degradation on AI error
      logger.error(
        { ticketId, error: aiError.message, stack: aiError.stack },
        "Anthropic API error - returning degraded response"
      );

      const degradedResponse = {
        suggestedReply: "Thank you for contacting us. A support agent will review your ticket and respond shortly with a personalized solution.",
        confidence: 0,
        rationale: "AI service error - manual review required",
        degraded: true,
      };

      res.json(degradedResponse);
    }
  } catch (error) {
    next(error);
  }
});

export default router;

