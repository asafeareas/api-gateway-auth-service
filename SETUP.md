# Guia de Configuração

Este guia irá ajudá-lo a configurar e executar o serviço de Autenticação e Rate Limiting.

## Pré-requisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (versão 12 ou superior)
- Redis (versão 6 ou superior)

## Passo a Passo

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
# No Windows PowerShell
Copy-Item ENV_VARIABLES.md .env
# Edite o arquivo .env com suas configurações

# No Linux/Mac
cp ENV_VARIABLES.md .env
# Edite o arquivo .env com suas configurações
```

**Importante**: Configure pelo menos:
- `DATABASE_URL` com suas credenciais do PostgreSQL
- `JWT_SECRET` com uma chave segura (mínimo 32 caracteres)
- `REDIS_HOST` e `REDIS_PORT` se o Redis não estiver em localhost:6379

### 3. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
pnpm prisma:generate

# Executar migrações
pnpm prisma:migrate

# (Opcional) Abrir Prisma Studio para visualizar dados
pnpm prisma:studio
```

### 4. Iniciar Redis

Certifique-se de que o Redis está rodando:

```bash
# Verificar se Redis está rodando
redis-cli ping
# Deve retornar: PONG
```

### 5. Iniciar o Servidor

```bash
# Modo desenvolvimento (com hot reload)
pnpm dev

# Modo produção
pnpm build
pnpm start
```

### 6. Verificar se está Funcionando

```bash
# Health check
curl http://localhost:3000/health

# Deve retornar:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "uptime": ...
# }
```

## Estrutura do Banco de Dados

Após executar as migrações, o banco de dados terá as seguintes tabelas:

- `users`: Usuários do sistema
- `api_clients`: Clientes de API (API keys)
- `refresh_tokens`: Tokens de refresh para autenticação
- `subscriptions`: Planos de assinatura dos usuários

## Testando a API

### 1. Registrar um Usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Salve o `accessToken` retornado.

### 3. Criar um Cliente de API

```bash
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "My Test Client"
  }'
```

Salve o `apiKey` retornado (será mostrado apenas uma vez!).

### 4. Usar a API Key

```bash
curl -X GET http://localhost:3000/usage \
  -H "X-API-Key: <api_key>"
```

## Troubleshooting

### Erro: "Database connection failed"

- Verifique se o PostgreSQL está rodando
- Confirme que a `DATABASE_URL` está correta
- Verifique se o banco de dados existe

### Erro: "Redis connection failed"

- Verifique se o Redis está rodando: `redis-cli ping`
- Confirme `REDIS_HOST` e `REDIS_PORT` no `.env`
- Se o Redis tiver senha, configure `REDIS_PASSWORD`

### Erro: "JWT_SECRET must be at least 32 characters"

- Configure uma chave JWT_SECRET com pelo menos 32 caracteres no `.env`

### Erro: "Port already in use"

- Altere a porta no `.env` ou pare o processo que está usando a porta 3000

## Próximos Passos

- Leia a [Documentação da API](API_DOCUMENTATION.md) para mais detalhes
- Configure variáveis de ambiente para produção
- Configure monitoramento e alertas
- Configure backup do banco de dados

