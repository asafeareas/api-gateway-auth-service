import { prisma } from '../../../infra/database/prisma';
import { ApiClient } from '@prisma/client';

/**
 * API Client Repository
 * Handles all database operations related to API clients
 * 
 * Follows Repository Pattern for separation of concerns
 */
export class ClientRepository {
  /**
   * Create a new API client
   */
  async createClient(data: {
    userId: string;
    name: string;
    apiKeyPrefix: string;
    apiKeyHash: string;
  }): Promise<ApiClient> {
    return prisma.apiClient.create({
      data,
    });
  }

  /**
   * Find client by API key prefix (for efficient lookup)
   */
  async findClientByApiKeyPrefix(apiKeyPrefix: string): Promise<ApiClient[]> {
    return prisma.apiClient.findMany({
      where: { apiKeyPrefix },
      include: { user: true },
    });
  }

  /**
   * Find client by API key hash
   */
  async findClientByApiKeyHash(apiKeyHash: string): Promise<ApiClient | null> {
    return prisma.apiClient.findUnique({
      where: { apiKeyHash },
      include: { user: true },
    });
  }

  /**
   * Find all clients for a user
   */
  async findClientsByUserId(userId: string): Promise<ApiClient[]> {
    return prisma.apiClient.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // Never return apiKeyHash to client
      },
    });
  }

  /**
   * Find client by ID and user ID (for authorization)
   */
  async findClientByIdAndUserId(
    id: string,
    userId: string
  ): Promise<ApiClient | null> {
    return prisma.apiClient.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Delete API client
   */
  async deleteClient(id: string, userId: string): Promise<void> {
    await prisma.apiClient.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }
}

