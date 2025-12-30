import { FastifyInstance } from 'fastify';
import { UsageController } from './controllers/UsageController';
import { PlanService } from '../plans/PlanService';
import { PlanRepository } from '../plans/PlanRepository';
import { RateLimitService } from '../rateLimit/RateLimitService';

/**
 * Usage Routes
 * Registers usage statistics endpoints
 */
export async function usageRoutes(fastify: FastifyInstance) {
  // Initialize dependencies
  const planRepository = new PlanRepository();
  const planService = new PlanService(planRepository);
  const rateLimitService = new RateLimitService();
  const usageController = new UsageController(planService, rateLimitService);

  // Register routes
  // Note: Requires authentication (handled by middleware)
  fastify.get('/usage', async (request, reply) => {
    return usageController.getUsage(request as any, reply);
  });
}

