import { GraphQLScalarType, Kind } from 'graphql';
import { Query } from './Query';
import { Mutation } from './Mutation';
import { Subscription } from './Subscription';
import { Context } from './Query';
import { Ticket, Agent } from '@support-ops/shared';

// Custom DateTime scalar
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Field resolvers for Ticket type
const TicketResolvers = {
  assignedTo: async (parent: any, _: any, context: Context) => {
    if (!parent.assignedAgentId) {
      return null;
    }
    // Use DataLoader to batch agent queries
    return context.dataloaders.agentLoader.load(parent.assignedAgentId);
  },
};

// Field resolvers for Agent type
const Agent = {
  tickets: async (
    parent: Agent,
    { status }: { status?: string },
    context: Context
  ) => {
    return context.ticketService.getAgentTickets(parent._id, status);
  },
};

// Field resolvers for Resolution type
const Resolution = {
  resolvedBy: async (parent: any, _: any, context: Context) => {
    if (!parent.resolvedBy) {
      return null;
    }
    return context.dataloaders.agentLoader.load(parent.resolvedBy);
  },
};

export const resolvers = {
  DateTime: dateTimeScalar,
  Query,
  Mutation,
  Subscription,
  Ticket: TicketResolvers,
  Agent,
  Resolution,
};

