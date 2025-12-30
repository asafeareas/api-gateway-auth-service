import { prisma } from '../../infra/database/prisma';
import { PlanType } from './PlanConfig';
import { NotFoundError } from '../../shared/errors/AppError';

/**
 * Subscription Plan Repository
 * Handles all database operations related to subscription plans
 * 
 * Follows Repository Pattern for separation of concerns
 */
export class PlanRepository {
  /**
   * Get or create subscription for user
   * Defaults to FREE plan if no subscription exists
   */
  async getOrCreateSubscription(
    userId: string,
    planType: PlanType = PlanType.FREE
  ) {
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      const { getPlanLimits } = await import('./PlanConfig');
      const limits = getPlanLimits(planType);

      subscription = await prisma.subscription.create({
        data: {
          userId,
          plan: planType,
          requestsPerMinute: limits.requestsPerMinute,
          requestsPerDay: limits.requestsPerDay,
        },
      });
    }

    return subscription;
  }

  /**
   * Get subscription by user ID
   * Throws NotFoundError if subscription doesn't exist
   */
  async getSubscriptionByUserId(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    return subscription;
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    userId: string,
    planType: PlanType
  ) {
    const { getPlanLimits } = await import('./PlanConfig');
    const limits = getPlanLimits(planType);

    return prisma.subscription.update({
      where: { userId },
      data: {
        plan: planType,
        requestsPerMinute: limits.requestsPerMinute,
        requestsPerDay: limits.requestsPerDay,
      },
    });
  }

  /**
   * Create subscription for user
   */
  async createSubscription(
    userId: string,
    planType: PlanType = PlanType.FREE
  ) {
    const { getPlanLimits } = await import('./PlanConfig');
    const limits = getPlanLimits(planType);

    return prisma.subscription.create({
      data: {
        userId,
        plan: planType,
        requestsPerMinute: limits.requestsPerMinute,
        requestsPerDay: limits.requestsPerDay,
      },
    });
  }
}

