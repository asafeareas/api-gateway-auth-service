# Environment Configuration System

This project implements a production-grade environment configuration system with strict validation and developer-friendly setup.

## Overview

The environment configuration system ensures:

- ✅ **Single Source of Truth**: All environment variables are validated and accessed from one module
- ✅ **Fail-Fast**: Application crashes immediately on misconfiguration with clear error messages
- ✅ **Type Safety**: Full TypeScript support with validated types
- ✅ **Developer Experience**: One-command setup for local development
- ✅ **Production Ready**: Strict validation prevents runtime configuration errors

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment (creates .env from .env.example)
pnpm setup

# 3. Edit .env with your actual configuration
# (JWT_SECRET, DATABASE_URL, etc.)

# 4. Start development
pnpm dev
```

## Architecture

### 1. `.env.example` (Public Contract)

- **Location**: Project root
- **Purpose**: Template with all required variables
- **Status**: Committed to version control
- **Usage**: Copied to `.env` during setup

### 2. `src/shared/config/env.ts` (Validation Module)

- **Purpose**: Centralized environment variable validation and access
- **Features**:
  - Automatic `.env` file loading
  - Zod schema validation
  - Clear error messages
  - Fail-fast on validation errors
  - Type-safe exports

**Usage in code:**
```typescript
import { env } from '@/shared/config/env';

const port = env.PORT;
const jwtSecret = env.JWT_SECRET;
```

### 3. `scripts/setup.js` (Bootstrap Script)

- **Purpose**: One-command environment setup
- **Actions**:
  - Creates `.env.example` if missing
  - Copies `.env.example` to `.env` if `.env` doesn't exist
  - Provides clear instructions

## Validation Rules

All environment variables are validated with the following rules:

| Variable | Type | Validation | Default |
|----------|------|------------|---------|
| `NODE_ENV` | enum | `development`, `production`, `test` | `development` |
| `PORT` | number | Positive integer | Required |
| `HOST` | string | Any string | `0.0.0.0` |
| `JWT_SECRET` | string | Min 32 characters | Required |
| `JWT_ACCESS_TOKEN_EXPIRATION` | string | Format: `\d+[smhd]` | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRATION` | string | Format: `\d+[smhd]` | `30d` |
| `DATABASE_URL` | string | Valid PostgreSQL URL | Required |
| `REDIS_HOST` | string | Any string | `localhost` |
| `REDIS_PORT` | number | Positive integer | `6379` |
| `REDIS_PASSWORD` | string | Optional | - |
| `REDIS_DB` | number | Integer >= 0 | `0` |
| `LOG_LEVEL` | enum | `fatal`, `error`, `warn`, `info`, `debug`, `trace` | `info` |

## Error Handling

If validation fails, the application will:

1. Display a clear error message listing all invalid/missing variables
2. Provide actionable instructions to fix the issue
3. Exit immediately (fail-fast)

Example error output:
```
❌ Environment Configuration Error

The following environment variables are invalid or missing:

  ✗ JWT_SECRET: JWT_SECRET must be at least 32 characters long for security
  ✗ DATABASE_URL: DATABASE_URL is required

💡 To fix this:
  1. Copy .env.example to .env: cp .env.example .env
  2. Update .env with your actual configuration
  3. Ensure all required variables are set

📖 See ENV_VARIABLES.md for detailed documentation
```

## Security Best Practices

1. **Never commit `.env`**: Already in `.gitignore`
2. **Use strong secrets**: `JWT_SECRET` must be at least 32 characters
3. **Rotate secrets regularly**: Especially in production
4. **Use different values**: Different secrets for development, staging, production
5. **Validate in CI/CD**: Ensure all required variables are set in deployment pipelines

## Production Deployment

In production environments:

- Set environment variables via your platform's configuration system
- The `.env` file is optional if variables are set via system environment
- Validation still occurs at startup
- All validation rules apply

## Troubleshooting

### "JWT_SECRET must be at least 32 characters"

Generate a secure secret:
```bash
openssl rand -base64 32
```

### "DATABASE_URL must be a valid PostgreSQL connection string"

Format: `postgresql://user:password@host:port/database?schema=public`

### "PORT must be a positive number"

Ensure `PORT` is a valid integer, e.g., `3000` not `"3000"` (though the validator handles string conversion)

## Files

- `.env.example`: Template file (committed)
- `.env`: Your local configuration (never commit)
- `src/shared/config/env.ts`: Validation module
- `scripts/setup.js`: Bootstrap script
- `ENV_VARIABLES.md`: Detailed variable documentation

