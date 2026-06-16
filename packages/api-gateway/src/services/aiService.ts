import axios, { AxiosInstance } from 'axios';
import { AISuggestion } from '@support-ops/shared';

export class AIServiceClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // AI requests may take longer
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getSuggestion(ticketId: string): Promise<AISuggestion | null> {
    try {
      const response = await this.client.post<AISuggestion>('/suggest', {
        ticketId,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      // Log error but don't throw - AI service is optional
      console.error('AI service error:', error.message);
      return null;
    }
  }

  async healthCheck(): Promise<{ status: string; anthropicAvailable: boolean }> {
    try {
      const response = await this.client.get<{ status: string; anthropicAvailable: boolean }>(
        '/health'
      );
      return response.data;
    } catch (error) {
      return { status: 'unavailable', anthropicAvailable: false };
    }
  }
}

// Made with Bob
