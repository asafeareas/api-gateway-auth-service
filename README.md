<div align="center">

# API Rate Limiting Service

**Production-grade Authentication + API Rate Limiting microservice**
<br>
*Built with Node.js, TypeScript, Fastify, Prisma, and Redis.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Framework-Fastify-white.svg)](https://www.fastify.io/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED.svg)](https://www.docker.com/)

</div>

---

## ✨ Features

- 🔐 **JWT-based authentication** with refresh tokens
- 🔑 **API Key management** for clients
- 📊 **Redis-based rate limiting** (per minute & per day)
- 💳 **Subscription plans** (FREE / PRO)
- 🏗️ **Clean Architecture** + Modular Monolith
- 📝 **Structured logging** with Pino
- ✅ **Fail-fast environment validation** with Zod
- 🔒 **Security best practices**

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | Node.js (LTS) |
| **Language** | TypeScript |
| **Framework** | Fastify |
| **Database** | PostgreSQL (Prisma ORM) |
| **Cache** | Redis |
| **Validation** | Zod |
| **Logging** | Pino |
| **Containerization** | Docker & Docker Compose |
| **Package Manager** | pnpm |

---

## 🚀 Getting Started

### Prerequisites

* Node.js >= 18
* pnpm >= 8
* Docker & Docker Compose

> **Note:** PostgreSQL and Redis are provided via Docker. No local installation required.

### Quick Start

**1. Install dependencies**

```bash
pnpm install
2. Setup environment variablesBashcp .env.example .env
Update .env with your configuration:Set JWT_SECRETUpdate DATABASE_URL if needed (default Docker config works)3. Start infrastructureBashdocker compose up -d
4. Initialize databaseBashpnpm prisma:generate
pnpm prisma:migrate
5. Start the serverBashpnpm dev
If everything is configured correctly, the server will start with database and Redis connections established.⚙️ Environment ConfigurationThis project uses strict environment variable validation at startup..env.example: Public contract with all required variables..env: Local secrets (never commit this file).Validation: Application fails fast if configuration is invalid.For detailed documentation, see ENV_VARIABLES.md.📡 API EndpointsAuthenticationMethodEndpointPOST/auth/registerPOST/auth/loginPOST/auth/refreshPOST/auth/logoutAPI ClientsMethodEndpointPOST/clientsGET/clientsUsageMethodEndpointDescriptionGET/usageCurrent plan and usage statistics🏗️ ArchitectureThe project follows Clean Architecture principles with a modular monolith structure, ready to be split into microservices.Plaintextsrc/
  ├── modules/
  │    ├── auth/         # Authentication and tokens
  │    ├── clients/      # API client management
  │    ├── rateLimit/    # Rate limiting logic
  │    └── plans/        # Subscription plans
  ├── shared/
  │    ├── middlewares/  # Auth and rate limit pipeline
  │    ├── config/       # Environment validation
  │    ├── logger/       # Logging configuration
  │    └── errors/       # Custom error handling
  └── infra/
       ├── database/     # Prisma client
       └── redis/        # Redis connection
Request FlowSnippet de códigograph TD;
    Client-->Auth_Middleware;
    Auth_Middleware-->Rate_Limit_Middleware;
    Rate_Limit_Middleware-->Controller;
(Or via text representation)PlaintextClient
  ↓
Auth Middleware
  ↓
Rate Limit Middleware
  ↓
Controller
🔒 SecurityPasswords: Hashed using bcrypt.API Keys: Hashed before storage.Tokens: Short-lived JWT access tokens.Revocation: Refresh tokens stored and revocable.Validation: Input validation on all endpoints.Logs: No sensitive data in logs.📄 LicenseThis project is licensed under the MIT License.
