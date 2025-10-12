# 🚀 Arquitetura Stripe + Redis: Cache-First Subscription Management

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes](#componentes)
4. [Configuração](#configuração)
5. [Uso](#uso)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Cache Strategy](#cache-strategy)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Esta implementação adota uma arquitetura **cache-first** onde:

- ✅ Stripe é a **única fonte de verdade** para dados de assinatura
- ✅ Redis armazena dados em cache com **TTL inteligente**
- ✅ Database armazena apenas IDs do Stripe (customer_id, subscription_id)
- ✅ **Zero duplicação** de dados
- ✅ Cache invalidado automaticamente via webhooks e triggers

### Por que essa abordagem?

| Problema Anterior                  | Solução Atual                          |
| ---------------------------------- | -------------------------------------- |
| Dados duplicados no DB             | Apenas IDs no DB                       |
| Sincronização via webhook complexa | Webhook simples + invalidação de cache |
| Dados podem ficar desatualizados   | Sempre frescos do Stripe (com cache)   |
| Muitas queries ao Stripe           | Cache inteligente com TTL variável     |

---

## 🏗️ Arquitetura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js App                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Verifica Cache (Redis)                       │  │
│  │     ├─ Cache Hit → Retorna dados                 │  │
│  │     └─ Cache Miss → Fetch do Stripe              │  │
│  │                                                    │  │
│  │  2. Fetch do Stripe API                          │  │
│  │     └─ Armazena no cache com TTL inteligente     │  │
│  │                                                    │  │
│  │  3. Retorna dados ao cliente                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
       ▲                                ▲
       │                                │
       │                                │
┌──────┴──────┐                 ┌───────┴────────┐
│    Redis    │                 │     Stripe     │
│   (Cache)   │                 │      API       │
└─────────────┘                 └────────────────┘
       ▲                                │
       │                                │
       │ Invalidação                    │ Webhooks
       │ via Trigger                    │
       │                                ▼
┌──────┴────────────────────────────────────────┐
│            PostgreSQL Database                │
│  ┌────────────────────────────────────────┐  │
│  │ profiles                               │  │
│  │  - stripe_customer_id                  │  │
│  │  - stripe_subscription_id              │  │
│  │  (plan data removed - fetch from API)  │  │
│  └────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## 🧩 Componentes

### 1. Redis Cache Layer (`lib/cache/`)

#### `redis.ts`

- Singleton Redis client
- Reconnection automática
- Health checks

#### `subscription-cache.ts`

- Cache de subscription data
- TTL inteligente baseado em data de renovação
- Invalidação por user_id ou customer_id

### 2. Stripe Service (`lib/stripe/`)

#### `server.ts`

- **`getSubscriptionData()`**: Função principal (cache-first)
- Customer management
- Checkout sessions
- Billing portal

#### `plan-helpers.ts`

- `getUserPlanData()`: Obter dados do plano
- `userHasPlanFeature()`: Verificar features
- `userHasActiveSubscription()`: Verificar status
- Formatação e labels

### 3. Webhook Handler (`app/api/stripe/webhook/route.ts`)

- Valida assinatura do Stripe
- Atualiza apenas Stripe IDs no DB
- **Invalida cache** após mudanças
- Simplificado (sem cálculo de plano)

### 4. Database (`db/`)

#### Schema (`schema.ts`)

```typescript
export const profiles = pgTable('profiles', {
  // ... outros campos
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }).unique(),
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }),
  // plan, plan_expire_at, renew_status REMOVIDOS
});
```

#### Migration (`migrations/0001_stripe_integration_remove_plan_fields.sql`)

- Remove `plan`, `plan_expire_at`, `renew_status`
- Remove enum `renew_status`
- Adiciona Stripe IDs com índices

#### Trigger (`triggers.sql`)

```sql
-- Notifica aplicação para invalidar cache quando Stripe IDs mudam
CREATE TRIGGER trigger_invalidate_subscription_cache
AFTER UPDATE ON profiles
WHEN (stripe_customer_id ou stripe_subscription_id mudam)
EXECUTE FUNCTION notify_subscription_cache_invalidation();
```

---

## ⚙️ Configuração

### 1. Instalar Redis

#### Opção A: Docker (Desenvolvimento)

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

#### Opção B: Redis Cloud (Produção)

1. Criar conta em [Redis Cloud](https://redis.com/try-free/)
2. Obter connection string
3. Adicionar ao `.env`

### 2. Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Redis (Obrigatório para caching)
REDIS_URL=redis://localhost:6379

# Ou use configurações individuais
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Stripe (já configuradas)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# ... demais configs Stripe
```

### 3. Executar Migration

```bash
# Aplicar migration que remove campos antigos
psql $DATABASE_URL -f db/migrations/0001_stripe_integration_remove_plan_fields.sql

# Aplicar triggers
psql $DATABASE_URL -f db/triggers.sql
```

### 4. Testar Redis Connection

```typescript
import { pingRedis } from '@/lib/cache/redis';

const isAvailable = await pingRedis();
console.log('Redis disponível:', isAvailable);
```

---

## 🔧 Uso

### Exemplo 1: Obter Dados do Plano

```typescript
import { getUserPlanData } from '@/lib/stripe/plan-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();

  // Buscar profile do DB (apenas Stripe IDs)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .single();

  // Buscar dados do plano (com cache)
  const planData = await getUserPlanData(profile.id, profile.stripe_customer_id, profile.stripe_subscription_id);

  return (
    <div>
      <h1>Plano: {planData.plan}</h1>
      <p>Status: {planData.renewStatus}</p>
      <p>Expira em: {new Date(planData.planExpireAt).toLocaleDateString()}</p>
    </div>
  );
}
```

### Exemplo 2: Verificar Feature Access

```typescript
import { userHasPlanFeature } from '@/lib/stripe/plan-helpers';

async function canUploadPDF(userId: string, customerId: string | null, subscriptionId: string | null) {
  return await userHasPlanFeature(userId, customerId, subscriptionId, 'pdf_upload');
}

// Uso
const canUpload = await canUploadPDF(profile.id, profile.stripe_customer_id, profile.stripe_subscription_id);
if (!canUpload) {
  return <UpgradePrompt feature="PDF Upload" />;
}
```

### Exemplo 3: Server Action com Cache

```typescript
'use server';

import { getSubscriptionData } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export async function getMySubscription() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .single();

  // Cache-first fetch
  const subscription = await getSubscriptionData(
    profile.id,
    profile.stripe_customer_id,
    profile.stripe_subscription_id
  );

  return subscription;
}
```

---

## 🔄 Fluxo de Dados

### Cenário 1: Primeiro Acesso (Cache Miss)

```
1. Cliente → Server Component
2. Server Component → getSubscriptionData()
3. getSubscriptionData() → Verifica Redis
4. Redis → Cache Miss (null)
5. getSubscriptionData() → Stripe API
6. Stripe API → Retorna subscription
7. getSubscriptionData() → Armazena no Redis (TTL inteligente)
8. getSubscriptionData() → Retorna dados
9. Server Component → Renderiza UI
```

**Tempo: ~500ms** (requisição ao Stripe)

### Cenário 2: Acesso Subsequente (Cache Hit)

```
1. Cliente → Server Component
2. Server Component → getSubscriptionData()
3. getSubscriptionData() → Verifica Redis
4. Redis → Cache Hit (dados retornados)
5. getSubscriptionData() → Retorna dados
6. Server Component → Renderiza UI
```

**Tempo: ~5ms** (apenas Redis)

### Cenário 3: Webhook de Mudança

```
1. Stripe → Webhook /api/stripe/webhook
2. Webhook → Valida assinatura
3. Webhook → Atualiza stripe_subscription_id no DB
4. Database Trigger → NOTIFY 'subscription_cache_invalidate'
5. Webhook → Chama invalidateSubscriptionCacheByCustomerId()
6. Redis → Cache deletado
7. Próxima requisição → Cache Miss → Fetch fresco do Stripe
```

---

## 🎯 Cache Strategy

### TTL Inteligente

O TTL (Time To Live) do cache varia baseado na proximidade da renovação:

| Dias até Renovação | TTL        | Justificativa                                  |
| ------------------ | ---------- | ---------------------------------------------- |
| > 7 dias           | 24 horas   | Dados estáveis, pouca mudança esperada         |
| 3-7 dias           | 6 horas    | Renovação próxima, check mais frequente        |
| 1-3 dias           | 1 hora     | Renovação iminente                             |
| < 1 dia            | 15 minutos | Renovação muito próxima, dados quase real-time |
| Trial/Canceled     | 1 hora     | Status pode mudar                              |
| Free plan          | 24 horas   | Nenhuma subscription, raramente muda           |

### Invalidação Automática

Cache é invalidado quando:

1. **Webhook do Stripe** recebe evento de subscription
2. **Database Trigger** detecta mudança em `stripe_subscription_id`
3. **Ação manual** do usuário (cancelamento via portal)

---

## 🗄️ Database Schema

### Antes (Antigo)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  plan plan_enum NOT NULL DEFAULT 'starter',          ❌ REMOVIDO
  plan_expire_at TIMESTAMP,                           ❌ REMOVIDO
  renew_status renew_status_enum NOT NULL,            ❌ REMOVIDO
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  -- ... outros campos
);
```

### Depois (Novo)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,             ✅ APENAS IDs
  stripe_subscription_id VARCHAR(255),                ✅ APENAS IDs
  -- ... outros campos
);

-- Plan data agora vem do Stripe API com Redis cache
```

### Migration SQL

```sql
-- Remover campos antigos
ALTER TABLE profiles
  DROP COLUMN plan,
  DROP COLUMN plan_expire_at,
  DROP COLUMN renew_status;

-- Adicionar Stripe IDs (se não existem)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Índices para performance
CREATE INDEX idx_profiles_stripe_customer_id ON profiles (stripe_customer_id);
CREATE INDEX idx_profiles_stripe_subscription_id ON profiles (stripe_subscription_id);
```

---

## 📚 API Reference

### `getSubscriptionData()`

Função principal para obter dados de subscription com cache.

```typescript
async function getSubscriptionData(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<CachedSubscriptionData>;
```

**Retorno:**

```typescript
interface CachedSubscriptionData {
  subscriptionId: string | null;
  customerId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' | ...;
  plan: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';
  planExpireAt: string | null;  // ISO date string
  renewStatus: 'monthly' | 'yearly' | 'trial' | 'canceled' | 'none';
  productId: string | null;
  priceId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;  // Unix timestamp
  currentPeriodStart: number | null;
  cachedAt: string;  // ISO date string
}
```

### `getUserPlanData()`

Wrapper que adiciona configuração do plano.

```typescript
async function getUserPlanData(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<UserPlanData>;
```

### `invalidateSubscriptionCache()`

Invalida cache de um usuário específico.

```typescript
async function invalidateSubscriptionCache(userId: string): Promise<void>;
```

### `invalidateSubscriptionCacheByCustomerId()`

Invalida cache por Stripe customer ID (usado em webhooks).

```typescript
async function invalidateSubscriptionCacheByCustomerId(customerId: string): Promise<void>;
```

---

## 🐛 Troubleshooting

### Problema: Cache não está funcionando

**Sintomas:** Todas as requests vão direto para o Stripe

**Diagnóstico:**

```typescript
import { pingRedis, isRedisAvailable } from '@/lib/cache/redis';

console.log('Redis disponível?', isRedisAvailable());
console.log('Redis responde?', await pingRedis());
```

**Soluções:**

1. Verificar se Redis está rodando: `docker ps | grep redis`
2. Verificar variável de ambiente `REDIS_URL`
3. Verificar logs do servidor Next.js

### Problema: Cache não invalida após mudança

**Sintomas:** Dados antigos continuam aparecendo após upgrade/downgrade

**Diagnóstico:**

```sql
-- Verificar se trigger está ativo
SELECT * FROM pg_trigger WHERE tgname = 'trigger_invalidate_subscription_cache';

-- Testar manualmente
UPDATE profiles
SET stripe_subscription_id = 'sub_test'
WHERE id = 'user_id_aqui';

-- Verificar logs do Postgres
```

**Soluções:**

1. Re-aplicar triggers: `psql $DATABASE_URL -f db/triggers.sql`
2. Invalidar cache manualmente:

```typescript
import { invalidateSubscriptionCache } from '@/lib/cache/subscription-cache';
await invalidateSubscriptionCache(userId);
```

### Problema: Dados inconsistentes

**Sintomas:** Plan mostrado não bate com Stripe Dashboard

**Diagnóstico:**

1. Verificar TTL do cache
2. Comparar `cached_at` timestamp com horário atual
3. Verificar diretamente no Stripe

**Solução:**

```typescript
// Limpar cache específico
import { invalidateSubscriptionCache } from '@/lib/cache/subscription-cache';
await invalidateSubscriptionCache(userId);

// Ou limpar TUDO (cuidado em produção!)
import { clearAllSubscriptionCaches } from '@/lib/cache/subscription-cache';
await clearAllSubscriptionCaches();
```

### Problema: Performance lenta mesmo com cache

**Diagnóstico:**

```typescript
// Adicionar logs de timing
const start = Date.now();
const data = await getSubscriptionData(...);
console.log(`getSubscriptionData levou ${Date.now() - start}ms`);
```

**Causas comuns:**

1. Redis muito longe geograficamente → Use Redis na mesma região
2. Muitos cache misses → Verificar TTL strategy
3. Stripe API lenta → Normal, mas cache resolve

---

## 📊 Métricas e Monitoramento

### Recomendações

1. **Monitor Redis health:**

```typescript
setInterval(async () => {
  const healthy = await pingRedis();
  if (!healthy) {
    console.error('[Alert] Redis não responde!');
    // Enviar alerta via Slack/Email
  }
}, 60000); // A cada 1 minuto
```

2. **Monitor cache hit rate:**

```typescript
let cacheHits = 0;
let cacheMisses = 0;

// No código de getSubscriptionData
if (cached) cacheHits++;
else cacheMisses++;

// Log a cada 100 requests
if ((cacheHits + cacheMisses) % 100 === 0) {
  const hitRate = ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(2);
  console.log(`Cache hit rate: ${hitRate}%`);
}
```

3. **Monitor Stripe API calls:**

```typescript
// Wrapper que conta chamadas
const stripeWithMetrics = new Proxy(stripe, {
  get(target, prop) {
    const original = target[prop];
    if (typeof original === 'object') {
      return new Proxy(original, {
        get(target2, prop2) {
          const fn = target2[prop2];
          if (typeof fn === 'function') {
            return async (...args) => {
              console.log(`[Stripe] ${prop}.${prop2}() chamado`);
              return fn.apply(target2, args);
            };
          }
          return fn;
        },
      });
    }
    return original;
  },
});
```

---

## ✅ Checklist de Deploy

- [ ] Redis configurado e rodando
- [ ] `REDIS_URL` adicionada ao `.env` de produção
- [ ] Migration `0001_stripe_integration_remove_plan_fields.sql` executada
- [ ] Triggers aplicados (`db/triggers.sql`)
- [ ] Código antigo que referencia `profile.plan` atualizado
- [ ] Webhook do Stripe configurado e testado
- [ ] Cache invalidation testado (upgrade/downgrade manual)
- [ ] Logs de cache funcionando corretamente
- [ ] Monitoramento de Redis health ativado

---

## 🎓 Próximos Passos

1. **Implementar cache warming:** Pré-popular cache para usuários ativos
2. **Adicionar pub/sub:** Usar Redis pub/sub para invalidação em múltiplas instâncias
3. **Metrics dashboard:** Criar dashboard para visualizar cache hit rate
4. **Fallback graceful:** Se Redis falhar, continuar funcionando (mais lento) direto do Stripe
5. **Batch invalidation:** Invalidar múltiplos caches de uma vez em operações admin

---

**Arquitetura desenvolvida seguindo os princípios do AGENTS.md:**

- ✅ DRY: Stripe é única fonte de verdade
- ✅ SRP: Cada módulo tem responsabilidade única
- ✅ Security-First: Validação de webhooks, cache seguro
- ✅ Simplicidade: Cache-first strategy é simples e efetiva
- ✅ Modularidade: Componentes desacoplados e testáveis
