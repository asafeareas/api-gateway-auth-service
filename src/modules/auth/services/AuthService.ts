import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/AuthRepository';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger/logger';
import { PlanRepository } from '../../plans/PlanRepository';
import { PlanType } from '../../plans/PlanConfig';

/**
 * Authentication Service
 * Business logic layer for authentication operations
 * 
 * Responsibilities:
 * - Password hashing and verification
 * - User registration and login
 * - JWT token generation (handled by Fastify JWT plugin)
 * - Refresh token management
 */
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly planRepository: PlanRepository
  ) { }

  /**
   * Register a new user
   * - Validates email uniqueness
   * - Hashes password
   * - Creates user and default FREE subscription
   */
  async register(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ userId: string; email: string }> {
    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const user = await this.authRepository.createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    // Create default FREE subscription
    await this.planRepository.createSubscription(user.id, PlanType.FREE);

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    return {
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Authenticate user with email and password
   * Returns user data if credentials are valid
   */
  async login(email: string, password: string): Promise<{
    userId: string;
    email: string;
  }> {
    // Find user
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      logger.warn({ email }, 'Login attempt with non-existent email');
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn({ userId: user.id, email }, 'Login attempt with invalid password');
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    logger.info({ userId: user.id, email }, 'User logged in successfully');

    return {
      userId: user.id,
      email: user.email,
    };
  }



  /**
   * Validate refresh token
   * Returns user data if token is valid and not revoked
   * 
   * Security:
   * - Hashes token for lookup (Secure)
   * - Fallback to plain token lookup (Legacy compatibility)
   */
  async validateRefreshToken(token: string): Promise<{
    userId: string;
    email: string;
  }> {
    // 1. Try to find by Hash (New standard)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    let refreshToken = await this.authRepository.findRefreshTokenByToken(tokenHash);

    // 2. If not found, try Plain Text (Legacy/Migration support)
    if (!refreshToken) {
      refreshToken = await this.authRepository.findRefreshTokenByToken(token);
    }

    if (!refreshToken) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    if (refreshToken.revoked) {
      logger.warn({ tokenPrefix: token.substring(0, 10) + '...' }, 'Attempt to use revoked refresh token');
      throw new UnauthorizedError('Refresh token has been revoked', 'REVOKED_REFRESH_TOKEN');
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired', 'EXPIRED_REFRESH_TOKEN');
    }

    logger.info({ userId: refreshToken.userId }, 'Refresh token validated successfully');

    return {
      userId: refreshToken.userId,
      email: (refreshToken as any).user.email,
    };
  }

  /**
   * Save refresh token to database
   * Stores SHA-256 hash instead of plain token
   */
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    // Store Hash, not plain token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.authRepository.createRefreshToken({
      userId,
      token: tokenHash,
      expiresAt,
    });

    logger.debug({ userId }, 'Refresh token saved (hashed)');
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    // Try to revoke hash first
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if it exists as hash
    const existsAsHash = await this.authRepository.findRefreshTokenByToken(tokenHash);

    if (existsAsHash) {
      await this.authRepository.revokeRefreshToken(tokenHash);
    } else {
      // Fallback to plain text revocation
      await this.authRepository.revokeRefreshToken(token);
    }

    logger.info({ tokenPrefix: token.substring(0, 10) + '...' }, 'Refresh token revoked');
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<{ id: string; email: string; name: string | null }> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new BadRequestError('User not found', 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}

