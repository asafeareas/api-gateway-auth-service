import { PlanRepository } from './PlanRepository';
import { PlanType, getPlanLimits } from './PlanConfig';
import { NotFoundError } from '../../shared/errors/AppError';

/**
 * Subscription Plan Service
 * Business logic layer for subscription management
 * 
 * Architecture Decision:
 * - Service layer separates business logic from repository
 * - Enables easy testing and dependency injection
 */
export class PlanService {
  constructor(private readonly planRepository: PlanRepository) {}

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
   */
  async getPlanLimitsForUser(userId: string) {
    try {
      const subscription = await this.planRepository.getSubscriptionByUserId(
        userId
      );
      return {
        requestsPerMinute: subscription.requestsPerMinute,
        requestsPerDay: subscription.requestsPerDay,
      };
    } catch (error) {
      // If subscription not found, return FREE plan limits
      if (error instanceof NotFoundError) {
        return getPlanLimits(PlanType.FREE);
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

