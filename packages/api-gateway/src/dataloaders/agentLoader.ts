import DataLoader from 'dataloader';
import { Agent } from '@support-ops/shared';
import { TicketServiceClient } from '../services/ticketService';

export function createAgentLoader(ticketService: TicketServiceClient): DataLoader<string, Agent | null> {
  return new DataLoader<string, Agent | null>(
    async (agentIds: readonly string[]) => {
      // Fetch all agents
      const allAgents = await ticketService.listAgents();
      
      // Create a map for quick lookup
      const agentMap = new Map<string, Agent>();
      allAgents.forEach((agent) => {
        agentMap.set(agent._id, agent);
      });
      
      // Return agents in the same order as requested IDs
      return agentIds.map((id) => agentMap.get(id) || null);
    },
    {
      // Cache results for the duration of the request
      cache: true,
      // Batch multiple requests within 10ms
      batchScheduleFn: (callback) => setTimeout(callback, 10),
    }
  );
}

export interface DataLoaders {
  agentLoader: DataLoader<string, Agent | null>;
}

export function createDataLoaders(ticketService: TicketServiceClient): DataLoaders {
  return {
    agentLoader: createAgentLoader(ticketService),
  };
}

// Made with Bob
