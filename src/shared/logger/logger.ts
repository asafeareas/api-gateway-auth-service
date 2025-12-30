import pino from 'pino';
import { env } from '../config/env';

/**
 * Centralized logger configuration using Pino
 * Provides structured logging with different levels
 * 
 * In production, logs are JSON formatted for log aggregation systems
 * In development, logs are prettified for readability
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Logger instance type for dependency injection
 */
export type Logger = typeof logger;

