import { redis } from '../../infra/redis/redis';
import { logger } from '../../shared/logger/logger';
import { TooManyRequestsError } from '../../shared/errors/AppError';

/**
 * Rate Limit Service
 * Implements Fixed Window rate limiting strategy using Redis
 * 
 * Architecture Decision:
 * - Fixed Window: Simple, predictable, good for most use cases
 * - Redis as single source of truth for rate limiting state
 * - Keys format: rate:{clientId}:{window}
 * 
 * Window formats:
 * - Per minute: YYYYMMDDHHmm (e.g., 202312151430)
 * - Per day: YYYYMMDD (e.g., 20231215)
 */
export class RateLimitService {
  /**
   * Check and increment rate limit counter
   * Returns true if request is allowed, throws TooManyRequestsError if limit exceeded
   * 
   * Strategy:
   * 1. Generate Redis key for current window
   * 2. Increment counter
   * 3. Set expiration only on first increment (when counter becomes 1)
   * 4. Check if limit exceeded
   */
  async checkRateLimit(
    clientId: string,
    requestsPerMinute: number,
    requestsPerDay: number
  ): Promise<void> {
    const now = new Date();
    
    // Generate window keys
    const minuteWindow = this.getMinuteWindow(now);
    const dayWindow = this.getDayWindow(now);
    
    const minuteKey = `rate:${clientId}:${minuteWindow}`;
    const dayKey = `rate:${clientId}:${dayWindow}`;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();
      
      // Increment minute counter
      pipeline.incr(minuteKey);
      
      // Increment day counter
      pipeline.incr(dayKey);
      
      // Execute pipeline
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const minuteCount = results[0][1] as number;
      const dayCount = results[1][1] as number;

      // Set expiration only on first increment (when counter becomes 1)
      // This ensures the key expires at the end of the window
      const expirationPipeline = redis.pipeline();
      
      if (minuteCount === 1) {
        // Set expiration to end of current minute + 1 second buffer
        const secondsUntilNextMinute = 60 - now.getSeconds();
        expirationPipeline.expire(minuteKey, secondsUntilNextMinute + 1);
      }
      
      if (dayCount === 1) {
        // Set expiration to end of current day + 1 hour buffer
        const secondsUntilNextDay = this.getSecondsUntilNextDay(now);
        expirationPipeline.expire(dayKey, secondsUntilNextDay + 3600);
      }
      
      await expirationPipeline.exec();

      // Check limits
      if (minuteCount > requestsPerMinute) {
        logger.warn(
          {
            clientId,
            minuteCount,
            limit: requestsPerMinute,
            window: minuteWindow,
          },
          'Rate limit exceeded: per minute'
        );
        throw new TooManyRequestsError(
          `Rate limit exceeded: ${requestsPerMinute} requests per minute`,
          'RATE_LIMIT_MINUTE'
        );
      }

      if (dayCount > requestsPerDay) {
        logger.warn(
          {
            clientId,
            dayCount,
            limit: requestsPerDay,
            window: dayWindow,
          },
          'Rate limit exceeded: per day'
        );
        throw new TooManyRequestsError(
          `Rate limit exceeded: ${requestsPerDay} requests per day`,
          'RATE_LIMIT_DAY'
        );
      }

      logger.debug(
        {
          clientId,
          minuteCount,
          dayCount,
          minuteLimit: requestsPerMinute,
          dayLimit: requestsPerDay,
        },
        'Rate limit check passed'
      );
    } catch (error) {
      // Re-throw TooManyRequestsError
      if (error instanceof TooManyRequestsError) {
        throw error;
      }

      // Log Redis errors but don't block requests
      // In production, you might want to fail open or closed based on requirements
      logger.error(
        {
          error,
          clientId,
        },
        'Redis error during rate limit check'
      );

      // Fail open: allow request if Redis is unavailable
      // Change to fail closed if rate limiting is critical
      logger.warn('Rate limiting unavailable, allowing request');
    }
  }

  /**
   * Get current minute window string (YYYYMMDDHHmm)
   */
  private getMinuteWindow(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}`;
  }

  /**
   * Get current day window string (YYYYMMDD)
   */
  private getDayWindow(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  }

  /**
   * Calculate seconds until next day (midnight)
   */
  private getSecondsUntilNextDay(date: Date): number {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    
    return Math.floor((nextDay.getTime() - date.getTime()) / 1000);
  }

  /**
   * Get current usage for a client (for monitoring/debugging)
   */
  async getCurrentUsage(clientId: string): Promise<{
    minuteCount: number;
    dayCount: number;
  }> {
    const now = new Date();
    const minuteWindow = this.getMinuteWindow(now);
    const dayWindow = this.getDayWindow(now);
    
    const minuteKey = `rate:${clientId}:${minuteWindow}`;
    const dayKey = `rate:${clientId}:${dayWindow}`;

    try {
      const [minuteCount, dayCount] = await Promise.all([
        redis.get(minuteKey),
        redis.get(dayKey),
      ]);

      return {
        minuteCount: minuteCount ? parseInt(minuteCount, 10) : 0,
        dayCount: dayCount ? parseInt(dayCount, 10) : 0,
      };
    } catch (error) {
      logger.error({ error, clientId }, 'Error getting current usage');
      return { minuteCount: 0, dayCount: 0 };
    }
  }
}

