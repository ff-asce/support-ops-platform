import { Request, Response, NextFunction } from "express";
import { AppError, ErrorCodes } from "@support-ops/shared";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error(
    {
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      path: req.path,
      method: req.method,
    },
    "Request error"
  );

  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Validation failed",
      details: err.errors,
    });
    return;
  }

  // Default error
  res.status(500).json({
    code: ErrorCodes.INTERNAL_ERROR,
    message: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
  });
}

// Made with Bob
