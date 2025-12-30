import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/AppError';
import { logger } from '../logger/logger';
import { ZodError } from 'zod';

/**
 * Error handler middleware for Fastify
 * Centralizes error handling and provides consistent error responses
 * 
 * Security: Never exposes sensitive information in error responses
 */
export async function errorHandler(
  error: FastifyError | AppError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    logger.warn(
      {
        path: request.url,
        method: request.method,
        errors: validationErrors,
      },
      'Validation error'
    );

    return reply.status(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: validationErrors,
    });
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    const statusCode = error.statusCode || 500;

    // Log operational errors at warn level, others at error level
    const logLevel = error.isOperational ? 'warn' : 'error';

    logger[logLevel](
      {
        error: error.message,
        code: error.code,
        statusCode,
        path: request.url,
        method: request.method,
        stack: error.stack,
      },
      'Application error'
    );

    return reply.status(statusCode).send({
      error: error.message,
      code: error.code || 'APPLICATION_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Handle Fastify errors
  if (error.statusCode) {
    logger.warn(
      {
        error: error.message,
        statusCode: error.statusCode,
        path: request.url,
        method: request.method,
      },
      'Fastify error'
    );

    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code || 'HTTP_ERROR',
    });
  }

  // Handle unexpected errors
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      path: request.url,
      method: request.method,
    },
    'Unexpected error'
  );

  return reply.status(500).send({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { message: error.message }),
  });
}

