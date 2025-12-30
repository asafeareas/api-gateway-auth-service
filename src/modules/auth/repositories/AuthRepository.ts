import { prisma } from '../../../infra/database/prisma';
import { User, RefreshToken } from '@prisma/client';

/**
 * Authentication Repository
 * Handles all database operations related to authentication
 * 
 * Follows Repository Pattern for separation of concerns
 */
export class AuthRepository {
  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create refresh token
   */
  async createRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Find refresh token by token string
   */
  async findRefreshTokenByToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Delete expired refresh tokens
   * Should be run periodically as a cleanup job
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

