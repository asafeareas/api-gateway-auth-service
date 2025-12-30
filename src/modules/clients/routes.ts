import { FastifyInstance } from 'fastify';
import { ClientController } from './controllers/ClientController';
import { ClientService } from './services/ClientService';
import { ClientRepository } from './repositories/ClientRepository';

/**
 * API Client Routes
 * Registers all API client management endpoints
 * 
 * Architecture Decision:
 * - Routes are registered here, not in controllers
 * - Dependency injection for services and repositories
 * - Clean separation of concerns
 */
export async function clientRoutes(fastify: FastifyInstance) {
  // Initialize dependencies
  const clientRepository = new ClientRepository();
  const clientService = new ClientService(clientRepository);
  const clientController = new ClientController(clientService);

  // Register routes
  // Note: These routes require JWT authentication (handled by middleware)
  fastify.post('/clients', async (request, reply) => {
    return clientController.createClient(request as any, reply);
  });

  fastify.get('/clients', async (request, reply) => {
    return clientController.getClients(request as any, reply);
  });
}

