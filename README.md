API Rate Limiting Service
Production-grade Authentication + API Rate Limiting microservice built with Node.js, TypeScript, Fastify, Prisma, and Redis.

✨ Features
🔐 JWT-based authentication with refresh tokens

🔑 API Key management for clients

📊 Redis-based rate limiting (per minute & per day)

💳 Subscription plans (FREE / PRO)

🏗️ Clean Architecture + Modular Monolith

📝 Structured logging with Pino

✅ Fail-fast environment validation with Zod

🔒 Security best practices

🧰 Tech Stack
Runtime: Node.js (LTS)

Language: TypeScript

Framework: Fastify

Database: PostgreSQL (Prisma ORM)

Cache: Redis

Validation: Zod

Logging: Pino

Containerization: Docker & Docker Compose

Package Manager: pnpm

🚀 Getting Started
Prerequisites
Node.js >= 18

pnpm >= 8

Docker & Docker Compose

PostgreSQL and Redis are provided via Docker.

No local installation required.

⚡ Quick Start
1️⃣ Install dependencies
bash
pnpm install
2️⃣ Setup environment variables
bash
cp .env.example .env
Update .env with your configuration:

Set JWT_SECRET

Update DATABASE_URL if needed

(default Docker configuration works out of the box)

3️⃣ Start infrastructure (PostgreSQL + Redis)
bash
docker compose up -d
4️⃣ Initialize database
bash
pnpm prisma:generate
pnpm prisma:migrate
5️⃣ Start the server
bash
pnpm dev
If everything is configured correctly, the server will start with database and Redis connections established.

⚙️ Environment Configuration
This project uses strict environment variable validation at startup.

.env.example - Public contract with all required variables

.env - Local secrets (never commit this file)

Validation: Application fails fast if configuration is invalid

📖 For detailed documentation, see ENV_VARIABLES.md.

🔌 API Endpoints
Authentication
POST /auth/register

POST /auth/login

POST /auth/refresh

POST /auth/logout

API Clients
POST /clients

GET /clients

Usage
GET /usage — Current plan and usage statistics

🏛️ Architecture
The project follows Clean Architecture principles with a modular monolith structure, ready to be split into microservices.

text
src/
modules/
  auth/          # Authentication and tokens
  clients/       # API client management
  rateLimit/     # Rate limiting logic
  plans/         # Subscription plans
shared/
  middlewares/   # Auth and rate limit pipeline
  config/        # Environment validation
  logger/        # Logging configuration
  errors/        # Custom error handling
infra/
  database/      # Prisma client
  redis/         # Redis connection
🔁 Request Flow
text
Client
↓
Auth Middleware
↓
Rate Limit Middleware
↓
Controller
🔐 Security
Passwords hashed using bcrypt

API keys hashed before storage

Short-lived JWT access tokens

Refresh tokens stored and revocable

Input validation on all endpoints

No sensitive data in logs

📄 License
MIT
