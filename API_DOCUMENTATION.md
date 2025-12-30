# API Documentation

Documentação completa da API de Autenticação e Rate Limiting.

## Base URL

```
http://localhost:3000
```

## Autenticação

A API suporta dois métodos de autenticação:

1. **JWT Bearer Token**: Para usuários autenticados
   - Header: `Authorization: Bearer <access_token>`

2. **API Key**: Para clientes de API
   - Header: `X-API-Key: <api_key>`

## Endpoints

### Autenticação

#### POST /auth/register

Registra um novo usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // opcional
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "accessToken": "jwt_token",
  "refreshToken": "jwt_refresh_token"
}
```

#### POST /auth/login

Autentica um usuário existente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "accessToken": "jwt_token",
  "refreshToken": "jwt_refresh_token"
}
```

#### POST /auth/refresh

Renova o access token usando o refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "accessToken": "new_jwt_token"
}
```

#### POST /auth/logout

Invalida o refresh token (logout).

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (204):** No content

---

### API Clients

#### POST /clients

Cria um novo cliente de API. Requer autenticação JWT.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "My API Client"
}
```

**Response (201):**
```json
{
  "client": {
    "id": "uuid",
    "name": "My API Client",
    "apiKey": "ak_live_abc123...",
    "createdAt": "2023-12-15T10:30:00Z"
  },
  "warning": "Save this API key securely. It will not be shown again."
}
```

**Importante:** A API key é mostrada apenas uma vez durante a criação. Salve-a com segurança.

#### GET /clients

Lista todos os clientes de API do usuário autenticado. Requer autenticação JWT.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "clients": [
    {
      "id": "uuid",
      "name": "My API Client",
      "createdAt": "2023-12-15T10:30:00Z",
      "updatedAt": "2023-12-15T10:30:00Z"
    }
  ]
}
```

---

### Usage

#### GET /usage

Retorna informações sobre o plano atual e estatísticas de uso. Requer autenticação (JWT ou API Key).

**Headers:**
```
Authorization: Bearer <access_token>
# OU
X-API-Key: <api_key>
```

**Response (200):**
```json
{
  "plan": {
    "type": "FREE",
    "limits": {
      "requestsPerMinute": 10,
      "requestsPerDay": 1000
    }
  },
  "usage": {
    "current": {
      "requestsThisMinute": 5,
      "requestsToday": 150
    },
    "remaining": {
      "requestsThisMinute": 5,
      "requestsToday": 850
    }
  }
}
```

---

### Health Check

#### GET /health

Verifica o status do serviço. Não requer autenticação.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2023-12-15T10:30:00.000Z",
  "uptime": 3600
}
```

---

## Planos de Assinatura

### FREE
- 10 requisições por minuto
- 1.000 requisições por dia

### PRO
- 100 requisições por minuto
- 100.000 requisições por dia

---

## Rate Limiting

O rate limiting é aplicado automaticamente a todas as rotas protegidas. Quando o limite é excedido, a API retorna:

**Response (429):**
```json
{
  "error": "Rate limit exceeded: 10 requests per minute",
  "code": "RATE_LIMIT_MINUTE"
}
```

ou

```json
{
  "error": "Rate limit exceeded: 1000 requests per day",
  "code": "RATE_LIMIT_DAY"
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `VALIDATION_ERROR` | Erro de validação de entrada |
| `INVALID_CREDENTIALS` | Email ou senha inválidos |
| `INVALID_JWT_TOKEN` | Token JWT inválido ou expirado |
| `INVALID_REFRESH_TOKEN` | Refresh token inválido |
| `REVOKED_REFRESH_TOKEN` | Refresh token foi revogado |
| `EXPIRED_REFRESH_TOKEN` | Refresh token expirado |
| `MISSING_API_KEY` | API key não fornecida |
| `INVALID_API_KEY` | API key inválida |
| `RATE_LIMIT_MINUTE` | Limite de requisições por minuto excedido |
| `RATE_LIMIT_DAY` | Limite de requisições por dia excedido |
| `EMAIL_ALREADY_EXISTS` | Email já cadastrado |
| `NOT_FOUND` | Recurso não encontrado |

---

## Exemplos de Uso

### 1. Registrar e criar cliente de API

```bash
# 1. Registrar usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# 2. Fazer login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# 3. Criar cliente de API (usar access_token do passo 2)
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "My API Client"
  }'
```

### 2. Usar API Key para fazer requisições

```bash
# Usar a API key retornada na criação do cliente
curl -X GET http://localhost:3000/usage \
  -H "X-API-Key: ak_live_abc123..."
```

### 3. Verificar uso e limites

```bash
# Com JWT
curl -X GET http://localhost:3000/usage \
  -H "Authorization: Bearer <access_token>"

# Com API Key
curl -X GET http://localhost:3000/usage \
  -H "X-API-Key: <api_key>"
```

---

## Segurança

- **Senhas**: Armazenadas com hash bcrypt (10 rounds)
- **API Keys**: Armazenadas com hash bcrypt (10 rounds)
- **JWT Tokens**: 
  - Access Token: 15 minutos de expiração
  - Refresh Token: 30 dias de expiração (configurável)
- **Refresh Tokens**: Armazenados no banco de dados e podem ser revogados
- **Rate Limiting**: Implementado usando Redis (Fixed Window)

---

## Notas Importantes

1. **API Keys**: São mostradas apenas uma vez durante a criação. Se você perder uma API key, precisará criar um novo cliente.

2. **Rate Limiting**: O rate limiting é baseado no cliente (API Key) ou usuário (JWT). Cada cliente tem seus próprios limites baseados no plano do usuário.

3. **Autenticação**: Você pode usar JWT ou API Key, mas não ambos ao mesmo tempo. O middleware tenta JWT primeiro, depois API Key.

4. **Planos**: Por padrão, todos os usuários começam com o plano FREE. Os limites podem ser configurados em `src/modules/plans/PlanConfig.ts`.

