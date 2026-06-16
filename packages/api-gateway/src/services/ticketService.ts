import axios, { AxiosInstance } from 'axios';
import { Ticket, Agent, CreateTicketInput, UpdateTicketInput, ResolveTicketInput } from '@support-ops/shared';

export class TicketServiceClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Ticket operations
  async getTicket(id: string): Promise<Ticket | null> {
    try {
      const response = await this.client.get<Ticket>(`/tickets/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async listTickets(params: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const response = await this.client.get<{ tickets: Ticket[]; total: number }>('/tickets', {
      params,
    });
    return response.data;
  }

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    const response = await this.client.post<Ticket>('/tickets', input);
    return response.data;
  }

  async updateTicket(id: string, input: UpdateTicketInput): Promise<Ticket> {
    const response = await this.client.patch<Ticket>(`/tickets/${id}`, input);
    return response.data;
  }

  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    const response = await this.client.patch<Ticket>(`/tickets/${id}/status`, { status });
    return response.data;
  }

  async assignTicket(id: string, agentId: string): Promise<Ticket> {
    const response = await this.client.post<Ticket>(`/tickets/${id}/assign`, { agentId });
    return response.data;
  }

  async unassignTicket(id: string): Promise<Ticket> {
    const response = await this.client.post<Ticket>(`/tickets/${id}/unassign`);
    return response.data;
  }

  async resolveTicket(id: string, input: ResolveTicketInput): Promise<Ticket> {
    const response = await this.client.post<Ticket>(`/tickets/${id}/resolve`, input);
    return response.data;
  }

  // Agent operations
  async getAgent(id: string): Promise<Agent | null> {
    try {
      const response = await this.client.get<Agent>(`/agents/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async listAgents(): Promise<Agent[]> {
    const response = await this.client.get<Agent[]>('/agents');
    return response.data;
  }

  async createAgent(input: {
    name: string;
    email: string;
    role: string;
    skills: string[];
  }): Promise<Agent> {
    const response = await this.client.post<Agent>('/agents', input);
    return response.data;
  }

  async updateAgent(
    id: string,
    input: {
      name?: string;
      email?: string;
      role?: string;
      skills?: string[];
    }
  ): Promise<Agent> {
    const response = await this.client.patch<Agent>(`/agents/${id}`, input);
    return response.data;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.client.delete(`/agents/${id}`);
  }

  async getAgentTickets(agentId: string, status?: string): Promise<Ticket[]> {
    const response = await this.client.get<Ticket[]>(`/agents/${agentId}/tickets`, {
      params: { status },
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; database: boolean }> {
    const response = await this.client.get<{ status: string; database: boolean }>('/health');
    return response.data;
  }
}

// Made with Bob
