#!/usr/bin/env node

/**
 * Setup Script
 * 
 * One-command bootstrap for local development.
 * Copies .env.example to .env if .env doesn't exist.
 */

const fs = require('fs');
const path = require('path');

const envExamplePath = path.resolve(process.cwd(), '.env.example');
const envPath = path.resolve(process.cwd(), '.env');

console.log('🚀 Setting up environment configuration...\n');

// Create .env.example if it doesn't exist
if (!fs.existsSync(envExamplePath)) {
  const envExampleContent = `# =============================================================================
# API Rate Limiting Service - Environment Configuration
# =============================================================================
# Copy this file to .env and update with your actual values
# NEVER commit .env to version control
# =============================================================================

# -----------------------------------------------------------------------------
# Server Configuration
# -----------------------------------------------------------------------------
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# -----------------------------------------------------------------------------
# JWT Configuration
# -----------------------------------------------------------------------------
# JWT_SECRET: Must be at least 32 characters long
# Generate a secure secret: openssl rand -base64 32
JWT_SECRET=change-this-to-a-secure-secret-minimum-32-characters-long
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d

# -----------------------------------------------------------------------------
# Database Configuration (PostgreSQL)
# -----------------------------------------------------------------------------
# Format: postgresql://user:password@host:port/database?schema=public
DATABASE_URL=postgresql://user:password@localhost:5432/api_rate_limiting?schema=public

# -----------------------------------------------------------------------------
# Redis Configuration
# -----------------------------------------------------------------------------
REDIS_HOST=localhost
REDIS_PORT=6379
# Leave empty if Redis has no password
REDIS_PASSWORD=
REDIS_DB=0

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------
# Options: fatal, error, warn, info, debug, trace
LOG_LEVEL=info
`;

  try {
    fs.writeFileSync(envExamplePath, envExampleContent, 'utf8');
    console.log('✓ Created .env.example file\n');
  } catch (error) {
    console.error('❌ Error creating .env.example file:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✓ .env file already exists');
  console.log('  Skipping copy operation.\n');
  console.log('💡 To regenerate .env from .env.example:');
  console.log('   Delete .env and run: pnpm setup\n');
  process.exit(0);
}

// Copy .env.example to .env
try {
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  fs.writeFileSync(envPath, envExampleContent, 'utf8');
  
  console.log('✓ Created .env file from .env.example\n');
  console.log('⚠️  IMPORTANT: Update .env with your actual configuration!\n');
  console.log('   Required changes:');
  console.log('   - JWT_SECRET: Generate a secure secret (min 32 chars)');
  console.log('   - DATABASE_URL: Update with your PostgreSQL connection string');
  console.log('   - REDIS_HOST, REDIS_PORT: Update if Redis is not on localhost:6379\n');
  console.log('📖 See ENV_VARIABLES.md for detailed documentation\n');
  console.log('✅ Setup complete! You can now run: pnpm dev\n');
} catch (error) {
  console.error('❌ Error creating .env file:');
  console.error(`   ${error.message}\n`);
  process.exit(1);
}

