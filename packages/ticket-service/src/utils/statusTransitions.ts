import { TicketStatus, ErrorCodes, AppError } from "@support-ops/shared";

// Valid state transitions
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["pending", "escalated"],
  pending: ["resolved", "escalated"],
  resolved: [], // Terminal state
  escalated: ["resolved"],
};

export function validateStatusTransition(
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): void {
  if (currentStatus === newStatus) {
    return; // No transition needed
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions.includes(newStatus)) {
    throw new AppError(
      ErrorCodes.INVALID_STATUS_TRANSITION,
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      {
        currentStatus,
        newStatus,
        allowedTransitions,
      },
      422
    );
  }
}

export function canTransitionTo(
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean {
  if (currentStatus === newStatus) {
    return true;
  }
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

