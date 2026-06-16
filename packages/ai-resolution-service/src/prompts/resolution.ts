import type { TicketCategory } from "@support-ops/shared";

export function buildResolutionPrompt(
  category: TicketCategory,
  subject: string,
  description: string
): string {
  return `You are an expert customer service resolution assistant for an e-commerce platform.
Given a support ticket, suggest a concise, empathetic resolution response for the agent to send to the customer.

Respond ONLY with valid JSON matching this exact schema:
{
  "suggestedReply": "string - the suggested response to send to the customer",
  "confidence": number between 0 and 1,
  "rationale": "string - brief explanation of why this response is appropriate"
}

Category: ${category}
Subject: ${subject}
Description: ${description}

Remember:
- Be empathetic and professional
- Provide actionable solutions when possible
- Keep the response concise (2-3 sentences)
- Match the tone to the severity of the issue
- For billing issues, acknowledge the concern and explain next steps
- For shipping issues, provide tracking information or replacement options
- For account issues, prioritize security and verification
- For returns, explain the return process clearly

Respond with ONLY the JSON object, no additional text.`;
}

