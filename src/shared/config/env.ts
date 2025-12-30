import { z } from 'zod';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Environment Configuration Module
 * 
 * This module provides centralized, validated environment variable access.
 * All environment variables MUST be imported from this module.
 * 
 * Features:
 * - Automatic .env file loading
 * - Strict validation with Zod
 * - Clear error messages on validation failure
 * - Fail-fast behavior (crashes on misconfiguration)
 * - Type-safe access throughout the application
 */

// Load environment variables from .env file
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // In production, warn if .env is missing (but don't fail if vars are set via system)
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Warning: .env file not found. Using system environment variables.');
  }
}

/**
 * Environment configuration schema using Zod for validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      errorMap: () => ({
        message: 'NODE_ENV must be one of: development, production, test',
      }),
    })
    .default('development'),
  
  PORT: z
    .string({
      required_error: 'PORT is required',
    })
    .transform(Number)
    .pipe(
      z.number({
        required_error: 'PORT must be a valid number',
      }).int('PORT must be an integer').positive('PORT must be a positive number')
    ),
  
  HOST: z.string().default('0.0.0.0'),
  
  // JWT Configuration
  JWT_SECRET: z
    .string({
      required_error: 'JWT_SECRET is required',
    })
    .min(32, 'JWT_SECRET must be at least 32 characters long for security'),
  
  JWT_ACCESS_TOKEN_EXPIRATION: z
    .string()
    .default('15m')
    .refine(
      (val) => /^\d+[smhd]$/.test(val),
      'JWT_ACCESS_TOKEN_EXPIRATION must be in format: 15m, 1h, 30d, etc.'
    ),
  
  JWT_REFRESH_TOKEN_EXPIRATION: z
    .string()
    .default('30d')
    .refine(
      (val) => /^\d+[smhd]$/.test(val),
      'JWT_REFRESH_TOKEN_EXPIRATION must be in format: 15m, 1h, 30d, etc.'
    ),
  
  // Database Configuration
  DATABASE_URL: z
    .string({
      required_error: 'DATABASE_URL is required',
    })
    .url('DATABASE_URL must be a valid PostgreSQL connection string')
    .refine(
      (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),
  
  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  
  REDIS_PORT: z
    .string()
    .default('6379')
    .transform(Number)
    .pipe(
      z.number().int('REDIS_PORT must be an integer').positive('REDIS_PORT must be a positive number')
    ),
  
  REDIS_PASSWORD: z.string().optional(),
  
  REDIS_DB: z
    .string()
    .default('0')
    .transform(Number)
    .pipe(
      z.number().int('REDIS_DB must be an integer').min(0, 'REDIS_DB must be >= 0')
    ),
  
  // Logging Configuration
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'], {
      errorMap: () => ({
        message: 'LOG_LEVEL must be one of: fatal, error, warn, info, debug, trace',
      }),
    })
    .default('info'),
});

/**
 * Validates and parses environment variables
 * Throws a clear, human-readable error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment Configuration Error\n');
      console.error('The following environment variables are invalid or missing:\n');
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  ✗ ${path}: ${err.message}`);
      });
      
      console.error('\n💡 To fix this:');
      console.error('  1. Copy .env.example to .env: cp .env.example .env');
      console.error('  2. Update .env with your actual configuration');
      console.error('  3. Ensure all required variables are set\n');
      
      console.error('📖 See ENV_VARIABLES.md for detailed documentation\n');
    }
    
    // Fail fast - crash the application
    process.exit(1);
  }
}

/**
 * Validated environment configuration
 * This is the single source of truth for environment variables
 * 
 * Usage:
 *   import { env } from '@/shared/config/env';
 *   const port = env.PORT;
 */
export const env = validateEnv();

/**
 * Type-safe environment configuration type
 * Use this for type annotations if needed
 */
export type Env = z.infer<typeof envSchema>;

