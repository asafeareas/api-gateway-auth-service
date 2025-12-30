import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitService } from '../../modules/rateLimit/RateLimitService';
import { PlanService } from '../../modules/plans/PlanService';
import { PlanRepository } from '../../modules/plans/PlanRepository';
import { logger } from '../logger/logger';

/**
 * Rate Limiting Middleware
 * Checks and enforces rate limits based on user's subscription plan
 * 
 * Strategy:
 * 1. Extract client/user ID from request (JWT or API Key)
 * 2. Get user's subscription plan limits
 * 3. Check rate limit using RateLimitService
 * 4. If limit exceeded, return 429
 * 5. If allowed, continue to next handler
 * 
 * Architecture Decision:
 * - Rate limiting happens BEFORE controller logic
 * - Uses Redis for distributed rate limiting
 * - Plan limits are fetched from database (can be cached)
 */
export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Determine client/user ID from authentication
  let userId: string | undefined;
  let clientId: string | undefined;

  // Check if authenticated via JWT
  if ((request as any).user) {
    userId = (request as any).user.userId;
  }

  // Check if authenticated via API Key
  if ((request as any).client) {
    userId = (request as any).client.userId;
    clientId = (request as any).client.clientId;
  }

  if (!userId) {
    // Should not happen if authentication middleware ran first
    logger.error({ path: request.url }, 'Rate limit middleware: No user ID found');
    return; // Let authentication middleware handle this
  }

  // Use clientId for rate limiting if available, otherwise use userId
  const rateLimitKey = clientId || userId;

  // Get user's subscription plan limits
  const planRepository = new PlanRepository();
  const planService = new PlanService(planRepository);
  const limits = await planService.getPlanLimitsForUser(userId);

  // Check rate limit
  const rateLimitService = new RateLimitService();
  await rateLimitService.checkRateLimit(
    rateLimitKey,
    limits.requestsPerMinute,
    limits.requestsPerDay
  );

  // If we get here, rate limit check passed
  // Continue to next handler
}

/**
 * Rate Limit Middleware Factory
 * Creates a rate limit middleware with custom limits
 * Useful for different rate limits per endpoint
 */
export function createRateLimitMiddleware(
  requestsPerMinute: number,
  requestsPerDay: number
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Determine client/user ID from authentication
    let userId: string | undefined;
    let clientId: string | undefined;

    if ((request as any).user) {
      userId = (request as any).user.userId;
    }

    if ((request as any).client) {
      userId = (request as any).client.userId;
      clientId = (request as any).client.clientId;
    }

    if (!userId) {
      return; // Let authentication middleware handle this
    }

    const rateLimitKey = clientId || userId;
    const rateLimitService = new RateLimitService();

    await rateLimitService.checkRateLimit(
      rateLimitKey,
      requestsPerMinute,
      requestsPerDay
    );
  };
}

