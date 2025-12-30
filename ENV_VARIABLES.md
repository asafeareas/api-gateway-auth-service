# Variáveis de Ambiente

Este documento descreve todas as variáveis de ambiente necessárias para executar o serviço.

## Configuração Rápida

Execute o comando de setup para criar automaticamente o arquivo `.env`:

```bash
pnpm setup
```

Isso copiará `.env.example` para `.env`. Depois, edite `.env` com suas configurações reais.

## Configuração Manual

Se preferir criar manualmente, crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/api_rate_limiting?schema=public

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_LEVEL=info
```

## Descrição das Variáveis

### Server Configuration

- **NODE_ENV**: Ambiente de execução (`development`, `production`, `test`)
- **PORT**: Porta em que o servidor irá escutar (padrão: 3000)
- **HOST**: Host em que o servidor irá escutar (padrão: 0.0.0.0)

### JWT Configuration

- **JWT_SECRET**: Chave secreta para assinar tokens JWT. **DEVE ter pelo menos 32 caracteres em produção**
- **JWT_ACCESS_TOKEN_EXPIRATION**: Tempo de expiração do access token (formato: `15m`, `1h`, etc.)
- **JWT_REFRESH_TOKEN_EXPIRATION**: Tempo de expiração do refresh token (formato: `30d`, `7d`, etc.)

### Database Configuration

- **DATABASE_URL**: URL de conexão do PostgreSQL no formato Prisma
  - Formato: `postgresql://user:password@host:port/database?schema=public`

### Redis Configuration

- **REDIS_HOST**: Host do servidor Redis (padrão: localhost)
- **REDIS_PORT**: Porta do servidor Redis (padrão: 6379)
- **REDIS_PASSWORD**: Senha do Redis (opcional, deixe vazio se não houver senha)
- **REDIS_DB**: Número do banco de dados Redis (padrão: 0)

### Logging

- **LOG_LEVEL**: Nível de log (`fatal`, `error`, `warn`, `info`, `debug`, `trace`)
  - Em produção, use `info` ou `warn`
  - Em desenvolvimento, use `debug` ou `trace`

## Exemplo de Configuração para Produção

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

JWT_SECRET=your-very-long-and-secure-secret-key-minimum-32-characters-long
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d

DATABASE_URL=postgresql://prod_user:secure_password@db.example.com:5432/api_rate_limiting?schema=public

REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

LOG_LEVEL=info
```

## Segurança

⚠️ **IMPORTANTE**: 

1. **NUNCA** commite o arquivo `.env` no controle de versão
2. Use uma chave JWT_SECRET forte e única em produção
3. Use senhas fortes para o banco de dados e Redis
4. Em produção, considere usar um gerenciador de segredos (AWS Secrets Manager, HashiCorp Vault, etc.)

## Validação

Todas as variáveis são validadas na inicialização da aplicação usando Zod. Se alguma variável obrigatória estiver faltando ou inválida, a aplicação não iniciará.

