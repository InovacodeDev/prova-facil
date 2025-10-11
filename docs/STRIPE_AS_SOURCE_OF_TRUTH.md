# 🏗️ Nova Arquitetura: Stripe como Fonte da Verdade

## 📋 Resumo Executivo

Esta documentação descreve a **refatoração arquitetural completa** do sistema de assinaturas, migrando de um modelo onde o banco de dados local armazenava dados completos para um modelo onde **a Stripe é a única fonte da verdade**.

### Motivação

1. **Simplicidade**: Eliminar sincronização complexa entre banco e Stripe
2. **Consistência**: Dados sempre atualizados e confiáveis
3. **Manutenibilidade**: Menos código, menos bugs
4. **Controle**: Aproveitar todo o poder da Stripe API
5. **Escalabilidade**: Fácil adicionar novos recursos (trials, cupons, etc)

---

## 🎯 Mudanças Fundamentais

### ANTES (Modelo Antigo)

```typescript
// ❌ Banco de dados era a fonte da verdade
interface ProfileOld {
  plan: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';
  plan_expire_at: Date; // ← Duplicação dos dados da Stripe
  renew_status: 'monthly' | 'yearly' | 'trial' | 'canceled';
  pending_plan_id: string | null; // ← Lógica complexa
  pending_plan_change_at: Date | null;
}

// ❌ Subscriptions table armazenava dados completos
interface SubscriptionOld {
  stripe_subscription_id: string;
  current_period_start: Date; // ← Duplicação
  current_period_end: Date; // ← Duplicação
  cancel_at_period_end: boolean; // ← Duplicação
  status: string; // ← Duplicação
  // ... muitos outros campos
}
```

**Problemas:**

- Dados desatualizados se webhook falhar
- Lógica de troca de plano complexa
- Difícil debugar inconsistências
- Código duplicado entre webhook e verify-session

### DEPOIS (Modelo Novo)

```typescript
// ✅ Stripe é a fonte da verdade
interface ProfileNew {
  plan: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced'; // Cache apenas
  stripe_subscription_id: string | null; // ← Referência para Stripe
  stripe_customer_id: string | null; // ← Referência para Stripe
  // Removidos: plan_expire_at, renew_status, pending_plan_id, pending_plan_change_at
}

// ✅ Subscriptions é apenas histórico/audit trail
interface SubscriptionNew {
  stripe_subscription_id: string;
  event_type: string; // 'created', 'updated', 'deleted'
  status: string;
  plan_id: string;
  created_at: Date; // Timestamp do evento
  // Removidos: current_period_*, cancel_at_period_end, etc
}
```

**Benefícios:**

- Dados SEMPRE corretos (busca da Stripe em tempo real)
- Lógica de troca de plano delegada à Stripe
- Fácil debugar (Stripe Dashboard é a verdade)
- Código simplificado

---

## 🔄 Fluxo de Dados

### 1. Checkout / Criação de Assinatura

```
┌─────────────┐      ┌──────────┐      ┌──────────────┐
│   Cliente   │─────▶│  Stripe  │─────▶│   Webhook    │
└─────────────┘      └──────────┘      └──────────────┘
                           │                    │
                           │                    ▼
                           │            ┌──────────────┐
                           │            │   profiles   │
                           │            │ ────────────  │
                           │            │ subscription_│
                           │            │      id      │
                           ▼            └──────────────┘
                   ┌──────────────┐
                   │ verify-      │
                   │  session     │
                   └──────────────┘
```

1. Cliente completa checkout na Stripe
2. Stripe envia webhook `checkout.session.completed`
3. **Webhook** salva `stripe_subscription_id` no profile
4. **Verify-session** confirma e busca dados da Stripe
5. UI busca dados frescos da Stripe quando necessário

### 2. Consulta de Dados

```
┌─────────────┐
│     UI      │
└─────────────┘
       │
       ▼
┌──────────────┐    Busca subscription_id     ┌──────────────┐
│   profiles   │◀────────────────────────────▶│ getProfile() │
└──────────────┘                               └──────────────┘
       │                                              │
       │ stripe_subscription_id                       │
       ▼                                              ▼
┌──────────────┐   Busca dados completos      ┌──────────────┐
│    Stripe    │◀────────────────────────────▶│getSubscription│
│     API      │                               │   Data()     │
└──────────────┘                               └──────────────┘
```

**Importante:** Nunca confiar em dados locais para lógica crítica!

---

## 📁 Estrutura de Arquivos

### Novos Arquivos Criados

```
lib/stripe/
  └── subscription-helper.ts       ← Funções para buscar dados da Stripe

docs/
  └── STRIPE_AS_SOURCE_OF_TRUTH.md ← Esta documentação
```

### Arquivos Modificados

```
db/schema.ts                       ← Schema atualizado
app/api/stripe/verify-session/     ← Simplificado
app/api/stripe/webhook/            ← Simplificado (próximo)
app/plan/page.tsx                   ← Usar helpers (próximo)
components/*/                       ← Usar helpers (próximo)
```

---

## 🛠️ API Helper: `subscription-helper.ts`

### Funções Disponíveis

#### 1. `getSubscriptionData(subscriptionId: string)`

Busca dados completos de uma subscription.

```typescript
const data = await getSubscriptionData('sub_xxxxx');

// Retorna:
{
  id: 'sub_xxxxx',
  status: 'active',
  planId: 'basic',
  priceId: 'price_xxxxx',
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialEnd: null,
}
```

#### 2. `hasActiveSubscription(customerId: string)`

Verifica se customer tem assinatura ativa.

```typescript
const activeSub = await hasActiveSubscription('cus_xxxxx');

if (activeSub) {
  console.log(`Cliente tem plano: ${activeSub.planId}`);
  console.log(`Vence em: ${activeSub.currentPeriodEnd}`);
}
```

#### 3. `updateSubscriptionNow(subscriptionId, newPriceId)`

Atualiza subscription IMEDIATAMENTE com proration.

```typescript
const updated = await updateSubscriptionNow('sub_xxxxx', 'price_new');
// ✅ Cliente é cobrado/creditado proporcionalmente
// ✅ Mudança imediata
```

#### 4. `scheduleSubscriptionUpdate(subscriptionId, newPriceId)`

Agenda mudança para o final do período (sem proration).

```typescript
const scheduled = await scheduleSubscriptionUpdate('sub_xxxxx', 'price_new');
// ✅ Cliente mantém plano atual até vencimento
// ✅ Sem cobranças adicionais
```

#### 5. `calculateProration(subscriptionId, newPriceId)`

Calcula o valor da proration antes de aplicar.

```typescript
const amount = await calculateProration('sub_xxxxx', 'price_new');
console.log(`Você pagará R$ ${amount / 100} para upgrade imediato`);
```

---

## 🔧 Migração do Banco de Dados

### SQL Migration

```sql
-- Migration: Simplificar profiles e subscriptions
-- Data: 2025-10-08
-- Autor: Sistema

-- 1. Adicionar novas colunas em profiles
ALTER TABLE profiles
ADD COLUMN stripe_subscription_id VARCHAR(255),
ADD COLUMN stripe_customer_id VARCHAR(255);

-- 2. Remover colunas antigas (CUIDADO: backup primeiro!)
ALTER TABLE profiles
DROP COLUMN plan_expire_at,
DROP COLUMN renew_status,
DROP COLUMN pending_plan_id,
DROP COLUMN pending_plan_change_at;

-- 3. Simplificar subscriptions table
-- OPÇÃO A: Criar nova tabela e migrar dados
CREATE TABLE subscriptions_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  status subscription_status NOT NULL,
  plan_id plan NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Migrar dados históricos (apenas último evento de cada subscription)
INSERT INTO subscriptions_new (user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, plan_id, event_type, created_at)
SELECT DISTINCT ON (stripe_subscription_id)
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  plan_id,
  'migrated' as event_type,
  updated_at as created_at
FROM subscriptions
ORDER BY stripe_subscription_id, updated_at DESC;

-- Renomear tabelas
ALTER TABLE subscriptions RENAME TO subscriptions_old;
ALTER TABLE subscriptions_new RENAME TO subscriptions;

-- OPÇÃO B: Dropar e recriar (se não precisa histórico)
-- DROP TABLE subscriptions CASCADE;
-- CREATE TABLE subscriptions (...);

-- 4. Criar índices
CREATE INDEX idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- 5. Criar view para compatibilidade (opcional)
CREATE VIEW profile_subscription_data AS
SELECT
  p.id,
  p.user_id,
  p.plan,
  p.stripe_subscription_id,
  p.stripe_customer_id,
  s.status as subscription_status,
  s.created_at as subscription_created_at
FROM profiles p
LEFT JOIN subscriptions s ON p.stripe_subscription_id = s.stripe_subscription_id;
```

### Script de Migração de Dados (opcional)

Se você quiser popular `stripe_subscription_id` e `stripe_customer_id` a partir dos dados existentes:

```sql
-- Popular stripe_subscription_id nos profiles
UPDATE profiles p
SET
  stripe_subscription_id = s.stripe_subscription_id,
  stripe_customer_id = s.stripe_customer_id
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    stripe_subscription_id,
    stripe_customer_id
  FROM subscriptions
  WHERE status = 'active'
  ORDER BY user_id, updated_at DESC
) s
WHERE p.id = s.user_id
AND p.stripe_subscription_id IS NULL;
```

---

## 🔄 Fluxo de Troca de Plano (Nova Lógica)

### Cenário 1: Usuário SEM Assinatura Ativa

```typescript
// Fluxo simples: redirect para checkout
async function handleSelectPlan(planId: string, billingPeriod: 'monthly' | 'yearly') {
  // Criar checkout session
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ planId, billingPeriod }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect para Stripe
}
```

### Cenário 2: Usuário COM Assinatura Ativa

```typescript
async function handleChangePlan(newPlanId: string, newPriceId: string) {
  // 1. Buscar subscription atual
  const profile = await getProfile();
  if (!profile.stripe_subscription_id) {
    return handleSelectPlan(newPlanId, 'monthly');
  }

  // 2. Buscar dados da subscription da Stripe
  const currentSub = await getSubscriptionData(profile.stripe_subscription_id);

  // 3. Determinar se é upgrade ou downgrade
  const isUpgrade = comparePlans(currentSub.planId, newPlanId) < 0;

  // 4. Perguntar ao usuário
  if (isUpgrade) {
    // UPGRADE: Oferecer trocar AGORA ou no VENCIMENTO
    const choice = await showUpgradeDialog({
      currentPlan: currentSub.planId,
      newPlan: newPlanId,
      currentPeriodEnd: currentSub.currentPeriodEnd,
      prorationAmount: await calculateProration(profile.stripe_subscription_id, newPriceId),
    });

    if (choice === 'now') {
      await updateSubscriptionNow(profile.stripe_subscription_id, newPriceId);
    } else {
      await scheduleSubscriptionUpdate(profile.stripe_subscription_id, newPriceId);
    }
  } else {
    // DOWNGRADE: Sempre agendar para o vencimento
    await showDowngradeDialog({
      currentPlan: currentSub.planId,
      newPlan: newPlanId,
      effectiveDate: currentSub.currentPeriodEnd,
    });

    await scheduleSubscriptionUpdate(profile.stripe_subscription_id, newPriceId);
  }
}
```

### UI Components

#### UpgradeDialog

```tsx
function UpgradeConfirmDialog({ currentPlan, newPlan, prorationAmount, currentPeriodEnd, onConfirm }) {
  return (
    <Dialog>
      <DialogTitle>Fazer upgrade agora?</DialogTitle>
      <DialogContent>
        <p>
          Você está fazendo upgrade de <strong>{currentPlan}</strong> para <strong>{newPlan}</strong>.
        </p>

        <RadioGroup>
          <Radio value="now">
            <strong>Fazer upgrade agora</strong>
            <p>
              Você será cobrado <strong>R$ {prorationAmount / 100}</strong> proporcionalmente.
            </p>
            <p>O novo plano estará ativo imediatamente.</p>
          </Radio>

          <Radio value="at-renewal">
            <strong>Agendar para renovação</strong>
            <p>
              Seu plano atual continua até <strong>{formatDate(currentPeriodEnd)}</strong>.
            </p>
            <p>Sem cobranças adicionais agora.</p>
          </Radio>
        </RadioGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onConfirm(selectedOption)}>Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
}
```

#### DowngradeDialog

```tsx
function DowngradeConfirmDialog({ currentPlan, newPlan, effectiveDate, onConfirm }) {
  return (
    <Dialog>
      <DialogTitle>Confirmar downgrade?</DialogTitle>
      <DialogContent>
        <Alert severity="info">
          <p>
            Você está fazendo downgrade de <strong>{currentPlan}</strong> para <strong>{newPlan}</strong>.
          </p>
          <p>
            A mudança será efetivada em <strong>{formatDate(effectiveDate)}</strong>.
          </p>
          <p>Você continuará com acesso total ao plano {currentPlan} até lá.</p>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm}>Confirmar downgrade</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## ✅ Checklist de Implementação

### Fase 1: Preparação (Concluída ✅)

- [x] Criar `lib/stripe/subscription-helper.ts`
- [x] Atualizar schema em `db/schema.ts`
- [x] Criar documentação completa

### Fase 2: Backend

- [ ] Aplicar migration SQL no banco de dados
- [ ] Atualizar `app/api/stripe/verify-session/route.ts` para usar helpers
- [ ] Atualizar `app/api/stripe/webhook/route.ts` para usar helpers
- [ ] Criar endpoint `/api/stripe/change-plan` (upgrade/downgrade)
- [ ] Testar todos os endpoints

### Fase 3: Frontend

- [ ] Atualizar `app/plan/page.tsx` para buscar dados da Stripe
- [ ] Criar `UpgradeConfirmDialog` component
- [ ] Criar `DowngradeConfirmDialog` component
- [ ] Atualizar todos os componentes que usam plan_expire_at
- [ ] Remover lógica de pending_plan

### Fase 4: Testes

- [ ] Testar checkout de novo plano
- [ ] Testar upgrade imediato
- [ ] Testar upgrade agendado
- [ ] Testar downgrade agendado
- [ ] Testar cancelamento
- [ ] Testar webhooks

### Fase 5: Deploy

- [ ] Backup do banco de dados
- [ ] Aplicar migration em produção
- [ ] Deploy do código
- [ ] Monitorar logs por 24h
- [ ] Validar com usuários reais

---

## 🚨 Pontos de Atenção

### 1. Migration de Dados

**CRÍTICO**: Fazer backup completo do banco antes de aplicar a migration!

```bash
# Supabase
pg_dump -U postgres -h db.xxxxx.supabase.co -d postgres > backup_$(date +%Y%m%d).sql

# Restaurar se necessário
psql -U postgres -h db.xxxxx.supabase.co -d postgres < backup_20251008.sql
```

### 2. Usuários com Assinatura Ativa

Durante a migration, usuários com assinaturas ativas precisam ter `stripe_subscription_id` populado. Use o script SQL de migração de dados.

### 3. Webhooks

Certifique-se de que os webhooks estão funcionando ANTES de fazer a migration. Teste com:

```bash
stripe listen --forward-to localhost:8800/api/stripe/webhook
stripe trigger checkout.session.completed
```

### 4. Rate Limits da Stripe

A nova arquitetura faz mais chamadas à API da Stripe. Para otimizar:

- Use cache Redis para dados frequentemente acessados (opcional)
- Implemente retry logic para rate limits
- Monitore usage no Stripe Dashboard

```typescript
// Exemplo de cache simples
const subscriptionCache = new Map<string, { data: SubscriptionData; expiry: number }>();

async function getSubscriptionDataCached(subscriptionId: string) {
  const cached = subscriptionCache.get(subscriptionId);

  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const data = await getSubscriptionData(subscriptionId);
  subscriptionCache.set(subscriptionId, {
    data,
    expiry: Date.now() + 5 * 60 * 1000, // 5 minutos
  });

  return data;
}
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto           | Antes (Banco Local)                 | Depois (Stripe como Verdade)      |
| ----------------- | ----------------------------------- | --------------------------------- |
| **Consistência**  | ❌ Pode dessinconizar               | ✅ Sempre correto                 |
| **Complexidade**  | ❌ Alta (sync lógica)               | ✅ Baixa (delegate à Stripe)      |
| **Debugging**     | ❌ Difícil (2 fontes de verdade)    | ✅ Fácil (1 fonte)                |
| **Performance**   | ✅ Queries locais rápidas           | ⚠️ API calls (usar cache)         |
| **Flexibilidade** | ❌ Precisa código para cada feature | ✅ Usa features nativas da Stripe |
| **Manutenção**    | ❌ Muito código custom              | ✅ Menos código                   |

---

## 🎓 Próximos Passos

1. **Revisar esta documentação** com o time
2. **Testar migration** em ambiente de desenvolvimento
3. **Implementar helpers** nos endpoints existentes
4. **Criar componentes UI** para troca de plano
5. **Testar extensivamente** antes de produção
6. **Deploy gradual** (feature flag?)

---

## 📚 Referências

- [Stripe Subscriptions API](https://stripe.com/docs/api/subscriptions)
- [Stripe Subscription Schedules](https://stripe.com/docs/billing/subscriptions/subscription-schedules)
- [Proration Behavior](https://stripe.com/docs/billing/subscriptions/prorations)
- [Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)

---

**Última atualização:** 08 de Outubro de 2025  
**Status:** 📝 Em Implementação  
**Responsável:** Time de Desenvolvimento
