import { GraphQLError } from 'graphql';
import { Context } from './Query';
import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

// Subscription topics
export const TICKET_UPDATED = 'TICKET_UPDATED';
export const TICKET_CREATED = 'TICKET_CREATED';
export const TICKET_STATUS_CHANGED = 'TICKET_STATUS_CHANGED';

export const Mutation = {
  createTicket: async (
    _: any,
    {
      input,
    }: {
      input: {
        title: string;
        description: string;
        priority: string;
        category: string;
        customerId: string;
        customerEmail: string;
        tags?: string[];
      };
    },
    context: Context
  ) => {
    const ticket = await context.ticketService.createTicket(input);
    
    // Publish to subscription
    pubsub.publish(TICKET_CREATED, { ticketCreated: ticket });
    
    return ticket;
  },

  updateTicket: async (
    _: any,
    {
      id,
      input,
    }: {
      id: string;
      input: {
        title?: string;
        description?: string;
        priority?: string;
        category?: string;
        tags?: string[];
      };
    },
    context: Context
  ) => {
    const ticket = await context.ticketService.updateTicket(id, input);
    
    // Publish to subscription
    pubsub.publish(TICKET_UPDATED, { ticketUpdated: ticket });
    
    return ticket;
  },

  updateTicketStatus: async (
    _: any,
    { id, status }: { id: string; status: string },
    context: Context
  ) => {
    // Get old status first
    const oldTicket = await context.ticketService.getTicket(id);
    if (!oldTicket) {
      throw new GraphQLError('Ticket not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const ticket = await context.ticketService.updateTicketStatus(id, status);
    
    // Publish to subscriptions
    pubsub.publish(TICKET_UPDATED, { ticketUpdated: ticket });
    pubsub.publish(TICKET_STATUS_CHANGED, {
      ticketStatusChanged: {
        ticketId: ticket.ticketId,
        oldStatus: oldTicket.status,
        newStatus: status,
        updatedBy: context.auth.user?.email || 'system',
        timestamp: new Date().toISOString(),
      },
    });
    
    return ticket;
  },

  assignTicket: async (
    _: any,
    { id, agentId }: { id: string; agentId: string },
    context: Context
  ) => {
    // Verify agent exists
    const agent = await context.dataloaders.agentLoader.load(agentId);
    if (!agent) {
      throw new GraphQLError('Agent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const ticket = await context.ticketService.assignTicket(id, agentId);
    
    // Publish to subscription
    pubsub.publish(TICKET_UPDATED, { ticketUpdated: ticket });
    
    return ticket;
  },

  unassignTicket: async (_: any, { id }: { id: string }, context: Context) => {
    const ticket = await context.ticketService.unassignTicket(id);
    
    // Publish to subscription
    pubsub.publish(TICKET_UPDATED, { ticketUpdated: ticket });
    
    return ticket;
  },

  resolveTicket: async (
    _: any,
    {
      id,
      input,
    }: {
      id: string;
      input: {
        resolutionNotes: string;
        customerSatisfaction?: number;
      };
    },
    context: Context
  ) => {
    if (!context.auth.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const ticket = await context.ticketService.resolveTicket(id, input);
    
    // Publish to subscriptions
    pubsub.publish(TICKET_UPDATED, { ticketUpdated: ticket });
    pubsub.publish(TICKET_STATUS_CHANGED, {
      ticketStatusChanged: {
        ticketId: ticket.ticketId,
        oldStatus: 'IN_PROGRESS',
        newStatus: 'RESOLVED',
        updatedBy: context.auth.user?.email || 'system',
        timestamp: new Date().toISOString(),
      },
    });
    
    return ticket;
  },

  createAgent: async (
    _: any,
    {
      input,
    }: {
      input: {
        name: string;
        email: string;
        role: string;
        skills: string[];
      };
    },
    context: Context
  ) => {
    if (!context.auth.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return context.ticketService.createAgent(input);
  },

  updateAgent: async (
    _: any,
    {
      id,
      input,
    }: {
      id: string;
      input: {
        name?: string;
        email?: string;
        role?: string;
        skills?: string[];
      };
    },
    context: Context
  ) => {
    if (!context.auth.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return context.ticketService.updateAgent(id, input);
  },

  deleteAgent: async (_: any, { id }: { id: string }, context: Context) => {
    if (!context.auth.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    await context.ticketService.deleteAgent(id);
    return true;
  },
};

// Made with Bob
