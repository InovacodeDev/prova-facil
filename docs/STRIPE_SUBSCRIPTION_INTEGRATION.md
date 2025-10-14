# Stripe Subscription Integration - Architecture Documentation

## 📋 Resumo da Arquitetura

Este documento descreve a arquitetura de integração com Stripe para gerenciamento de subscriptions e planos de usuários.

## 🎯 Princípios da Arquitetura

### Separação de Responsabilidades

**Database (PostgreSQL):**

- Armazena **apenas referências** (IDs) do Stripe
- `stripe_customer_id`: ID do cliente no Stripe
- `stripe_subscription_id`: ID da subscription ativa
- **Não armazena dados de plano** (plan, expire_at, etc.)

**Redis Cache:**

- Armazena **dados completos** da subscription
- Plan, status, renewStatus, prices, dates, etc.
- TTL inteligente baseado em proximidade da renovação
- Invalidado pelo webhook quando há mudanças

**Stripe API:**

- **Source of truth** para todos os dados de subscription
- Consultado quando cache expira ou é invalidado
- Webhook mantém sistema sincronizado

## ✨ Fluxo de Dados

### 1. Criação/Atualização de Subscription

```
User → Checkout → Stripe → Webhook → Database (IDs only) + Invalidate Cache
                                                    ↓
User Request → Check Cache (miss) → Fetch Stripe API → Store in Cache → Return Data
```

### 2. Leitura de Dados da Subscription

```
User Request → getSubscriptionData()
                    ↓
              Check Redis Cache
                    ↓ (hit)
              Return cached data (FAST)
                    ↓ (miss)
              Fetch from Stripe API
                    ↓
              Store in Cache with smart TTL
                    ↓
              Return fresh data
```

### 3. Cancelamento de Subscription

```
Stripe → Webhook → Set subscription_id = null → Invalidate Cache
                                                       ↓
Next User Request → Cache miss → No subscription ID → Return free plan
```

## 📁 Arquivos Principais

### 1. Schema do Banco de Dados

**Arquivo:** `db/schema.ts`

```typescript
export const profiles = pgTable('profiles', {
  // ... outros campos

  // Stripe Integration: Only IDs stored in DB (subscription data cached in Redis)
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }).unique(),
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }),

  // ... outros campos
});
```

**Importante:** O banco NÃO armazena `plan` ou `plan_expire_at`. Apenas IDs de referência.

### 2. Estrutura de Cache (Redis)

**Arquivo:** `lib/cache/subscription-cache.ts`

```typescript
export interface CachedSubscriptionData {
  subscriptionId: string | null;
  customerId: string;
  status: Stripe.Subscription.Status | 'none';
  plan: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';
  planExpireAt: string | null; // ISO date string
  renewStatus: 'monthly' | 'yearly' | 'trial' | 'canceled' | 'none';
  productId: string | null;
  priceId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null; // Unix timestamp
  currentPeriodStart: number | null; // Unix timestamp
  cachedAt: string; // ISO date string
}
```

**TTL Inteligente:**

- Mais de 7 dias até renovação: 24 horas
- 3-7 dias até renovação: 6 horas
- 1-3 dias até renovação: 1 hora
- Menos de 1 dia: 15 minutos
- Cancelado/Trial: 1 hora

### 3. Webhook Handler

**Arquivo:** `app/api/stripe/webhook/route.ts`

**Função:** `updateProfileSubscription()`

```typescript
async function updateProfileSubscription(customerId: string, subscription: Stripe.Subscription) {
  // Atualiza APENAS IDs no banco
  await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  // Invalida cache Redis
  await invalidateSubscriptionCacheByCustomerId(customerId);
}
```

**Função:** `handleSubscriptionDeleted()`

```typescript
async function handleSubscriptionDeleted(customerId: string) {
  // Remove subscription ID (user volta para plano gratuito)
  await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  // Invalida cache
  await invalidateSubscriptionCacheByCustomerId(customerId);
}
```

**Eventos Handled:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

### 4. Função Principal: getSubscriptionData

**Arquivo:** `lib/stripe/server.ts`

```typescript
export async function getSubscriptionData(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<CachedSubscriptionData>;
```

**Estratégia:**

1. **Check Redis Cache** - Se cache hit → retorna imediatamente (FAST)
2. **Check IDs** - Se não tem IDs → retorna plano gratuito
3. **Fetch from Stripe API** - Busca subscription completa
4. **Store in Cache** - Armazena com TTL inteligente
5. **Error Handling** - Se falha → retorna plano gratuito (permite retry)

### 5. Helper de Extração

**Arquivo:** `lib/stripe/plan-helpers.ts`

```typescript
export function extractPlanFromSubscription(subscription: Stripe.Subscription | null): ExtractedPlanData;
```

**Single source of truth** para conversão Stripe → dados internos.

## 💡 Vantagens da Arquitetura

1. **Performance** - Cache Redis reduz chamadas à API
2. **Simplicidade** - Database simples, Stripe é source of truth
3. **Resiliência** - Cache pode ser reconstruído a qualquer momento
4. **Manutenibilidade** - Mudanças de plano refletem automaticamente
5. **Consistência** - Webhook garante sincronização eventual

## 🚀 Setup e Configuração

### 1. Variáveis de Ambiente

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRODUCT_BASIC=prod_...
STRIPE_PRODUCT_ESSENTIALS=prod_...
STRIPE_PRODUCT_PLUS=prod_...
STRIPE_PRODUCT_ADVANCED=prod_...
REDIS_URL=redis://localhost:6379
```

### 2. Configurar Webhook no Stripe

1. Acesse https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://seu-dominio.com/api/stripe/webhook`
3. Eventos: subscription.created, updated, deleted, trial_will_end
4. Copie signing secret para `STRIPE_WEBHOOK_SECRET`

### 3. Testar Localmente

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3
stripe trigger customer.subscription.created
```

## 🎯 Best Practices

### ✅ BOM

```typescript
// Use getSubscriptionData() com cache
const subscription = await getSubscriptionData(userId, customerId, subscriptionId);

// Webhook atualiza apenas IDs
await supabase.from('profiles').update({
  stripe_subscription_id: 'sub_xxx',
});
```

### ❌ RUIM

```typescript
// Não busque direto do Stripe (ignora cache)
const subscription = await stripe.subscriptions.retrieve(subscriptionId);

// Não armazene dados de plano no banco
await supabase.from('profiles').update({
  plan: 'plus',
  plan_expire_at: '2025-11-13',
});
```

---

**Arquitetura:** IDs no banco, dados no cache, Stripe como source of truth
**Status:** ✅ Implementado e Documentado
