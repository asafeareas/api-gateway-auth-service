import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import crypto from 'crypto';
import { env } from './shared/config/env';
import { logger } from './shared/logger/logger';
import { errorHandler } from './shared/http/errorHandler';
import { authRoutes } from './modules/auth/routes';
import { clientRoutes } from './modules/clients/routes';
import { usageRoutes } from './modules/usage/routes';
import { authenticateOptional } from './shared/middlewares/authMiddleware';
import { rateLimitMiddleware } from './shared/middlewares/rateLimitMiddleware';

/**
 * Application Factory
 * Creates and configures Fastify application instance
 * 
 * Architecture Decision:
 * - Separated from server.ts for testing purposes
 * - All plugins and routes registered here
 * - Error handling centralized
 */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger,
    requestIdLogLabel: 'reqId',
    genReqId: () => {
      return crypto.randomUUID();
    },
  });

  // Security Headers
  await app.register(import('@fastify/helmet'), { global: true });

  // CORS
  await app.register(import('@fastify/cors'), {
    origin: true, // Reflect request origin (permissive but secure)
    credentials: true,
  });

  // Register JWT plugin
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  });

  // Register cookie plugin
  await app.register(fastifyCookie, {
    secret: env.JWT_SECRET, // For signed cookies (optional)
  });

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Health check endpoint (no authentication required)
  app.get('/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Register authentication routes (no auth required)
  await app.register(authRoutes, { prefix: '/auth' });

  // Register protected routes
  // These routes require authentication and rate limiting
  await app.register(async (fastify) => {
    // Apply authentication middleware to all routes in this context
    fastify.addHook('onRequest', authenticateOptional);

    // Apply rate limiting middleware to all routes in this context
    fastify.addHook('onRequest', rateLimitMiddleware);

    // Register client routes
    await fastify.register(clientRoutes);

    // Register usage routes
    await fastify.register(usageRoutes);
  });

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      error: 'Not Found',
      code: 'NOT_FOUND',
      path: request.url,
    });
  });

  return app;
}

