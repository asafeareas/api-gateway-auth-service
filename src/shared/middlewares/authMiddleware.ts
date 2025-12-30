import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../errors/AppError';
import { logger } from '../logger/logger';

/**
 * JWT Authentication Middleware
 * Validates JWT token and attaches user to request
 * 
 * Usage: Add to routes that require authentication
 */
export async function authenticateJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Fastify JWT plugin automatically verifies token
    // and attaches payload to request.user
    await request.jwtVerify();
  } catch (error: any) {
    logger.warn(
      {
        path: request.url,
        method: request.method,
        error: error.message,
      },
      'JWT authentication failed'
    );

    throw new UnauthorizedError('Invalid or expired token', 'INVALID_JWT_TOKEN');
  }
}

/**
 * API Key Authentication Middleware
 * Validates API key from header and attaches client info to request
 * 
 * Usage: Add to routes that accept API key authentication
 */
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new UnauthorizedError('API key is required', 'MISSING_API_KEY');
  }

  // Import here to avoid circular dependencies
  const { ClientService } = await import('../../modules/clients/services/ClientService');
  const { ClientRepository } = await import('../../modules/clients/repositories/ClientRepository');

  const clientRepository = new ClientRepository();
  const clientService = new ClientService(clientRepository);

  try {
    const { clientId, userId } = await clientService.authenticateApiKey(apiKey);

    // Attach client info to request
    (request as any).client = {
      clientId,
      userId,
    };
  } catch (error) {
    logger.warn(
      {
        path: request.url,
        method: request.method,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
      },
      'API key authentication failed'
    );

    throw error;
  }
}

/**
 * Combined Authentication Middleware
 * Accepts either JWT or API Key authentication
 * 
 * Strategy:
 * 1. Try JWT authentication first
 * 2. If JWT fails, try API Key authentication
 * 3. If both fail, return 401
 */
export async function authenticateOptional(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Try JWT first
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      await authenticateJWT(request, reply);
      return; // JWT authentication successful
    } catch (error) {
      // JWT failed, try API key
    }
  }

  // Try API Key
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey) {
    try {
      await authenticateApiKey(request, reply);
      return; // API Key authentication successful
    } catch (error) {
      // API Key also failed
    }
  }

  // Both authentication methods failed
  throw new UnauthorizedError(
    'Authentication required. Provide either Bearer token or X-API-Key header.',
    'AUTHENTICATION_REQUIRED'
  );
}

