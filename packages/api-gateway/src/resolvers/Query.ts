import { GraphQLError } from 'graphql';
import { TicketServiceClient } from '../services/ticketService';
import { AIServiceClient } from '../services/aiService';
import { AuthContext } from '../middleware/auth';
import { DataLoaders } from '../dataloaders/agentLoader';

export interface Context {
  ticketService: TicketServiceClient;
  aiService: AIServiceClient;
  auth: AuthContext;
  dataloaders: DataLoaders;
}

export const Query = {
  ticket: async (_: any, { id }: { id: string }, context: Context) => {
    const ticket = await context.ticketService.getTicket(id);
    if (!ticket) {
      throw new GraphQLError('Ticket not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }
    return ticket;
  },

  tickets: async (
    _: any,
    args: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
    context: Context
  ) => {
    const { tickets, total } = await context.ticketService.listTickets(args);
    const limit = args.limit || 50;
    const offset = args.offset || 0;
    
    return {
      tickets,
      total,
      hasMore: offset + tickets.length < total,
    };
  },

  agent: async (_: any, { id }: { id: string }, context: Context) => {
    const agent = await context.dataloaders.agentLoader.load(id);
    if (!agent) {
      throw new GraphQLError('Agent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }
    return agent;
  },

  agents: async (_: any, __: any, context: Context) => {
    return context.ticketService.listAgents();
  },

  aiSuggestion: async (_: any, { ticketId }: { ticketId: string }, context: Context) => {
    // First verify the ticket exists
    const ticket = await context.ticketService.getTicket(ticketId);
    if (!ticket) {
      throw new GraphQLError('Ticket not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Get AI suggestion (may return null if service unavailable)
    const suggestion = await context.aiService.getSuggestion(ticketId);
    
    if (!suggestion) {
      throw new GraphQLError('AI suggestion service unavailable', {
        extensions: { code: 'SERVICE_UNAVAILABLE' },
      });
    }

    return suggestion;
  },

  health: async (_: any, __: any, context: Context) => {
    const [ticketHealth, aiHealth] = await Promise.allSettled([
      context.ticketService.healthCheck(),
      context.aiService.healthCheck(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        ticketService: ticketHealth.status === 'fulfilled' && ticketHealth.value.status === 'ok',
        aiService: aiHealth.status === 'fulfilled' && aiHealth.value.status === 'ok',
        database: ticketHealth.status === 'fulfilled' && ticketHealth.value.database,
      },
    };
  },
};

// Made with Bob
