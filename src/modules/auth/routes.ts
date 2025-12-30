import { FastifyInstance } from 'fastify';
import { AuthController } from './controllers/AuthController';
import { AuthService } from './services/AuthService';
import { AuthRepository } from './repositories/AuthRepository';
import { PlanRepository } from '../plans/PlanRepository';

/**
 * Authentication Routes
 * Registers all authentication endpoints
 * 
 * Architecture Decision:
 * - Routes are registered here, not in controllers
 * - Dependency injection for services and repositories
 * - Clean separation of concerns
 */
export async function authRoutes(fastify: FastifyInstance) {
  // Initialize dependencies
  const authRepository = new AuthRepository();
  const planRepository = new PlanRepository();
  const authService = new AuthService(authRepository, planRepository);
  const authController = new AuthController(authService, fastify.jwt);

  // Register routes
  fastify.post('/register', async (request, reply) => {
    return authController.register(request, reply);
  });

  fastify.post('/login', async (request, reply) => {
    return authController.login(request, reply);
  });

  fastify.post('/refresh', async (request, reply) => {
    return authController.refresh(request, reply);
  });

  fastify.post('/logout', async (request, reply) => {
    return authController.logout(request, reply);
  });
}

