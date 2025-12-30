import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ClientRepository } from '../repositories/ClientRepository';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger/logger';

/**
 * API Client Service
 * Business logic layer for API client management
 * 
 * Responsibilities:
 * - API key generation and hashing
 * - Client creation and validation
 * - API key verification
 */
export class ClientService {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly clientRepository: ClientRepository) {}

  /**
   * Generate a new API key
   * Format: prefix_random_hex
   * Example: ak_live_abc123def456...
   * 
   * The prefix (first 16 chars) is stored separately for efficient lookup
   */
  private generateApiKey(): { fullKey: string; prefix: string } {
    const prefix = 'ak_live_';
    const randomBytes = crypto.randomBytes(32);
    const randomHex = randomBytes.toString('hex');
    const fullKey = `${prefix}${randomHex}`;
    // Store first 16 chars for efficient lookup
    const lookupPrefix = fullKey.substring(0, 16);
    return { fullKey, prefix: lookupPrefix };
  }

  /**
   * Hash API key for storage
   */
  private async hashApiKey(apiKey: string): Promise<string> {
    return bcrypt.hash(apiKey, this.SALT_ROUNDS);
  }

  /**
   * Verify API key against hash
   */
  async verifyApiKey(apiKey: string, apiKeyHash: string): Promise<boolean> {
    return bcrypt.compare(apiKey, apiKeyHash);
  }

  /**
   * Create a new API client
   * Returns the client with the plain API key (only shown once)
   */
  async createClient(userId: string, name: string): Promise<{
    id: string;
    name: string;
    apiKey: string; // Only returned once during creation
    createdAt: Date;
  }> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Client name is required', 'INVALID_CLIENT_NAME');
    }

    // Generate API key
    const { fullKey: apiKey, prefix: apiKeyPrefix } = this.generateApiKey();
    const apiKeyHash = await this.hashApiKey(apiKey);

    // Create client
    const client = await this.clientRepository.createClient({
      userId,
      name: name.trim(),
      apiKeyPrefix,
      apiKeyHash,
    });

    logger.info({ clientId: client.id, userId }, 'API client created');

    // Return client with plain API key (only time it's shown)
    return {
      id: client.id,
      name: client.name,
      apiKey, // Plain API key - only returned once
      createdAt: client.createdAt,
    };
  }

  /**
   * Get all clients for a user
   */
  async getUserClients(userId: string): Promise<Array<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    return this.clientRepository.findClientsByUserId(userId);
  }

  /**
   * Authenticate API request using API key
   * Returns client and user information if valid
   * 
   * Strategy:
   * 1. Extract prefix from API key (first 16 chars)
   * 2. Find clients with matching prefix (efficient lookup)
   * 3. Verify API key hash against stored hash
   * 4. Return client and user info if valid
   */
  async authenticateApiKey(apiKey: string): Promise<{
    clientId: string;
    userId: string;
  }> {
    if (!apiKey || !apiKey.startsWith('ak_live_')) {
      throw new UnauthorizedError('Invalid API key format', 'INVALID_API_KEY_FORMAT');
    }

    // Extract prefix for efficient lookup
    const apiKeyPrefix = apiKey.substring(0, 16);

    // Find clients with matching prefix
    const clients = await this.clientRepository.findClientByApiKeyPrefix(apiKeyPrefix);

    if (clients.length === 0) {
      logger.warn({ prefix: apiKeyPrefix.substring(0, 8) + '...' }, 'API key not found');
      throw new UnauthorizedError('Invalid API key', 'INVALID_API_KEY');
    }

    // Verify API key against each client's hash
    // In most cases, there will be only one client with the same prefix
    for (const client of clients) {
      const isValid = await this.verifyApiKey(apiKey, client.apiKeyHash);
      if (isValid) {
        logger.info({ clientId: client.id, userId: client.userId }, 'API key authenticated');
        return {
          clientId: client.id,
          userId: client.userId,
        };
      }
    }

    logger.warn({ prefix: apiKeyPrefix.substring(0, 8) + '...' }, 'API key verification failed');
    throw new UnauthorizedError('Invalid API key', 'INVALID_API_KEY');
  }
}

