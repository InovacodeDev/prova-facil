# 🔧 CORREÇÃO COMPLETA DA ARQUITETURA DE SUBSCRIPTION

> **Data:** 2025-10-10  
> **Objetivo:** Eliminar erros de API, remover redundância no schema e estabelecer o Stripe como fonte única da verdade

---

## 📋 ÍNDICE

1. [Problemas Identificados](#problemas-identificados)
2. [Soluções Implementadas](#soluções-implementadas)
3. [Arquitetura Final](#arquitetura-final)
4. [Arquivos Modificados](#arquivos-modificados)
5. [Migration SQL](#migration-sql)
6. [Fluxos Corrigidos](#fluxos-corrigidos)
7. [Testes Necessários](#testes-necessários)

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **Redundância no Schema**

**Problema:** Dados duplicados entre `profiles` e `subscriptions`

**Antes:**

```typescript
// profiles table
stripe_subscription_id: VARCHAR(255)  ❌ Redundante
stripe_customer_id: VARCHAR(255)      ✅ Necessário
plan: ENUM                             ✅ Cache

// subscriptions table
stripe_customer_id: VARCHAR(255) UNIQUE  ❌ Constraint errado
stripe_subscription_id: VARCHAR(255)     ✅ OK
user_id: UUID UNIQUE                     ❌ Constraint errado (impede histórico)
```

**Impacto:**

- Fonte da verdade ambígua
- Constraint UNIQUE na tabela de audit trail impedia múltiplos registros
- Violação do princípio DRY

### 2. **APIs Consultando Tabela de Audit como Fonte da Verdade**

**Problema:** APIs buscavam subscription da tabela `subscriptions` ao invés do Stripe

**APIs Afetadas:**

- `/api/stripe/subscription` ❌
- `/api/stripe/change-plan` ❌
- `/api/stripe/cancel-plan-change` ❌
- `/api/stripe/upgrade-preview` ❌

**Consequência:** Se a tabela `subscriptions` não estivesse sincronizada, o sistema quebrava.

### 3. **Bug no Hook: Campo Errado**

**Problema:** Hook usando `cancel_at` em vez de `current_period_end`

```typescript
// ❌ ANTES (ERRADO):
const currentPeriodEndDate = subscription
  ? new Date(subscription.cancel_at * 1000) // Campo de cancelamento!
  : null;

// ✅ DEPOIS (CORRETO):
const currentPeriodEndDate =
  subscription && 'current_period_end' in subscription
    ? new Date(Number(subscription.current_period_end) * 1000)
    : null;
```

**Impacto:** Datas incorretas exibidas na UI, especialmente para subscriptions ativas.

### 4. **Webhook com Campos Inexistentes**

**Problema:** Webhook tentava atualizar campos que não existem no schema:

- `plan_expire_at` ❌
- `renew_status` ❌
- `pending_plan_id` ❌
- `pending_plan_change_at` ❌

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. **Correção do Schema**

#### **profiles table** (Fonte da Verdade para Cliente)

```typescript
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().unique(),
  // ... outros campos ...
  plan: planEnum().notNull().default('starter'), // ✅ CACHE do plano
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }).unique(), // ✅ ÚNICO link com Stripe
  // ❌ REMOVIDO: stripe_subscription_id
});
```

**Mudanças:**

- ❌ Removido `stripe_subscription_id` (redundante)
- ✅ `stripe_customer_id` com UNIQUE constraint (permite NULL para starter)
- ✅ `plan` como cache para queries rápidas

#### **subscriptions table** (Audit Trail)

```typescript
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .references(() => profiles.id)
    .notNull(), // ❌ Removido UNIQUE
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }).notNull(), // ❌ Removido UNIQUE
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }).notNull(),
  stripe_price_id: varchar('stripe_price_id', { length: 255 }).notNull(),
  status: subscriptionStatusEnum().notNull(),
  plan_id: planEnum().notNull(),
  event_type: varchar('event_type', { length: 100 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
```

**Mudanças:**

- ❌ Removido UNIQUE de `user_id` (permite múltiplos registros por usuário)
- ❌ Removido UNIQUE de `stripe_customer_id` (permite histórico)
- ✅ Adicionados índices para performance
- ✅ Comentário explicativo: "AUDIT TRAIL - não usar como fonte da verdade"

### 2. **Refatoração das APIs**

#### **Padrão Antigo (Errado):**

```typescript
// ❌ Buscava na tabela subscriptions
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('stripe_subscription_id')
  .eq('user_id', profile.id)
  .eq('status', 'active')
  .single();

// Dependia da tabela estar sincronizada
const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
```

#### **Padrão Novo (Correto):**

```typescript
// ✅ Busca profile.stripe_customer_id
const { data: profile } = await supabase
  .from('profiles')
  .select('id, stripe_customer_id, plan')
  .eq('user_id', user.id)
  .single();

// ✅ Busca DIRETAMENTE no Stripe (fonte da verdade)
const subscriptions = await stripe.subscriptions.list({
  customer: profile.stripe_customer_id,
  status: 'active',
  limit: 1,
  expand: ['data.items.data.price.product', 'data.customer'],
});

const activeSubscription = subscriptions.data[0];
```

**Benefícios:**

- ✅ Stripe é a fonte única da verdade
- ✅ Não depende da tabela `subscriptions` estar sincronizada
- ✅ Menos pontos de falha
- ✅ Código mais simples e robusto

### 3. **Correção do Hook**

**Arquivo:** `hooks/use-subscription-cache.ts`

```typescript
// ✅ CORRIGIDO: Usa current_period_end com type guards
const currentPeriodEndDate =
  subscription && 'current_period_end' in subscription && subscription.current_period_end
    ? new Date(Number(subscription.current_period_end) * 1000)
    : null;

const daysUntilRenewal = currentPeriodEndDate
  ? Math.ceil((currentPeriodEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null;

const hasPendingChange =
  subscription && 'cancel_at_period_end' in subscription ? Boolean(subscription.cancel_at_period_end) : false;
```

### 4. **Correção do Webhook**

**Arquivo:** `app/api/stripe/webhook/route.ts`

#### **Função `handleSubscriptionChange` (Simplificada):**

```typescript
async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;

  // 1. Buscar ou atualizar profile.stripe_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!profile.stripe_customer_id) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: subscription.customer as string })
      .eq('user_id', userId);
  }

  // 2. Inserir registro de AUDIT TRAIL
  await supabase.from('subscriptions').insert({
    user_id: profile.id,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    plan_id: planId,
    event_type: 'customer.subscription.updated',
  });

  // 3. Atualizar CACHE do plano
  await supabase.from('profiles').update({ plan: planId, updated_at: new Date() }).eq('user_id', userId);
}
```

**Mudanças:**

- ❌ Removida lógica complexa de `pending_plan_id`
- ❌ Removidos campos inexistentes (`plan_expire_at`, `renew_status`)
- ✅ INSERT ao invés de UPSERT (audit trail cresce)
- ✅ Atualiza `stripe_customer_id` se necessário
- ✅ Atualiza apenas `plan` no profile (cache simples)

---

## 🏗️ ARQUITETURA FINAL

### **Fonte da Verdade:**

```
┌─────────────────────────────────────────────┐
│         STRIPE API (Fonte da Verdade)       │
│                                             │
│  ✅ Subscriptions                           │
│  ✅ Customers                                │
│  ✅ Prices                                   │
│  ✅ Payment Intents                          │
└─────────────────────────────────────────────┘
                     ▲
                     │ (Consulta via API)
                     │
┌────────────────────┴─────────────────────────┐
│              profiles table                  │
│                                              │
│  stripe_customer_id ◄─┐ ÚNICO LINK          │
│  plan (cache) ────────┤ Para queries rápidas│
└───────────────────────┴──────────────────────┘
                     │
                     │ (FK: user_id)
                     ▼
┌──────────────────────────────────────────────┐
│          subscriptions table                 │
│           (AUDIT TRAIL)                      │
│                                              │
│  ⚠️  NÃO USAR como fonte da verdade         │
│  ✅  Apenas para histórico e relatórios     │
│  ✅  Permite múltiplos registros por usuário│
└──────────────────────────────────────────────┘
```

### **Fluxo de Dados:**

1. **Webhook do Stripe** → Atualiza `profiles.plan` (cache) + Insere em `subscriptions` (audit)
2. **APIs de consulta** → Buscam `profiles.stripe_customer_id` → Consultam Stripe API
3. **UI** → Usa hook que cache subscription do Stripe no localStorage

---

## 📝 ARQUIVOS MODIFICADOS

### **Schema & Migration**

| Arquivo                                                      | Mudanças                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `db/schema.ts`                                               | ❌ Removido `stripe_subscription_id` de profiles<br>✅ Ajustado constraints de subscriptions |
| `db/migrations/007_remove_redundant_subscription_fields.sql` | ✅ Migration completa com rollback                                                           |

### **APIs Refatoradas**

| Arquivo                                      | Mudanças                                                |
| -------------------------------------------- | ------------------------------------------------------- |
| `app/api/stripe/subscription/route.ts`       | ✅ Usa `stripe.subscriptions.list()` ao invés da tabela |
| `app/api/stripe/change-plan/route.ts`        | ✅ Busca subscription do Stripe, insere audit trail     |
| `app/api/stripe/cancel-plan-change/route.ts` | ✅ Usa `stripe_customer_id` do profile                  |
| `app/api/stripe/upgrade-preview/route.ts`    | ✅ Usa `stripe_customer_id` do profile                  |
| `app/api/stripe/webhook/route.ts`            | ✅ Simplificado, remove campos inexistentes             |

### **Hooks**

| Arquivo                           | Mudanças                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `hooks/use-subscription-cache.ts` | ✅ Corrigido `current_period_end` ao invés de `cancel_at`<br>✅ Type guards para acessar propriedades |

---

## 🗃️ MIGRATION SQL

**Arquivo:** `db/migrations/007_remove_redundant_subscription_fields.sql`

**Principais Operações:**

1. ✅ Remove `stripe_subscription_id` de profiles
2. ✅ Remove UNIQUE constraints de `subscriptions.user_id` e `subscriptions.stripe_customer_id`
3. ✅ Adiciona índices para performance (audit trail)
4. ✅ Adiciona comentários explicativos
5. ✅ Inclui script de rollback completo

**Para Aplicar:**

```bash
# Conectar ao Supabase e executar a migration
psql $DATABASE_URL < db/migrations/007_remove_redundant_subscription_fields.sql
```

---

## 🔄 FLUXOS CORRIGIDOS

### **1. Buscar Subscription Ativa**

**Antes (Errado):**

```
User → API → supabase.from('subscriptions') → stripe.subscriptions.retrieve()
                    ↓ (Se tabela desatualizada = erro)
```

**Depois (Correto):**

```
User → API → supabase.from('profiles').select('stripe_customer_id')
           → stripe.subscriptions.list({ customer: ... })
                    ↓ (Sempre atualizado)
```

### **2. Mudança de Plano (Upgrade/Downgrade)**

**Antes (Errado):**

```
User → API → supabase.from('subscriptions') → stripe.subscriptions.update()
           → supabase.from('subscriptions').update()
```

**Depois (Correto):**

```
User → API → supabase.from('profiles').select('stripe_customer_id')
           → stripe.subscriptions.list()
           → stripe.subscriptions.update()
           → supabase.from('subscriptions').insert() ✅ Audit trail
           → supabase.from('profiles').update({ plan }) ✅ Cache
```

### **3. Webhook Stripe → Database**

**Antes (Complexo):**

```
Webhook → Upsert subscriptions (com campos inexistentes)
        → Update profiles (plan_expire_at, renew_status, pending_plan_id...)
```

**Depois (Simples):**

```
Webhook → Insert subscriptions (audit trail)
        → Update profiles (plan, stripe_customer_id)
```

---

## 🧪 TESTES NECESSÁRIOS

### **1. Testes de API**

- [ ] GET `/api/stripe/subscription` com subscription ativa
- [ ] GET `/api/stripe/subscription` com plano starter (sem subscription)
- [ ] POST `/api/stripe/change-plan` (upgrade)
- [ ] POST `/api/stripe/change-plan` (downgrade)
- [ ] POST `/api/stripe/cancel-plan-change`
- [ ] POST `/api/stripe/upgrade-preview`

### **2. Testes de Webhook**

- [ ] `customer.subscription.created` - Primeira subscription
- [ ] `customer.subscription.updated` - Mudança de plano
- [ ] `customer.subscription.deleted` - Cancelamento
- [ ] `invoice.payment_succeeded` - Pagamento bem-sucedido
- [ ] `invoice.payment_failed` - Falha de pagamento

### **3. Testes de UI**

- [ ] Página `/billing` exibe dados corretos
- [ ] Página `/plan` exibe plano atual correto
- [ ] Hook `useSubscriptionCache` retorna `current_period_end` correto
- [ ] Datas exibidas estão corretas (não mostram data de cancelamento)

### **4. Testes de Cache**

- [ ] Cache persiste após reload da página
- [ ] Cache expira corretamente às 6h AM
- [ ] `refreshSubscription()` invalida cache corretamente

---

## 🚀 PRÓXIMOS PASSOS

### **Imediato (Obrigatório):**

1. ✅ Executar migration SQL no banco de produção
2. ✅ Fazer deploy das mudanças de código
3. ✅ Testar fluxo completo em staging
4. ✅ Monitorar logs de erro após deploy

### **Curto Prazo (Recomendado):**

1. 📊 Adicionar métricas de performance das APIs
2. 🔍 Adicionar monitoramento de taxa de erro do Stripe
3. 📝 Atualizar documentação técnica
4. 🧹 Limpar código comentado nas páginas billing/plan

### **Médio Prazo (Melhorias):**

1. 🎯 Implementar testes automatizados E2E
2. 📈 Dashboard de audit trail (subscriptions table)
3. 🔔 Alertas automáticos para falhas de sincronização
4. 🧪 Testes de carga em APIs críticas

---

## 📊 MÉTRICAS DE SUCESSO

### **Antes (Problemas):**

- ❌ Erros frequentes em `/api/stripe/subscription`
- ❌ Dados inconsistentes entre tabelas
- ❌ Datas incorretas na UI
- ❌ Redundância de dados (DRY violation)

### **Depois (Esperado):**

- ✅ 0 erros de "subscription não encontrada"
- ✅ Fonte única da verdade (Stripe)
- ✅ Datas corretas na UI (current_period_end)
- ✅ Audit trail funcionando (subscriptions table)
- ✅ Cache performático (localStorage + 6h AM reset)

---

## 🆘 TROUBLESHOOTING

### **Erro: "Nenhuma subscription ativa encontrada"**

**Causa:** Profile com plano pago mas sem `stripe_customer_id`

**Solução:**

```sql
-- Verificar perfis inconsistentes
SELECT * FROM profiles
WHERE plan != 'starter' AND stripe_customer_id IS NULL;

-- Corrigir manualmente buscando no Stripe
```

### **Erro: "Property 'current_period_end' does not exist"**

**Causa:** Tipo TypeScript do Stripe não reconhecido

**Solução:** Usar type guards (já implementado no hook):

```typescript
if (subscription && 'current_period_end' in subscription) {
  // Acesso seguro
}
```

### **Erro: Webhook falhando**

**Causa:** Metadata ausente em subscription antiga

**Solução:** Adicionar metadata via Stripe Dashboard:

```typescript
metadata: {
  userId: 'uuid',
  planId: 'basic'
}
```

---

## 📚 REFERÊNCIAS

- [Stripe Subscriptions API](https://docs.stripe.com/api/subscriptions)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [AGENTS.MD - Princípios do Projeto](/AGENTS.MD)

---

**✅ CORREÇÃO COMPLETA - Sistema robusto, sem redundância, com Stripe como fonte única da verdade**
