import { withFilter } from 'graphql-subscriptions';
import { pubsub, TICKET_UPDATED, TICKET_CREATED, TICKET_STATUS_CHANGED } from './Mutation';

export const Subscription = {
  ticketUpdated: {
    subscribe: withFilter(
      () => (pubsub as any).asyncIterator([TICKET_UPDATED]),
      (payload: any, variables: any) => {
        // If ticketId is provided, only send updates for that ticket
        if (variables.ticketId) {
          return payload.ticketUpdated._id === variables.ticketId;
        }
        // Otherwise, send all ticket updates
        return true;
      }
    ),
  },

  ticketCreated: {
    subscribe: () => (pubsub as any).asyncIterator([TICKET_CREATED]),
  },

  ticketStatusChanged: {
    subscribe: withFilter(
      () => (pubsub as any).asyncIterator([TICKET_STATUS_CHANGED]),
      (payload: any, variables: any) => {
        // If ticketId is provided, only send status changes for that ticket
        if (variables.ticketId) {
          return payload.ticketStatusChanged.ticketId === variables.ticketId;
        }
        // Otherwise, send all status changes
        return true;
      }
    ),
  },
};

