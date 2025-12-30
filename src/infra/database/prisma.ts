import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/logger/logger';

/**
 * Prisma Client singleton
 * Ensures only one instance is created and reused across the application
 * 
 * In production, connection pooling is handled by Prisma automatically
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Log database connection status
if (process.env.NODE_ENV !== 'production') {
  prisma.$connect().then(() => {
    logger.info('Database connected successfully');
  });
}

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Disconnect Prisma client gracefully
 * Should be called on application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

