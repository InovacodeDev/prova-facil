# 🚀 Guia Rápido de Migração

## ⚡ TL;DR - O que mudou?

**Antes:**

- `profile.plan` → Armazenado no banco ❌
- `profile.plan_expire_at` → Armazenado no banco ❌
- `profile.renew_status` → Armazenado no banco ❌

**Depois:**

- Buscar via `getSubscriptionData(userId, customerId, subscriptionId)` ✅
- Dados vêm do Stripe com cache Redis ✅
- Database só tem `stripe_customer_id` e `stripe_subscription_id` ✅

---

## 📝 Atualizações Necessárias no Código

### 1. Componentes que Lêem Plano do Usuário

**❌ ANTES:**

```typescript
const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();

// Acessar diretamente
const userPlan = profile.plan;
const expireAt = profile.plan_expire_at;
const renewStatus = profile.renew_status;
```

**✅ DEPOIS:**

```typescript
import { getUserPlanData } from '@/lib/stripe/plan-helpers';

const { data: profile } = await supabase
  .from('profiles')
  .select('id, stripe_customer_id, stripe_subscription_id')
  .eq('user_id', userId)
  .maybeSingle();

// Buscar dados do plano (com cache)
const planData = await getUserPlanData(profile.id, profile.stripe_customer_id, profile.stripe_subscription_id);

// Acessar via planData
const userPlan = planData.plan;
const expireAt = planData.planExpireAt;
const renewStatus = planData.renewStatus;
```

### 2. Verificar Acesso a Features

**✅ NOVO (Recomendado):**

```typescript
import { userHasPlanFeature } from '@/lib/stripe/plan-helpers';

const canUploadPDF = await userHasPlanFeature(
  profile.id,
  profile.stripe_customer_id,
  profile.stripe_subscription_id,
  'pdf_upload'
);

if (!canUploadPDF) {
  return <UpgradePrompt />;
}
```

### 3. Verificar Subscription Ativa

**✅ NOVO:**

```typescript
import { userHasActiveSubscription } from '@/lib/stripe/plan-helpers';

const hasActivePlan = await userHasActiveSubscription(
  profile.id,
  profile.stripe_customer_id,
  profile.stripe_subscription_id
);
```

---

## 🔍 Como Encontrar Código que Precisa Atualizar

```bash
# Buscar referências a plan fields
grep -r "profile\.plan[^_]" app/
grep -r "profile\.plan_expire_at" app/
grep -r "profile\.renew_status" app/

# Buscar em Server Components
grep -r "from('profiles')" app/ --include="*.tsx" --include="*.ts"

# Buscar imports de types antigos
grep -r "ProfileWithStripe" app/
```

---

## 🗄️ Executar Migrations (IMPORTANTE!)

### Passo 1: Backup

```bash
# Fazer backup do banco antes de qualquer mudança
pg_dump $DATABASE_URL > backup_antes_migration.sql
```

### Passo 2: Executar Migration

```bash
# Migration principal (remove campos antigos)
psql $DATABASE_URL -f db/migrations/0001_stripe_integration_remove_plan_fields.sql

# Triggers (invalidação de cache)
psql $DATABASE_URL -f db/triggers.sql
```

### Passo 3: Verificar

```sql
-- Verificar schema
\d profiles

-- Deve mostrar:
-- stripe_customer_id | character varying(255)
-- stripe_subscription_id | character varying(255)
--
-- NÃO deve ter:
-- plan
-- plan_expire_at
-- renew_status
```

---

## 🐳 Setup Redis (Desenvolvimento)

### Opção 1: Docker (Recomendado)

```bash
# Iniciar Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine

# Verificar se está rodando
docker ps | grep redis

# Ver logs
docker logs -f redis
```

### Opção 2: Redis Cloud (Produção)

1. Ir em https://redis.com/try-free/
2. Criar conta gratuita
3. Criar novo database
4. Copiar connection string
5. Adicionar ao `.env`:

```bash
REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345
```

---

## ⚙️ Configuração Ambiente

### .env Local

```bash
# Adicionar ao .env
REDIS_URL=redis://localhost:6379

# Ou se Redis tiver senha:
REDIS_URL=redis://:password@localhost:6379

# Ou usar variáveis individuais:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua_senha
```

### Testar Conexão

```typescript
// Criar página de teste: app/test-redis/page.tsx
import { pingRedis, isRedisAvailable } from '@/lib/cache/redis';

export default async function TestRedis() {
  const available = isRedisAvailable();
  const pingResult = await pingRedis();

  return (
    <div>
      <h1>Redis Status</h1>
      <p>Available: {available ? '✅' : '❌'}</p>
      <p>Ping: {pingResult ? '✅ PONG' : '❌ Failed'}</p>
    </div>
  );
}
```

---

## 🧪 Testar a Implementação

### Teste 1: Cache Hit/Miss

```typescript
// app/test-cache/page.tsx
import { getSubscriptionData } from '@/lib/stripe/server';

export default async function TestCache() {
  const userId = 'seu-user-id';
  const customerId = 'cus_xxx';
  const subscriptionId = 'sub_xxx';

  console.log('=== TESTE 1: Cache Miss ===');
  console.time('First fetch');
  const data1 = await getSubscriptionData(userId, customerId, subscriptionId);
  console.timeEnd('First fetch');

  console.log('=== TESTE 2: Cache Hit ===');
  console.time('Second fetch');
  const data2 = await getSubscriptionData(userId, customerId, subscriptionId);
  console.timeEnd('Second fetch');

  return (
    <div>
      <h1>Cache Performance Test</h1>
      <p>First fetch should be ~500ms (Stripe API)</p>
      <p>Second fetch should be ~5ms (Redis cache)</p>
      <pre>{JSON.stringify(data1, null, 2)}</pre>
    </div>
  );
}
```

### Teste 2: Invalidação de Cache

```bash
# Terminal 1: Monitorar logs do app
pnpm dev

# Terminal 2: Fazer update no DB
psql $DATABASE_URL -c "
  UPDATE profiles
  SET stripe_subscription_id = 'sub_new_test'
  WHERE id = 'user-id-aqui';
"

# Verificar logs do Terminal 1:
# Deve aparecer: [SubscriptionCache] Cache invalidated for user: xxx
```

---

## 📋 Checklist Pós-Migração

### Código

- [ ] Buscar e substituir todas as referências a `profile.plan`
- [ ] Buscar e substituir todas as referências a `profile.plan_expire_at`
- [ ] Buscar e substituir todas as referências a `profile.renew_status`
- [ ] Atualizar tipos TypeScript (remover imports antigos)
- [ ] Testar todas as páginas que mostram informação de plano
- [ ] Testar upgrade/downgrade de plano

### Database

- [ ] Backup feito ✅
- [ ] Migration executada
- [ ] Triggers aplicados
- [ ] Schema verificado (`\d profiles`)
- [ ] Dados de teste criados

### Redis

- [ ] Redis instalado/provisionado
- [ ] `REDIS_URL` configurada
- [ ] Conexão testada (`pingRedis()`)
- [ ] Cache hit/miss testado
- [ ] Invalidação testada

### Produção

- [ ] Redis provisionado (Redis Cloud/AWS/Upstash)
- [ ] Variáveis de ambiente configuradas no host (Vercel/Railway)
- [ ] Migration executada em produção
- [ ] Monitoramento configurado
- [ ] Testes E2E passando

---

## 🐛 Troubleshooting Rápido

### Erro: "Cannot find module 'ioredis'"

```bash
pnpm install ioredis
```

### Erro: "Redis connection failed"

```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Ou testar conexão
redis-cli -h localhost -p 6379 ping
# Deve retornar: PONG
```

### Erro: "Cache não invalida"

```bash
# Re-aplicar triggers
psql $DATABASE_URL -f db/triggers.sql

# Verificar se trigger existe
psql $DATABASE_URL -c "
  SELECT * FROM pg_trigger
  WHERE tgname = 'trigger_invalidate_subscription_cache';
"
```

### Erro de Build: "Type 'X' is not assignable..."

```bash
# Limpar cache e rebuildar
rm -rf .next
pnpm build
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **`docs/STRIPE_REDIS_CACHE_ARCHITECTURE.md`** - Arquitetura completa
- **`STRIPE_REDIS_REFACTOR_COMPLETE.md`** - Resumo da refatoração
- **`lib/stripe/plan-helpers.ts`** - Todas as funções helper disponíveis

---

## 💡 Dicas Finais

1. **Use Server Components** sempre que possível para buscar dados de plano
2. **Cache é automático** - você não precisa gerenciá-lo manualmente
3. **Invalidação é automática** - webhooks e triggers cuidam disso
4. **Sem Redis?** Aplicação funciona (mais lenta, mas funciona)
5. **Logs úteis** - Procure por `[Redis]` e `[SubscriptionCache]` nos logs

---

🎉 **Pronto!** Sua aplicação agora usa Stripe como fonte de verdade com cache Redis inteligente!
