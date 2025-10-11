# 🚀 Guia Rápido de Implementação

## ✅ O Que Já Foi Feito

1. ✅ **Schema atualizado** em `db/schema.ts`

   - Profiles agora tem `stripe_subscription_id` e `stripe_customer_id`
   - Subscriptions simplificada para histórico apenas
   - Removidas colunas: `plan_expire_at`, `renew_status`, `pending_plan_*`

2. ✅ **Helper criado** em `lib/stripe/subscription-helper.ts`

   - `getSubscriptionData()` - busca dados completos da Stripe
   - `hasActiveSubscription()` - verifica assinatura ativa
   - `updateSubscriptionNow()` - upgrade/downgrade imediato com proration
   - `scheduleSubscriptionUpdate()` - agenda mudança para vencimento
   - `calculateProration()` - calcula custo de upgrade

3. ✅ **Migration SQL** em `db/migrations/0004_stripe_as_source_of_truth.sql`

   - Adiciona novas colunas
   - Renomeia colunas antigas (para rollback fácil)
   - Migra dados existentes
   - Inclui instruções de rollback

4. ✅ **Documentação completa** em `docs/STRIPE_AS_SOURCE_OF_TRUTH.md`
   - Arquitetura explicada
   - Fluxos de dados
   - Exemplos de código
   - Guias de uso

---

## 📋 Próximos Passos (Para Você Implementar)

### Passo 1: Aplicar Migration no Banco 🗄️

```bash
# 1. Fazer backup (OBRIGATÓRIO!)
pg_dump -U postgres -h your-db-host -d postgres > backup_$(date +%Y%m%d).sql

# 2. Aplicar migration via Supabase Studio SQL Editor
# Copie e cole o conteúdo de: db/migrations/0004_stripe_as_source_of_truth.sql

# 3. Ou via CLI
psql -U postgres -h your-db-host -d postgres -f db/migrations/0004_stripe_as_source_of_truth.sql
```

### Passo 2: Atualizar o Endpoint Verify-Session ✍️

O arquivo `app/api/stripe/verify-session/route.ts` já foi parcialmente atualizado, mas precisa ser finalizado.

**Substituir a lógica de atualização do profile:**

```typescript
// SUBSTITUIR (linhas ~195-210):
const { error: updateError } = await supabase
  .from('profiles')
  .update({
    plan: planId,
    plan_expire_at: currentPeriodEnd.toISOString().split('T')[0],
    renew_status: billingPeriod === 'monthly' ? 'monthly' : 'yearly',
    updated_at: new Date().toISOString(),
  })
  .eq('id', profile.id);

// POR:
// 1. Extrair subscription_id da sessão
const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

if (!subscriptionId) {
  return NextResponse.json({ error: 'Subscription ID não encontrado' }, { status: 404 });
}

// 2. Buscar dados completos da Stripe
const subscriptionData = await getSubscriptionData(subscriptionId);

if (!subscriptionData) {
  return NextResponse.json({ error: 'Erro ao buscar dados da subscription' }, { status: 500 });
}

// 3. Extrair customer_id
const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

// 4. Atualizar profile (APENAS subscription_id e customer_id)
const { error: updateError } = await supabase
  .from('profiles')
  .update({
    plan: subscriptionData.planId, // Cache apenas
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString(),
  })
  .eq('id', profile.id);

// 5. Criar registro histórico
await supabase.from('subscriptions').insert({
  user_id: profile.id,
  stripe_customer_id: customerId!,
  stripe_subscription_id: subscriptionId,
  stripe_price_id: subscriptionData.priceId,
  status: subscriptionData.status,
  plan_id: subscriptionData.planId,
  event_type: 'created',
});
```

### Passo 3: Atualizar o Webhook Handler 🎣

Em `app/api/stripe/webhook/route.ts`, simplificar a lógica:

**No handler `checkout.session.completed`:**

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;

  if (!userId) break;

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  if (!subscriptionId || !customerId) break;

  // Buscar dados da Stripe
  const subscriptionData = await getSubscriptionData(subscriptionId);
  if (!subscriptionData) break;

  // Atualizar profile
  await supabase
    .from('profiles')
    .update({
      plan: subscriptionData.planId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
    })
    .eq('user_id', userId);

  // Registrar evento
  await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: subscriptionData.priceId,
    status: subscriptionData.status,
    plan_id: subscriptionData.planId,
    event_type: 'created',
  });

  break;
}
```

**Nos handlers `customer.subscription.updated` e `deleted`:**

```typescript
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;

  // Buscar profile pelo subscription_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!profile) break;

  const subscriptionData = await getSubscriptionData(subscription.id);
  if (!subscriptionData) break;

  // Atualizar cache do plano
  await supabase
    .from('profiles')
    .update({ plan: subscriptionData.planId })
    .eq('id', profile.id);

  // Registrar evento
  await supabase.from('subscriptions').insert({
    user_id: profile.id,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscriptionData.priceId,
    status: subscriptionData.status,
    plan_id: subscriptionData.planId,
    event_type: 'updated',
  });

  break;
}

case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!profile) break;

  // Voltar para plano starter
  await supabase
    .from('profiles')
    .update({
      plan: 'starter',
      stripe_subscription_id: null,
    })
    .eq('id', profile.id);

  // Registrar evento
  await supabase.from('subscriptions').insert({
    user_id: profile.id,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id || '',
    status: 'canceled',
    plan_id: 'starter',
    event_type: 'deleted',
  });

  break;
}
```

### Passo 4: Criar Endpoint de Troca de Plano 🔄

Criar `app/api/stripe/change-plan/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getSubscriptionData,
  updateSubscriptionNow,
  scheduleSubscriptionUpdate,
  calculateProration,
} from '@/lib/stripe/subscription-helper';

const ChangePlanSchema = z.object({
  newPriceId: z.string(),
  changeType: z.enum(['now', 'at-renewal']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ChangePlanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { newPriceId, changeType } = validation.data;

    // Autenticar
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa' }, { status: 400 });
    }

    // Executar mudança
    let result;
    if (changeType === 'now') {
      result = await updateSubscriptionNow(profile.stripe_subscription_id, newPriceId);
    } else {
      result = await scheduleSubscriptionUpdate(profile.stripe_subscription_id, newPriceId);
    }

    if (!result) {
      return NextResponse.json({ error: 'Erro ao alterar plano' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: result,
      message: changeType === 'now' ? 'Plano alterado imediatamente' : 'Alteração agendada para o próximo período',
    });
  } catch (error: any) {
    console.error('Erro ao trocar plano:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Endpoint para calcular proration
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const newPriceId = searchParams.get('newPriceId');

  if (!newPriceId) {
    return NextResponse.json({ error: 'newPriceId é obrigatório' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Nenhuma assinatura ativa' }, { status: 400 });
  }

  const amount = await calculateProration(profile.stripe_subscription_id, newPriceId);

  return NextResponse.json({ prorationAmount: amount });
}
```

### Passo 5: Atualizar a UI (Plan Page) 🎨

Em `app/plan/page.tsx`, adicionar lógica para detectar assinatura ativa:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getSubscriptionData, hasActiveSubscription } from '@/lib/stripe/subscription-helper';
import { UpgradeConfirmDialog } from '@/components/UpgradeConfirmDialog';
import { DowngradeConfirmDialog } from '@/components/DowngradeConfirmDialog';

export default function PlanPage() {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      // Buscar profile do usuário
      const response = await fetch('/api/profile');
      const profile = await response.json();

      if (profile.stripe_subscription_id) {
        // Buscar dados completos da Stripe
        const subData = await getSubscriptionData(profile.stripe_subscription_id);
        setCurrentSubscription(subData);
      }

      setLoading(false);
    }

    loadSubscription();
  }, []);

  async function handleSelectPlan(planId: string, priceId: string) {
    if (!currentSubscription) {
      // Sem assinatura: redirect para checkout normal
      window.location.href = `/api/stripe/create-checkout?planId=${planId}`;
      return;
    }

    // Com assinatura: mostrar dialog de troca
    const isUpgrade = comparePlans(currentSubscription.planId, planId) < 0;

    if (isUpgrade) {
      // Calcular proration
      const res = await fetch(`/api/stripe/change-plan?newPriceId=${priceId}`);
      const { prorationAmount } = await res.json();

      // Mostrar dialog de upgrade
      setShowUpgradeDialog({
        currentPlan: currentSubscription.planId,
        newPlan: planId,
        newPriceId: priceId,
        prorationAmount,
        currentPeriodEnd: currentSubscription.currentPeriodEnd,
      });
    } else {
      // Mostrar dialog de downgrade
      setShowDowngradeDialog({
        currentPlan: currentSubscription.planId,
        newPlan: planId,
        newPriceId: priceId,
        effectiveDate: currentSubscription.currentPeriodEnd,
      });
    }
  }

  // ... resto do componente
}
```

### Passo 6: Criar Dialogs de Confirmação 💬

Criar `components/UpgradeConfirmDialog.tsx` e `components/DowngradeConfirmDialog.tsx` conforme exemplos na documentação principal.

---

## 🧪 Testando

### 1. Testar Migration

```bash
# Em desenvolvimento
pnpm db:push
```

### 2. Testar Helpers

```typescript
// No console do browser ou Node REPL
import { getSubscriptionData } from '@/lib/stripe/subscription-helper';

const data = await getSubscriptionData('sub_xxxxx');
console.log(data);
```

### 3. Testar Fluxo Completo

1. ✅ Criar nova assinatura (checkout)
2. ✅ Verificar que `stripe_subscription_id` foi salvo
3. ✅ Fazer upgrade imediato (com proration)
4. ✅ Fazer downgrade agendado
5. ✅ Cancelar assinatura
6. ✅ Verificar webhooks

---

## 🚨 Troubleshooting

### Erro: "stripe_subscription_id não existe"

Execute a migration SQL novamente.

### Erro: "Cannot read property 'current_period_end'"

Certifique-se de usar os helpers em vez de acessar propriedades diretamente.

### Webhooks não estão funcionando

Verifique:

1. Endpoint está configurado no Stripe Dashboard
2. Secret do webhook está correto em `.env`
3. Teste com `stripe listen --forward-to localhost:8800/api/stripe/webhook`

---

## 📚 Referências

- [Documentação completa](./STRIPE_AS_SOURCE_OF_TRUTH.md)
- [Stripe Subscriptions API](https://stripe.com/docs/api/subscriptions)
- [Subscription Schedules](https://stripe.com/docs/billing/subscriptions/subscription-schedules)

---

**Boa implementação! 🚀**
