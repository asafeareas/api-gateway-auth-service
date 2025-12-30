import { createApp } from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logger/logger';
import { connectRedis, disconnectRedis, redisHealthCheck } from './infra/redis/redis';
import { disconnectPrisma } from './infra/database/prisma';

/**
 * Server Entry Point
 * 
 * Responsibilities:
 * - Initialize application
 * - Connect to external services (Redis, Database)
 * - Start HTTP server
 * - Handle graceful shutdown
 */

async function startServer() {
  try {
    // Create application
    const app = await createApp();

    // Connect to Redis
    try {
      await connectRedis();
      const isHealthy = await redisHealthCheck();
      if (!isHealthy) {
        logger.warn('Redis health check failed, but continuing...');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Redis');
      // In production, you might want to exit if Redis is critical
      // For now, we'll continue and let rate limiting fail gracefully
    }

    // Start server
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(
      {
        port: env.PORT,
        host: env.HOST,
        environment: env.NODE_ENV,
      },
      'Server started successfully'
    );

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutdown signal received');

      try {
        // Close HTTP server
        await app.close();
        logger.info('HTTP server closed');

        // Disconnect Redis
        await disconnectRedis();
        logger.info('Redis disconnected');

        // Disconnect Prisma
        await disconnectPrisma();
        logger.info('Database disconnected');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        {
          reason,
          promise,
        },
        'Unhandled promise rejection'
      );
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught exception');
      shutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };

