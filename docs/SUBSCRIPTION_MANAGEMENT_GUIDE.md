# Gerenciamento de Assinaturas Stripe - Guia Completo

## 📋 Visão Geral

Sistema completo de gerenciamento de assinaturas seguindo as **melhores práticas da Stripe**, com suporte para:

- ✅ **Upgrades**: Imediatos com cobrança proporcional
- ✅ **Downgrades**: Agendados para final do período (sem cobrança adicional)
- ✅ **Cancelamentos**: Mantém acesso até o final do período pago
- ✅ **Reativações**: Remove cancelamento agendado

---

## 🏗️ Arquitetura

### 1. Camada de Lógica: `lib/stripe/subscription-management.ts`

Funções principais:

#### `upgradeSubscriptionNow()`

- **Quando usar**: Usuário quer um plano melhor AGORA
- **Comportamento**:
  - Muda o plano imediatamente
  - Cobra proporcionalmente pelo tempo restante
  - Mantém a data de renovação original
- **Parâmetros Stripe**:
  - `proration_behavior: 'create_prorations'` - Cobra/credita proporcional
  - `payment_behavior: 'error_if_incomplete'` - Falha se pagamento incompleto
  - `billing_cycle_anchor: 'unchanged'` - Mantém data de renovação

```typescript
// Exemplo: Usuário no plano Basic (R$ 49/mês) quer Plus (R$ 99/mês)
// Faltam 15 dias no período atual
// Será cobrado: (99 - 49) * (15 / 30) = R$ 25
const result = await upgradeSubscriptionNow(subscriptionId, newPriceId);
```

#### `downgradeSubscriptionAtPeriodEnd()`

- **Quando usar**: Usuário quer economizar, mas já pagou o período atual
- **Comportamento**:
  - Cria um `subscription_schedule` no Stripe
  - Mantém plano atual até o vencimento
  - Muda para novo plano no próximo ciclo
  - **SEM cobrança adicional**
- **Parâmetros Stripe**:
  - Usa `subscriptionSchedules.create()` com 2 fases

```typescript
// Exemplo: Usuário no Plus (R$ 99/mês) quer Basic (R$ 49/mês)
// Período atual vence em 10/02/2025
// Continua no Plus até 10/02, muda para Basic a partir de 11/02
const result = await downgradeSubscriptionAtPeriodEnd(subscriptionId, newPriceId);
```

#### `cancelSubscriptionAtPeriodEnd()`

- **Quando usar**: Usuário não quer renovar, mas já pagou este mês
- **Comportamento**:
  - Define `cancel_at_period_end: true`
  - Mantém acesso até o final do período
  - Permite reativação
- **Parâmetros Stripe**:
  - `cancel_at_period_end: true`
  - `proration_behavior: 'none'` - Sem reembolso

```typescript
// Exemplo: Usuário no Essentials (R$ 69/mês)
// Período vence em 25/02/2025
// Continua com acesso até 25/02, depois volta para Starter (gratuito)
const result = await cancelSubscriptionAtPeriodEnd(subscriptionId);
```

#### `reactivateSubscription()`

- **Quando usar**: Usuário cancelou mas mudou de ideia
- **Comportamento**:
  - Remove flag `cancel_at_period_end`
  - Assinatura volta a renovar normalmente

```typescript
const result = await reactivateSubscription(subscriptionId);
```

#### `changePlan()` - Função Inteligente

- **Quando usar**: Você não sabe se é upgrade ou downgrade
- **Comportamento**:
  - Detecta automaticamente a direção da mudança
  - Aplica a estratégia correta
  - Permite forçar mudança imediata (mesmo para downgrade)

```typescript
const result = await changePlan(
  subscriptionId,
  'basic', // Plano atual
  'plus', // Novo plano
  newPriceId,
  false // immediate: false = respeita a estratégia padrão
);
```

#### `calculateProration()`

- **Quando usar**: Mostrar preview de quanto será cobrado antes de confirmar upgrade
- **Comportamento**:
  - Simula a mudança usando `invoices.retrieveUpcoming()`
  - Retorna o valor em centavos
  - **NÃO** efetiva a mudança

```typescript
const amountInCents = await calculateProration(subscriptionId, newPriceId);
// Ex: 2500 = R$ 25,00
```

---

### 2. Camada de API: `app/api/stripe/manage-subscription/route.ts`

#### Endpoint: `POST /api/stripe/manage-subscription`

**Body:**

```json
{
  "action": "upgrade" | "downgrade" | "cancel" | "reactivate",
  "newPlan": "starter" | "basic" | "essentials" | "plus" | "advanced",
  "immediate": false
}
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "message": "Upgrade realizado com sucesso",
  "effectiveDate": "2025-02-01T12:00:00Z",
  "prorationAmount": 2500,
  "subscription": {
    /* dados da subscription */
  }
}
```

**Resposta de Erro:**

```json
{
  "error": "Mensagem de erro"
}
```

**Fluxo:**

1. Autenticar usuário via Supabase
2. Validar body da requisição
3. Buscar profile e subscription_id do usuário
4. Executar ação correspondente
5. Atualizar banco de dados (se necessário)
6. Retornar resultado

---

### 3. Camada de UI: `components/SubscriptionManager.tsx`

#### Componente React

```tsx
<SubscriptionManager
  currentPlan="basic"
  targetPlan="plus"
  action="upgrade"
  isOpen={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  onSuccess={() => window.location.reload()}
/>
```

**Props:**

- `currentPlan`: Plano atual do usuário
- `targetPlan`: Plano para o qual deseja mudar
- `action`: Tipo de operação
- `isOpen`: Controla visibilidade do dialog
- `onClose`: Callback para fechar
- `onSuccess`: Callback após sucesso

**Features:**

- ✅ Exibe valor de proration em upgrades
- ✅ Mostra data efetiva da mudança
- ✅ Opção de aplicar downgrade imediatamente
- ✅ Feedback visual de sucesso/erro
- ✅ Loading states
- ✅ Mensagens contextuais

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs (obtenha no Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_...
NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS=price_...
NEXT_PUBLIC_STRIPE_PRICE_PLUS=price_...
NEXT_PUBLIC_STRIPE_PRICE_ADVANCED=price_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Migração do Banco

Certifique-se de que a migration `0004_stripe_as_source_of_truth.sql` foi aplicada:

```bash
# Aplicar migration manualmente no Supabase SQL Editor
# Ou via Drizzle
pnpm db:push
```

### 3. Mapeamento de Price IDs

Atualize o mapeamento em `subscription-management.ts`:

```typescript
const PLAN_TO_PRICE_ID: Record<keyof typeof PlanType, string> = {
  starter: '',
  basic: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || '',
  essentials: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS || '',
  plus: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS || '',
  advanced: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCED || '',
};
```

E também em `manage-subscription/route.ts`.

---

## 📖 Exemplos de Uso

### Exemplo 1: Upgrade Simples

```tsx
'use client';

import { useState } from 'react';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { Button } from '@/components/ui/button';

export function PlanCard() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <Button onClick={() => setShowUpgrade(true)}>Fazer Upgrade para Plus</Button>

      <SubscriptionManager
        currentPlan="basic"
        targetPlan="plus"
        action="upgrade"
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onSuccess={() => {
          console.log('Upgrade concluído!');
          window.location.reload();
        }}
      />
    </>
  );
}
```

### Exemplo 2: Downgrade Agendado

```tsx
const [showDowngrade, setShowDowngrade] = useState(false);

return (
  <SubscriptionManager
    currentPlan="advanced"
    targetPlan="essentials"
    action="downgrade"
    isOpen={showDowngrade}
    onClose={() => setShowDowngrade(false)}
    onSuccess={() => {
      alert('Downgrade agendado para o final do período!');
    }}
  />
);
```

### Exemplo 3: Cancelamento

```tsx
const [showCancel, setShowCancel] = useState(false);

return (
  <SubscriptionManager
    currentPlan="plus"
    targetPlan="starter"
    action="cancel"
    isOpen={showCancel}
    onClose={() => setShowCancel(false)}
    onSuccess={() => {
      alert('Você terá acesso até o final do período.');
    }}
  />
);
```

### Exemplo 4: Reativação

```tsx
// Mostrar botão de reativação apenas se subscription.cancel_at_period_end === true

const [showReactivate, setShowReactivate] = useState(false);

return (
  <SubscriptionManager
    currentPlan="basic"
    targetPlan="basic"
    action="reactivate"
    isOpen={showReactivate}
    onClose={() => setShowReactivate(false)}
    onSuccess={() => {
      alert('Assinatura reativada! Você continuará no plano Basic.');
    }}
  />
);
```

---

## 🧪 Testes

### Cenários de Teste

#### 1. Upgrade Imediato

1. Usuário no plano Basic (R$ 49/mês)
2. Faltam 10 dias no período
3. Faz upgrade para Plus (R$ 99/mês)
4. **Esperado**:
   - Cobra ~R$ 16,67 agora
   - Plano muda imediatamente
   - Próxima cobrança: R$ 99 em 10 dias

#### 2. Downgrade Agendado

1. Usuário no plano Advanced (R$ 149/mês)
2. Faz downgrade para Essentials (R$ 69/mês)
3. **Esperado**:
   - Sem cobrança adicional
   - Continua no Advanced até o vencimento
   - Muda para Essentials no próximo ciclo

#### 3. Cancelamento

1. Usuário no plano Plus (R$ 99/mês)
2. Cancela assinatura
3. **Esperado**:
   - Continua com acesso Plus até o vencimento
   - Após vencimento, volta para Starter (gratuito)
   - Pode reativar antes do vencimento

#### 4. Reativação

1. Usuário cancelou Plus há 5 dias
2. Ainda tem 10 dias de acesso
3. Reativa assinatura
4. **Esperado**:
   - Cancelamento removido
   - Assinatura volta a renovar normalmente

---

## ⚠️ Tratamento de Erros

### Erros Comuns

#### 1. `payment_behavior: 'error_if_incomplete'`

**Erro**: Pagamento incompleto (cartão recusado)
**Comportamento**: A mudança de plano NÃO é aplicada
**Mensagem**: "Erro ao processar pagamento. Verifique seu cartão."

```typescript
if (!result.success && result.message.includes('payment')) {
  // Redirecionar para atualizar método de pagamento
  router.push('/billing/update-payment');
}
```

#### 2. Subscription Não Encontrada

**Erro**: `stripe_subscription_id` é null
**Comportamento**: API retorna 400
**Mensagem**: "Nenhuma assinatura ativa encontrada"

```typescript
if (error.includes('assinatura ativa')) {
  // Usuário precisa criar uma assinatura primeiro
  router.push('/plan');
}
```

#### 3. Price ID Não Configurado

**Erro**: Variável de ambiente faltando
**Comportamento**: API retorna 500
**Mensagem**: "Price ID não configurado para este plano"

```typescript
// Verificar no Stripe Dashboard e adicionar ao .env.local
NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS=price_...
```

---

## 📊 Monitoramento

### Webhooks a Implementar

Para sincronizar mudanças feitas diretamente no Stripe Dashboard:

```typescript
// app/api/stripe/webhook/route.ts

switch (event.type) {
  case 'customer.subscription.updated':
    // Atualizar profiles.plan no banco
    break;

  case 'customer.subscription.deleted':
    // Voltar para plano starter
    break;

  case 'invoice.payment_failed':
    // Notificar usuário
    break;

  case 'subscription_schedule.created':
    // Log da mudança agendada
    break;
}
```

### Logs no Stripe Dashboard

1. **Upgrades**: Ver na timeline da subscription
2. **Downgrades**: Ver em "Subscription Schedules"
3. **Cancelamentos**: Flag `cancel_at_period_end` aparece na subscription
4. **Prorations**: Ver em "Invoices" → linha item com descrição "Unused time"

---

## 🎯 Melhores Práticas Aplicadas

### ✅ Seguindo a Documentação Stripe

1. **Upgrades**:

   - `proration_behavior: 'create_prorations'` ✅
   - `payment_behavior: 'error_if_incomplete'` ✅
   - `billing_cycle_anchor: 'unchanged'` ✅

2. **Downgrades**:

   - Usa `subscription_schedule` ✅
   - Sem proration ✅
   - Mantém acesso até o fim ✅

3. **Cancelamentos**:
   - `cancel_at_period_end: true` ✅
   - Permite reativação ✅
   - Sem reembolso proporcional ✅

### ✅ Princípios do AGENTS.md

1. **Clareza**: Nomes descritivos (`upgradeSubscriptionNow`, `downgradeSubscriptionAtPeriodEnd`)
2. **Modularidade**: Funções com responsabilidades únicas
3. **Segurança**: Validação de autenticação e ownership
4. **Simplicidade**: Uma função para cada cenário, sem complexidade desnecessária
5. **Documentação**: JSDoc em todas as funções, comentários explicativos

---

## 🚀 Próximos Passos

1. **Testes End-to-End**:

   ```bash
   # Testar fluxo completo em ambiente de teste
   npm run test:e2e
   ```

2. **Implementar Webhooks**:

   - Criar handler para `customer.subscription.updated`
   - Sincronizar mudanças feitas no Stripe Dashboard

3. **UI da Página de Planos**:

   - Integrar `SubscriptionManager` na página `/plan`
   - Mostrar botão de reativação se `cancel_at_period_end === true`

4. **Notificações**:

   - Enviar e-mail quando downgrade for agendado
   - Lembrete 3 dias antes do cancelamento efetivo

5. **Analytics**:
   - Rastrear upgrades/downgrades no Google Analytics
   - Dashboard de retenção de usuários

---

## 📚 Referências

- [Stripe: Update Subscription](https://docs.stripe.com/api/subscriptions/update)
- [Stripe: Cancel Subscription](https://docs.stripe.com/api/subscriptions/cancel)
- [Stripe: Upgrade/Downgrade Guide](https://docs.stripe.com/billing/subscriptions/upgrade-downgrade)
- [Stripe: Subscription Schedules](https://docs.stripe.com/billing/subscriptions/subscription-schedules)
- [Stripe: Prorations](https://docs.stripe.com/billing/subscriptions/prorations)

---

## ✅ Checklist de Implementação

- [x] Criar `subscription-management.ts` com funções de gerenciamento
- [x] Criar endpoint `/api/stripe/manage-subscription`
- [x] Criar componente `SubscriptionManager`
- [x] Adicionar função `formatPrice` em `lib/utils.ts`
- [x] Documentação completa
- [ ] Aplicar migration `0004_stripe_as_source_of_truth.sql`
- [ ] Configurar variáveis de ambiente de produção
- [ ] Integrar na página `/plan`
- [ ] Implementar webhooks
- [ ] Testes end-to-end
- [ ] Deploy para produção

---

**Implementado com ❤️ seguindo o GRIMÓRIO ARCANO (AGENTS.md)**
