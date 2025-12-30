import { FastifyRequest, FastifyReply } from 'fastify';
import { ClientService } from '../services/ClientService';
import { z } from 'zod';
import { logger } from '../../../shared/logger/logger';

/**
 * API Client Controller
 * Handles HTTP requests for API client management
 * 
 * Architecture Decision:
 * - Thin controllers: only handle HTTP concerns
 * - Business logic in service layer
 * - Input validation with Zod schemas
 */

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
});

// Request types
interface CreateClientRequest {
  Body: z.infer<typeof createClientSchema>;
}

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  /**
   * POST /clients
   * Create a new API client
   * Requires JWT authentication
   */
  async createClient(
    request: FastifyRequest<CreateClientRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ) {
    const body = createClientSchema.parse(request.body);
    const userId = request.user.userId;

    const client = await this.clientService.createClient(userId, body.name);

    logger.info({ clientId: client.id, userId }, 'API client created via controller');

    return reply.status(201).send({
      client: {
        id: client.id,
        name: client.name,
        apiKey: client.apiKey, // Only returned once during creation
        createdAt: client.createdAt,
      },
      // Security warning: API key is only shown once
      warning: 'Save this API key securely. It will not be shown again.',
    });
  }

  /**
   * GET /clients
   * Get all API clients for authenticated user
   * Requires JWT authentication
   */
  async getClients(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;

    const clients = await this.clientService.getUserClients(userId);

    return reply.send({
      clients,
    });
  }
}

