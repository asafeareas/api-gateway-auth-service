import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';
import { z } from 'zod';
import { env } from '../../../shared/config/env';
import { logger } from '../../../shared/logger/logger';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 * 
 * Architecture Decision:
 * - Thin controllers: only handle HTTP concerns
 * - Business logic in service layer
 * - Input validation with Zod schemas
 */

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Request types
interface RegisterRequest {
  Body: z.infer<typeof registerSchema>;
}

interface LoginRequest {
  Body: z.infer<typeof loginSchema>;
}

interface RefreshRequest {
  Body: z.infer<typeof refreshSchema>;
}

interface LogoutRequest {
  Body: z.infer<typeof logoutSchema>;
}

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwt: any // Fastify JWT instance
  ) {}

  /**
   * Calculate refresh token expiration date from JWT_REFRESH_TOKEN_EXPIRATION
   * Supports formats: "30d", "7d", "30 days", etc.
   */
  private calculateRefreshTokenExpiration(): Date {
    const expiration = new Date();
    const expirationString = env.JWT_REFRESH_TOKEN_EXPIRATION.toLowerCase();
    
    // Parse format like "30d" or "7d"
    const match = expirationString.match(/(\d+)([dhms])/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      
      switch (unit) {
        case 'd':
          expiration.setDate(expiration.getDate() + value);
          break;
        case 'h':
          expiration.setHours(expiration.getHours() + value);
          break;
        case 'm':
          expiration.setMinutes(expiration.getMinutes() + value);
          break;
        case 's':
          expiration.setSeconds(expiration.getSeconds() + value);
          break;
        default:
          // Default to 30 days
          expiration.setDate(expiration.getDate() + 30);
      }
    } else {
      // Default to 30 days if format not recognized
      expiration.setDate(expiration.getDate() + 30);
    }
    
    return expiration;
  }

  /**
   * POST /auth/register
   * Register a new user
   */
  async register(request: FastifyRequest<RegisterRequest>, reply: FastifyReply) {
    const body = registerSchema.parse(request.body);
    
    const user = await this.authService.register({
      email: body.email,
      password: body.password,
      name: body.name,
    });

    // Generate tokens
    const accessToken = this.jwt.sign(
      { userId: user.userId, email: user.email },
      { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRATION }
    );

    const refreshToken = this.jwt.sign(
      { userId: user.userId, email: user.email },
      { expiresIn: env.JWT_REFRESH_TOKEN_EXPIRATION }
    );

    // Calculate expiration date for refresh token
    const refreshTokenExpiration = this.calculateRefreshTokenExpiration();

    // Save refresh token
    await this.authService.saveRefreshToken(
      user.userId,
      refreshToken,
      refreshTokenExpiration
    );

    logger.info({ userId: user.userId }, 'User registered and tokens generated');

    return reply.status(201).send({
      user: {
        id: user.userId,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  }

  /**
   * POST /auth/login
   * Login with email and password
   */
  async login(request: FastifyRequest<LoginRequest>, reply: FastifyReply) {
    const body = loginSchema.parse(request.body);
    
    const user = await this.authService.login(body.email, body.password);

    // Generate tokens
    const accessToken = this.jwt.sign(
      { userId: user.userId, email: user.email },
      { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRATION }
    );

    const refreshToken = this.jwt.sign(
      { userId: user.userId, email: user.email },
      { expiresIn: env.JWT_REFRESH_TOKEN_EXPIRATION }
    );

    // Calculate expiration date for refresh token
    const refreshTokenExpiration = this.calculateRefreshTokenExpiration();

    // Save refresh token
    await this.authService.saveRefreshToken(
      user.userId,
      refreshToken,
      refreshTokenExpiration
    );

    logger.info({ userId: user.userId }, 'User logged in and tokens generated');

    return reply.send({
      user: {
        id: user.userId,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  async refresh(request: FastifyRequest<RefreshRequest>, reply: FastifyReply) {
    const body = refreshSchema.parse(request.body);
    
    const user = await this.authService.validateRefreshToken(body.refreshToken);

    // Generate new access token
    const accessToken = this.jwt.sign(
      { userId: user.userId, email: user.email },
      { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRATION }
    );

    logger.info({ userId: user.userId }, 'Access token refreshed');

    return reply.send({
      accessToken,
    });
  }

  /**
   * POST /auth/logout
   * Logout and revoke refresh token
   */
  async logout(request: FastifyRequest<LogoutRequest>, reply: FastifyReply) {
    const body = logoutSchema.parse(request.body);
    
    await this.authService.revokeRefreshToken(body.refreshToken);

    logger.info('User logged out');

    return reply.status(204).send();
  }
}

