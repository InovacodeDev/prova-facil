# 🐳 Docker Compose - Ambiente de Desenvolvimento Local

Este `docker-compose.yml` fornece todos os serviços necessários para desenvolver o Prova Fácil localmente.

## 📦 Serviços Incluídos

### Principais (sempre rodando)
- **PostgreSQL 16** - Banco de dados principal
- **Redis 7** - Cache de subscriptions do Stripe

### Ferramentas Web (opcional)
- **Adminer** - Interface web para PostgreSQL (http://localhost:8080)
- **Redis Commander** - Interface web para Redis (http://localhost:8081)

---

## 🚀 Quick Start

### 1. Iniciar os serviços principais

```bash
# Iniciar PostgreSQL + Redis em background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver status
docker-compose ps
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar exemplo para .env.local
cp .env.local.example .env.local

# Editar com suas credenciais (Stripe, Google AI, etc)
nano .env.local
```

As URLs do PostgreSQL e Redis já estão configuradas para usar os containers:
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prova_facil`
- `REDIS_URL=redis://localhost:6379`

### 3. Executar migrations

```bash
# Esperar PostgreSQL estar pronto
docker-compose exec postgres pg_isready

# Executar migration principal
docker-compose exec postgres psql -U postgres -d prova_facil -f /docker-entrypoint-initdb.d/migrations/0001_stripe_integration_remove_plan_fields.sql

# Ou executar do host (se tiver psql instalado)
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/migrations/0001_stripe_integration_remove_plan_fields.sql
```

### 4. Executar inserts, policies e triggers

```bash
# Inserts iniciais (plans, logs)
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/inserts.sql

# Políticas RLS
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/policies.sql

# Triggers (logs + cache invalidation)
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/triggers.sql
```

### 5. Iniciar Next.js

```bash
pnpm install
pnpm dev
```

Aplicação estará em: http://localhost:3000

---

## 🛠️ Comandos Úteis

### Gerenciar Containers

```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços (mantém volumes)
docker-compose stop

# Parar e remover containers (mantém volumes)
docker-compose down

# Parar e remover TUDO (incluindo volumes - ⚠️ APAGA DADOS)
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart postgres
docker-compose restart redis
```

### Logs

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f postgres
docker-compose logs -f redis

# Ver últimas 50 linhas
docker-compose logs --tail=50
```

### Acessar Containers

```bash
# Acessar PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d prova_facil

# Acessar Redis CLI
docker-compose exec redis redis-cli

# Acessar shell do container
docker-compose exec postgres sh
docker-compose exec redis sh
```

---

## 🌐 Interfaces Web (Ferramentas Opcionais)

### Iniciar com ferramentas web

```bash
# Iniciar tudo incluindo Adminer e Redis Commander
docker-compose --profile tools up -d
```

### Adminer (PostgreSQL GUI)

**URL:** http://localhost:8080

**Login:**
- System: `PostgreSQL`
- Server: `postgres`
- Username: `postgres`
- Password: `postgres`
- Database: `prova_facil`

### Redis Commander (Redis GUI)

**URL:** http://localhost:8081

Sem autenticação, conecta automaticamente ao Redis.

---

## 🗄️ PostgreSQL

### Configuração

- **Host:** `localhost`
- **Port:** `5432`
- **User:** `postgres`
- **Password:** `postgres`
- **Database:** `prova_facil`

### Comandos Úteis

```bash
# Conectar via psql
psql postgresql://postgres:postgres@localhost:5432/prova_facil

# Listar databases
docker-compose exec postgres psql -U postgres -c "\l"

# Listar tabelas
docker-compose exec postgres psql -U postgres -d prova_facil -c "\dt"

# Ver schema de uma tabela
docker-compose exec postgres psql -U postgres -d prova_facil -c "\d profiles"

# Backup
docker-compose exec postgres pg_dump -U postgres prova_facil > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres prova_facil < backup.sql
```

### Conectar de ferramentas externas

Use qualquer cliente PostgreSQL (DBeaver, pgAdmin, TablePlus, etc):

```
Host: localhost
Port: 5432
User: postgres
Password: postgres
Database: prova_facil
```

---

## 🔴 Redis

### Configuração

- **Host:** `localhost`
- **Port:** `6379`
- **Password:** (nenhuma)

### Configurações Otimizadas

O Redis está configurado com:
- **AOF (Append Only File):** Persistência de dados
- **Max Memory:** 256MB
- **Eviction Policy:** `allkeys-lru` (remove chaves menos usadas)

### Comandos Úteis

```bash
# Conectar ao Redis CLI
docker-compose exec redis redis-cli

# Ver todas as chaves
docker-compose exec redis redis-cli KEYS '*'

# Ver chaves de subscription cache
docker-compose exec redis redis-cli KEYS 'stripe:subscription:*'

# Ver valor de uma chave
docker-compose exec redis redis-cli GET 'stripe:subscription:user-id'

# Deletar uma chave
docker-compose exec redis redis-cli DEL 'stripe:subscription:user-id'

# Deletar todas as chaves (⚠️ CUIDADO)
docker-compose exec redis redis-cli FLUSHALL

# Info sobre Redis
docker-compose exec redis redis-cli INFO

# Monitor comandos em tempo real
docker-compose exec redis redis-cli MONITOR
```

### Testar Cache de Subscriptions

```bash
# Ver todas as subscriptions em cache
docker-compose exec redis redis-cli KEYS 'stripe:subscription:*'

# Ver detalhes de uma subscription
docker-compose exec redis redis-cli GET 'stripe:subscription:user-id-aqui'

# TTL de uma chave (tempo até expirar)
docker-compose exec redis redis-cli TTL 'stripe:subscription:user-id-aqui'
```

---

## 📊 Monitoramento

### Health Checks

Os serviços têm health checks automáticos:

```bash
# Ver status de saúde
docker-compose ps

# Deve mostrar:
# postgres: healthy
# redis: healthy
```

### Estatísticas Redis

```bash
# Ver estatísticas de uso
docker-compose exec redis redis-cli INFO stats

# Ver uso de memória
docker-compose exec redis redis-cli INFO memory
```

### Logs do PostgreSQL

```bash
# Ver logs do PostgreSQL
docker-compose logs postgres

# Monitorar queries (no container)
docker-compose exec postgres tail -f /var/lib/postgresql/data/log/postgresql-*.log
```

---

## 🔧 Troubleshooting

### Porta 5432 já em uso

Se você já tem PostgreSQL rodando localmente:

```bash
# Opção 1: Parar PostgreSQL local
sudo service postgresql stop  # Linux
brew services stop postgresql  # macOS

# Opção 2: Mudar porta no docker-compose.yml
ports:
  - "5433:5432"  # Usar porta 5433 externamente
# E ajustar DATABASE_URL:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5433/prova_facil
```

### Porta 6379 já em uso

Se você já tem Redis rodando localmente:

```bash
# Opção 1: Parar Redis local
sudo service redis-server stop  # Linux
brew services stop redis  # macOS

# Opção 2: Mudar porta no docker-compose.yml
ports:
  - "6380:6379"  # Usar porta 6380 externamente
# E ajustar REDIS_URL:
# REDIS_URL=redis://localhost:6380
```

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs

# Remover e recriar
docker-compose down
docker-compose up -d

# Verificar se tem containers antigos
docker ps -a
docker rm -f prova-facil-postgres prova-facil-redis
```

### Resetar tudo

```bash
# ⚠️ CUIDADO: Remove todos os dados
docker-compose down -v
docker-compose up -d

# Executar migrations novamente
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/migrations/0001_stripe_integration_remove_plan_fields.sql
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/inserts.sql
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/policies.sql
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/triggers.sql
```

---

## 🎯 Workflows Comuns

### Desenvolvimento Normal

```bash
# 1. Iniciar serviços
docker-compose up -d

# 2. Desenvolver
pnpm dev

# 3. Ao terminar (opcional, pode deixar rodando)
docker-compose stop
```

### Testar Migrations

```bash
# 1. Criar migration em db/migrations/
# 2. Testar em database limpo
docker-compose down -v
docker-compose up -d
sleep 5  # Esperar PostgreSQL iniciar

# 3. Executar migration
psql postgresql://postgres:postgres@localhost:5432/prova_facil -f db/migrations/nova_migration.sql

# 4. Verificar resultado
docker-compose exec postgres psql -U postgres -d prova_facil -c "\d profiles"
```

### Debug de Cache

```bash
# 1. Limpar cache Redis
docker-compose exec redis redis-cli FLUSHALL

# 2. Rodar aplicação
pnpm dev

# 3. Fazer ação que deveria cachear

# 4. Verificar se cacheou
docker-compose exec redis redis-cli KEYS 'stripe:subscription:*'

# 5. Ver conteúdo
docker-compose exec redis redis-cli GET 'stripe:subscription:user-id'

# 6. Monitorar comandos Redis em tempo real
docker-compose exec redis redis-cli MONITOR
```

---

## 📦 Volumes e Persistência

Os dados são persistidos em Docker volumes:

```bash
# Ver volumes
docker volume ls | grep prova-facil

# Inspecionar volume
docker volume inspect prova-facil_postgres_data
docker volume inspect prova-facil_redis_data

# Backup de volume PostgreSQL
docker run --rm \
  -v prova-facil_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore de volume PostgreSQL
docker run --rm \
  -v prova-facil_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

---

## 🚀 Dicas de Performance

### PostgreSQL

Para desenvolvimento, o PostgreSQL está com configuração padrão. Se quiser otimizar:

```bash
# Adicionar ao docker-compose.yml em postgres > command:
command:
  - "postgres"
  - "-c"
  - "shared_buffers=256MB"
  - "-c"
  - "effective_cache_size=1GB"
  - "-c"
  - "maintenance_work_mem=128MB"
```

### Redis

Redis já está otimizado com:
- 256MB de memória máxima
- Política LRU (remove menos usados)
- AOF habilitado para persistência

---

## 🎓 Próximos Passos

1. **Produção:** Para produção, use serviços gerenciados:
   - PostgreSQL: Supabase, AWS RDS, Digital Ocean
   - Redis: Redis Cloud, AWS ElastiCache, Upstash

2. **CI/CD:** Adicione testes usando estes containers:
   ```yaml
   # .github/workflows/test.yml
   services:
     postgres:
       image: postgres:16-alpine
       env:
         POSTGRES_PASSWORD: postgres
   ```

3. **Seeding:** Adicione dados de teste em `db/seeds/`:
   ```bash
   psql $DATABASE_URL -f db/seeds/test_data.sql
   ```

---

## ✅ Checklist de Setup

- [ ] `docker-compose up -d` executado
- [ ] `.env.local` criado e configurado
- [ ] PostgreSQL acessível em `localhost:5432`
- [ ] Redis acessível em `localhost:6379`
- [ ] Migrations executadas
- [ ] Inserts executados
- [ ] Policies aplicadas
- [ ] Triggers aplicados
- [ ] `pnpm dev` funcionando
- [ ] Cache Redis testado

---

🎉 **Ambiente local pronto para desenvolvimento!**

Para mais informações sobre a arquitetura Stripe + Redis, veja:
- `STRIPE_REDIS_REFACTOR_COMPLETE.md`
- `docs/STRIPE_REDIS_CACHE_ARCHITECTURE.md`
