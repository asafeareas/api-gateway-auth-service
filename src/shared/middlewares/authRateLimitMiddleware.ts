import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../infra/redis/redis';
import { logger } from '../logger/logger';
import { TooManyRequestsError } from '../errors/AppError';

/**
 * Auth Rate Limit Middleware
 * Specific protection for authentication endpoints (Brute Force protection)
 * 
 * Rules:
 * - Limit by IP address
 * - Strict limits (e.g. 5 requests per minute)
 * - Separate from user subscription limits
 */
export async function authRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const ip = request.ip;
  const key = `auth:limit:${ip}`;
  const LIMIT = 5; // 5 attempts per minute
  const WINDOW = 60; // 60 seconds

  try {
    const usage = await redis.incr(key);

    if (usage === 1) {
      await redis.expire(key, WINDOW);
    }

    if (usage > LIMIT) {
      logger.warn({ ip, usage }, 'Auth rate limit exceeded');
      throw new TooManyRequestsError(
        'Too many login attempts. Please try again later.',
        'AUTH_RATE_LIMIT_EXCEEDED'
      );
    }
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      throw error;
    }
    // Fail open if Redis allows, or log error
    logger.error({ error }, 'Redis error in auth rate limit');
  }
}
