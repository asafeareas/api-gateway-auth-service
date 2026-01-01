import { PlanRepository } from './PlanRepository';
import { PlanType, getPlanLimits } from './PlanConfig';
import { NotFoundError } from '../../shared/errors/AppError';
import { redis } from '../../infra/redis/redis';
import { logger } from '../../shared/logger/logger';

/**
 * Subscription Plan Service
 * Business logic layer for subscription management
 * 
 * Architecture Decision:
 * - Service layer separates business logic from repository
 * - Enables easy testing and dependency injection
 */
export class PlanService {
  constructor(private readonly planRepository: PlanRepository) { }

  /**
   * Get subscription with limits for a user
   * Creates FREE plan if user doesn't have subscription
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.planRepository.getOrCreateSubscription(
      userId,
      PlanType.FREE
    );

    return {
      plan: subscription.plan,
      requestsPerMinute: subscription.requestsPerMinute,
      requestsPerDay: subscription.requestsPerDay,
    };
  }

  /**
   * Get plan limits for a user
   * Returns plan configuration with limits
   * 
   * Security:
   * - Uses Redis caching to prevent DB exhaustion (DoS protection)
   * - TTL: 60 seconds (Trade-off between consistency and performance)
   */
  async getPlanLimitsForUser(userId: string) {
    const cacheKey = `plan:limits:${userId}`;

    // Try cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      // Fail open (continue to DB) but log error
      logger.error({ error, userId }, 'Redis cache read failed for plan limits');
    }

    try {
      const subscription = await this.planRepository.getSubscriptionByUserId(
        userId
      );

      const limits = {
        requestsPerMinute: subscription.requestsPerMinute,
        requestsPerDay: subscription.requestsPerDay,
      };

      // Set cache
      try {
        await redis.set(cacheKey, JSON.stringify(limits), 'EX', 60);
      } catch (error) {
        logger.error({ error, userId }, 'Redis cache set failed for plan limits');
      }

      return limits;
    } catch (error: any) { // Type check needed for instanceof
      // If subscription not found, return FREE plan limits
      if (error instanceof NotFoundError) {
        const limits = getPlanLimits(PlanType.FREE);

        // Also cache default limits
        try {
          await redis.set(cacheKey, JSON.stringify(limits), 'EX', 60);
        } catch (ignored) { }

        return limits;
      }
      throw error;
    }
  }

  /**
   * Update user's subscription plan
   */
  async updateUserPlan(userId: string, planType: PlanType) {
    return this.planRepository.updateSubscription(userId, planType);
  }
}

