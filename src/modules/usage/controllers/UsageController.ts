import { FastifyRequest, FastifyReply } from 'fastify';
import { PlanService } from '../../plans/PlanService';
import { PlanRepository } from '../../plans/PlanRepository';
import { RateLimitService } from '../../rateLimit/RateLimitService';

/**
 * Usage Controller
 * Provides usage statistics and plan information
 * 
 * Architecture Decision:
 * - Thin controller: only handles HTTP concerns
 * - Business logic in service layer
 */

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
  client?: {
    clientId: string;
    userId: string;
  };
}

export class UsageController {
  constructor(
    private readonly planService: PlanService,
    private readonly rateLimitService: RateLimitService
  ) {}

  /**
   * GET /usage
   * Get current plan and usage statistics
   * Requires authentication (JWT or API Key)
   */
  async getUsage(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ) {
    // Determine user ID from authentication
    const userId = request.user?.userId || request.client?.userId;
    const clientId = request.client?.clientId;

    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    // Get subscription info
    const subscription = await this.planService.getUserSubscription(userId);

    // Get current usage from Redis
    const rateLimitKey = clientId || userId;
    const currentUsage = await this.rateLimitService.getCurrentUsage(rateLimitKey);

    return reply.send({
      plan: {
        type: subscription.plan,
        limits: {
          requestsPerMinute: subscription.requestsPerMinute,
          requestsPerDay: subscription.requestsPerDay,
        },
      },
      usage: {
        current: {
          requestsThisMinute: currentUsage.minuteCount,
          requestsToday: currentUsage.dayCount,
        },
        remaining: {
          requestsThisMinute: Math.max(
            0,
            subscription.requestsPerMinute - currentUsage.minuteCount
          ),
          requestsToday: Math.max(
            0,
            subscription.requestsPerDay - currentUsage.dayCount
          ),
        },
      },
    });
  }
}

