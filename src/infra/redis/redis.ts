import Redis from 'ioredis';
import { env } from '../../shared/config/env';
import { logger } from '../../shared/logger/logger';

/**
 * Redis client singleton
 * Used for rate limiting state management
 * 
 * Configuration:
 * - Connection pooling handled by ioredis
 * - Automatic reconnection on connection loss
 * - Lazy connect (connects on first command)
 */
const redisConfig: Redis.RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: false,
};

export const redis = new Redis(redisConfig);

// Event handlers for monitoring
redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error({ error }, 'Redis connection error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

/**
 * Connect to Redis explicitly
 * Useful for health checks
 */
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    throw error;
  }
}

/**
 * Disconnect Redis client gracefully
 * Should be called on application shutdown
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting Redis');
    // Force disconnect if quit fails
    redis.disconnect();
  }
}

/**
 * Health check for Redis connection
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return false;
  }
}

