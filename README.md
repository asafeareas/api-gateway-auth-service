# API Rate Limiting Service

Production-grade Authentication + API Rate Limiting microservice built with Node.js, TypeScript, Fastify, Prisma, and Redis.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 🔑 API Key management for clients
- 📊 Redis-based rate limiting (Fixed Window)
- 💳 Subscription plans (FREE, PRO)
- 🏗️ Clean Architecture + Modular Monolith
- 📝 Structured logging with Pino
- ✅ Input validation with Zod
- 🔒 Security best practices

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (ioredis)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (running and accessible)
- Redis (running and accessible)

### Quick Start (3 Steps)

1. **Install dependencies and setup environment:**
```bash
pnpm install
pnpm setup
```

2. **Update `.env` with your configuration:**
   - Set `JWT_SECRET` to a secure secret (minimum 32 characters)
   - Update `DATABASE_URL` with your PostgreSQL connection string
   - Adjust Redis settings if needed

3. **Initialize database and start server:**
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

### Environment Configuration

The project uses a strict environment variable validation system:

- **`.env.example`**: Public contract with all required variables (committed to repo)
- **`.env`**: Your local configuration (never commit this file!)
- **Validation**: All variables are validated at startup with clear error messages

**⚠️ Security Warning**: The `.env` file contains sensitive information and must NEVER be committed to version control. It's already included in `.gitignore`.

For detailed environment variable documentation, see [ENV_VARIABLES.md](./ENV_VARIABLES.md).

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate refresh token

### API Clients
- `POST /clients` - Create new API client
- `GET /clients` - List user's API clients

### Usage
- `GET /usage` - Get current plan and usage statistics

## Architecture

The project follows Clean Architecture principles with a modular monolith structure, ready to be split into microservices:

```
src/
  modules/
    auth/          # Authentication module
    clients/        # API Client management
    rateLimit/      # Rate limiting logic
    plans/          # Subscription plans
  shared/
    http/           # HTTP utilities
    middlewares/    # Shared middlewares
    errors/         # Custom error classes
    logger/         # Logging configuration
    config/         # Configuration management
  infra/
    database/       # Prisma client
    redis/          # Redis client
```

## Security

- Passwords are hashed using bcrypt
- API Keys are hashed before storage
- JWT tokens with short expiration times
- Refresh tokens stored in database (revocable)
- Input validation on all endpoints
- No sensitive data in logs

## License

MIT
