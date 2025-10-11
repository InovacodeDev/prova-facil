# Guia de Mudança de Planos

Este documento detalha a implementação completa do sistema de upgrade/downgrade de planos com integração Stripe.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Hierarquia de Planos](#hierarquia-de-planos)
3. [Fluxo de Upgrade](#fluxo-de-upgrade)
4. [Fluxo de Downgrade](#fluxo-de-downgrade)
5. [Cálculo de Proration](#cálculo-de-proration)
6. [Interface do Usuário](#interface-do-usuário)
7. [API Endpoints](#api-endpoints)
8. [Banco de Dados](#banco-de-dados)
9. [Webhooks Stripe](#webhooks-stripe)
10. [Testando o Sistema](#testando-o-sistema)

---

## Visão Geral

O sistema de mudança de planos permite que usuários façam upgrade ou downgrade de seus planos de assinatura com lógicas distintas:

- **Upgrades**: Podem ser imediatos (com proration) ou agendados para a próxima renovação
- **Downgrades**: Sempre agendados para o final do período atual (usuário não perde o que já pagou)
- **Cancelamento de mudanças**: Permite cancelar mudanças agendadas antes que ocorram

---

## Hierarquia de Planos

Os planos possuem uma hierarquia numérica definida:

```typescript
const planHierarchy: Record<string, number> = {
  starter: 0, // Plano gratuito
  basic: 1, // R$ 39,90/mês ou R$ 359,10/ano
  essentials: 2, // R$ 69,90/mês ou R$ 629,10/ano
  plus: 3, // R$ 129,90/mês ou R$ 1.169,10/ano
  advanced: 4, // R$ 299,90/mês ou R$ 2.699,10/ano
};
```

**Upgrade**: Mudança para um plano de nível superior (ex: basic → essentials)
**Downgrade**: Mudança para um plano de nível inferior (ex: plus → essentials)

---

## Fluxo de Upgrade

### Opções Disponíveis

Quando um usuário seleciona um plano superior ao atual, são apresentadas duas opções:

#### 1. Upgrade Imediato (Com Proration)

- **Comportamento**: Mudança ocorre instantaneamente
- **Cobrança**: Valor proporcional aos dias restantes
- **Cálculo**:
  ```
  Crédito do Plano Atual = (Valor Pago / Dias Totais) × Dias Restantes
  Custo do Novo Plano = (Valor Novo / Dias Totais) × Dias Restantes
  Cobrança Imediata = Custo Novo - Crédito Atual
  ```
- **Exemplo**:
  - Plano atual: R$ 69,90/mês (30 dias)
  - Novo plano: R$ 129,90/mês
  - Dias restantes: 15 dias
  - Crédito: R$ 34,95
  - Custo novo: R$ 64,95
  - Cobrança: R$ 30,00

#### 2. Upgrade Agendado (Sem Custo Extra)

- **Comportamento**: Mudança ocorre na próxima renovação
- **Cobrança**: Nenhuma cobrança adicional agora
- **Período**: Usuário continua no plano atual até o fim do período
- **Próxima cobrança**: Valor integral do novo plano

### Implementação Backend

```typescript
// lib/stripe/plan-change.service.ts
export async function executeImmediateUpgrade(
  subscriptionId: string,
  newPlanId: string,
  newPriceId: string,
  billingPeriod: 'monthly' | 'annual'
): Promise<{ success: boolean; error?: string }> {
  // Atualiza subscription no Stripe
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice', // Calcula proration
    billing_cycle_anchor: 'unchanged', // Mantém data de renovação
  });

  // Atualiza profile no banco
  await updateProfile(userId, { plan: newPlanId });

  return { success: true };
}
```

### Interface do Usuário

```tsx
<UpgradeConfirmDialog
  isOpen={upgradeDialogOpen}
  onClose={() => setUpgradeDialogOpen(false)}
  onConfirm={handleConfirmUpgrade}
  currentPlan="essentials"
  newPlan="plus"
  billingPeriod="monthly"
  newPlanPrice={129.9}
/>
```

O dialog exibe:

- Comparação de planos
- Preview de proration com valores calculados
- Radio group para escolher entre imediato ou agendado
- Botão de confirmação com loading state

---

## Fluxo de Downgrade

### Comportamento

Downgrades são **SEMPRE agendados** para o final do período atual:

- **Motivo**: Usuário já pagou pelo período completo
- **Período**: Mantém acesso ao plano atual até a data de renovação
- **Cobrança**: Nenhuma cobrança adicional (sem proration)
- **Próxima renovação**: Cobra o valor do novo plano inferior

### Exemplo Prático

```
Situação:
- Plano atual: Plus (R$ 129,90/mês)
- Novo plano: Basic (R$ 39,90/mês)
- Data de renovação: 15/02/2025

Resultado:
✓ Downgrade agendado para 15/02/2025
✓ Acesso ao Plus mantido até 15/02/2025
✓ A partir de 15/02/2025: Acesso ao Basic
✓ Próxima cobrança: R$ 39,90
```

### Implementação Backend

```typescript
// lib/stripe/plan-change.service.ts
export async function schedulePlanChange(
  userId: string,
  newPlanId: string,
  changeAt: Date
): Promise<{ success: boolean; error?: string }> {
  // Atualiza metadata no Stripe (não modifica subscription ainda)
  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      pending_plan_id: newPlanId,
      pending_plan_change_at: changeAt.toISOString(),
    },
  });

  // Salva mudança agendada no banco
  await updateProfile(userId, {
    pending_plan_id: newPlanId,
    pending_plan_change_at: changeAt,
  });

  return { success: true };
}
```

### Interface do Usuário

```tsx
<DowngradeConfirmDialog
  isOpen={downgradeDialogOpen}
  onClose={() => setDowngradeDialogOpen(false)}
  onConfirm={handleConfirmDowngrade}
  currentPlan="plus"
  newPlan="basic"
  currentPeriodEnd={new Date('2025-02-15')}
/>
```

O dialog exibe:

- Aviso sobre perda de funcionalidades
- Data efetiva do downgrade
- Confirmação que o plano atual continua até o fim
- Badge de "AGENDADO" para enfatizar que não é imediato

---

## Cálculo de Proration

### Função de Cálculo

```typescript
// lib/stripe/plan-change.service.ts
export function calculateProration(
  currentPrice: number,
  newPrice: number,
  daysRemaining: number,
  totalDays: number
): {
  currentPlanCredit: number;
  newPlanCharge: number;
  immediateCharge: number;
} {
  const currentPlanCredit = (currentPrice / totalDays) * daysRemaining;
  const newPlanCharge = (newPrice / totalDays) * daysRemaining;
  const immediateCharge = newPlanCharge - currentPlanCredit;

  return {
    currentPlanCredit,
    newPlanCharge,
    immediateCharge,
  };
}
```

### Exemplo de Cálculo

```typescript
// Upgrade de Essentials (R$ 69,90) para Plus (R$ 129,90)
// Período mensal (30 dias), 20 dias restantes

const proration = calculateProration(
  69.9, // Preço atual
  129.9, // Novo preço
  20, // Dias restantes
  30 // Total de dias no período
);

console.log(proration);
// {
//   currentPlanCredit: 46.60,  // Crédito dos 20 dias de Essentials
//   newPlanCharge: 86.60,      // Custo de 20 dias de Plus
//   immediateCharge: 40.00     // Diferença a ser cobrada
// }
```

### Preview de Proration

O endpoint `/api/stripe/upgrade-preview` fornece uma prévia do cálculo:

```typescript
// POST /api/stripe/upgrade-preview
{
  "newPlanId": "plus",
  "billingPeriod": "monthly"
}

// Response
{
  "success": true,
  "immediateCharge": 40.00,
  "prorationCredit": 46.60,
  "newPlanCharge": 86.60,
  "daysRemaining": 20,
  "nextInvoiceDate": "2025-02-15T00:00:00.000Z"
}
```

---

## Interface do Usuário

### Banner de Mudança Agendada

Exibido quando há um `pending_plan_id`:

```tsx
{
  pendingPlan && pendingPlanChangeAt && (
    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">Mudança de plano agendada</p>
          <p className="text-xs text-amber-700">
            Seu plano será alterado para <strong>{getPlanName(pendingPlan)}</strong> em{' '}
            <strong>{formatDate(pendingPlanChangeAt)}</strong>
          </p>
        </div>
      </div>
      <Button onClick={handleCancelPlanChange}>
        <XIcon className="h-4 w-4 mr-2" />
        Cancelar mudança
      </Button>
    </div>
  );
}
```

### Detecção de Upgrade/Downgrade

```tsx
const handleSelectPlan = async (planId: string) => {
  const planHierarchy: Record<string, number> = {
    starter: 0,
    basic: 1,
    essentials: 2,
    plus: 3,
    advanced: 4,
  };

  const currentLevel = planHierarchy[currentPlan];
  const targetLevel = planHierarchy[planId];

  if (targetLevel > currentLevel) {
    // É upgrade - abre UpgradeConfirmDialog
    setSelectedPlan(plan);
    setUpgradeDialogOpen(true);
  } else if (targetLevel < currentLevel) {
    // É downgrade - abre DowngradeConfirmDialog
    setSelectedPlan(plan);
    setDowngradeDialogOpen(true);
  } else {
    // Mesmo plano
    toast({ title: 'Plano atual', description: 'Você já está neste plano.' });
  }
};
```

### Botões de Plano

Os botões refletem o estado atual:

```tsx
<Button
  variant={currentPlan === plan.id ? 'secondary' : 'default'}
  disabled={currentPlan === plan.id}
  onClick={() => handleSelectPlan(plan.id)}
>
  {currentPlan === plan.id ? (
    <>
      <Check className="h-4 w-4 mr-2" />
      Plano Atual
    </>
  ) : pendingPlan === plan.id ? (
    <>
      <Calendar className="h-4 w-4 mr-2" />
      Agendado
    </>
  ) : (
    'Selecionar Plano'
  )}
</Button>
```

---

## API Endpoints

### POST `/api/stripe/change-plan`

Processa upgrades e downgrades.

**Request:**

```json
{
  "newPlanId": "plus",
  "billingPeriod": "monthly",
  "immediate": true
}
```

**Response (Upgrade Imediato):**

```json
{
  "success": true,
  "type": "upgrade_immediate",
  "message": "Plano atualizado com sucesso",
  "prorationCharge": 40.0
}
```

**Response (Upgrade Agendado):**

```json
{
  "success": true,
  "type": "upgrade_scheduled",
  "message": "Upgrade agendado para a próxima renovação",
  "changeAt": "2025-02-15T00:00:00.000Z"
}
```

**Response (Downgrade):**

```json
{
  "success": true,
  "type": "downgrade_scheduled",
  "message": "Downgrade agendado para o final do período",
  "changeAt": "2025-02-15T00:00:00.000Z"
}
```

### POST `/api/stripe/cancel-plan-change`

Cancela uma mudança de plano agendada.

**Request:** (Sem body, usa user autenticado)

**Response:**

```json
{
  "success": true,
  "message": "Mudança de plano cancelada com sucesso"
}
```

### POST `/api/stripe/upgrade-preview`

Retorna preview de proration para upgrade.

**Request:**

```json
{
  "newPlanId": "plus",
  "billingPeriod": "monthly"
}
```

**Response:**

```json
{
  "success": true,
  "immediateCharge": 40.0,
  "prorationCredit": 46.6,
  "newPlanCharge": 86.6,
  "daysRemaining": 20,
  "nextInvoiceDate": "2025-02-15T00:00:00.000Z"
}
```

---

## Banco de Dados

### Schema Atualizado

```sql
-- Tabela profiles com campos de mudança agendada
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'starter',
  pending_plan_id TEXT, -- Plano agendado para mudança
  pending_plan_change_at TIMESTAMP WITH TIME ZONE, -- Data da mudança
  plan_expire_at TIMESTAMP WITH TIME ZONE, -- Fim do período atual
  -- outros campos...
);
```

### Estados Possíveis

1. **Sem mudança agendada:**

   ```sql
   plan = 'essentials'
   pending_plan_id = NULL
   pending_plan_change_at = NULL
   ```

2. **Com upgrade agendado:**

   ```sql
   plan = 'essentials'
   pending_plan_id = 'plus'
   pending_plan_change_at = '2025-02-15 00:00:00'
   ```

3. **Com downgrade agendado:**
   ```sql
   plan = 'plus'
   pending_plan_id = 'basic'
   pending_plan_change_at = '2025-02-15 00:00:00'
   ```

### Queries

```typescript
// Buscar mudanças agendadas para processar
const { data: pendingChanges } = await supabase
  .from('profiles')
  .select('user_id, plan, pending_plan_id, pending_plan_change_at')
  .not('pending_plan_id', 'is', null)
  .lte('pending_plan_change_at', new Date().toISOString());

// Cancelar mudança agendada
await supabase
  .from('profiles')
  .update({
    pending_plan_id: null,
    pending_plan_change_at: null,
  })
  .eq('user_id', userId);
```

---

## Webhooks Stripe

### Processamento de Mudanças Agendadas

O webhook `customer.subscription.updated` deve verificar e aplicar mudanças agendadas:

```typescript
// app/api/stripe/webhook/route.ts
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;
  const metadata = subscription.metadata;

  // Verificar se há mudança agendada
  if (metadata.pending_plan_id && metadata.pending_plan_change_at) {
    const changeDate = new Date(metadata.pending_plan_change_at);
    const now = new Date();

    // Se a data chegou, aplicar mudança
    if (changeDate <= now) {
      const newPriceId = STRIPE_PRICE_IDS[metadata.pending_plan_id][billingPeriod];

      await stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        metadata: {
          pending_plan_id: '',
          pending_plan_change_at: '',
        },
      });

      await updateProfile(userId, {
        plan: metadata.pending_plan_id,
        pending_plan_id: null,
        pending_plan_change_at: null,
      });
    }
  }
  break;
}
```

### Eventos Relevantes

- `customer.subscription.updated`: Renovação da assinatura (aplicar mudança)
- `invoice.payment_succeeded`: Confirmar proration em upgrades imediatos
- `invoice.payment_failed`: Lidar com falha de pagamento em upgrades

---

## Testando o Sistema

### Setup de Teste

1. **Criar conta de teste no Stripe:**

   ```bash
   # Usar chaves de teste (pk_test_... e sk_test_...)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Configurar webhook local com Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   # Copiar o webhook signing secret gerado
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Cenários de Teste

#### Teste 1: Upgrade Imediato

1. Assinar plano Essentials (R$ 69,90/mês)
2. Aguardar 15 dias (ou manipular data no Stripe Dashboard)
3. Fazer upgrade para Plus (R$ 129,90/mês) com opção "Imediato"
4. **Verificar:**
   - [ ] Preview mostra cálculo correto de proration
   - [ ] Cobrança imediata é processada
   - [ ] Plano é atualizado instantaneamente no banco
   - [ ] Webhook `invoice.payment_succeeded` é recebido
   - [ ] Próxima renovação mantém data original

#### Teste 2: Upgrade Agendado

1. Assinar plano Basic (R$ 39,90/mês)
2. Fazer upgrade para Essentials (R$ 69,90/mês) com opção "Agendado"
3. **Verificar:**
   - [ ] Banner de "Mudança agendada" aparece
   - [ ] Campo `pending_plan_id` é salvo no banco
   - [ ] Metadata é atualizada no Stripe
   - [ ] Nenhuma cobrança adicional ocorre
   - [ ] Usuário mantém acesso ao Basic até renovação
   - [ ] Na renovação, webhook aplica mudança para Essentials

#### Teste 3: Downgrade

1. Assinar plano Plus (R$ 129,90/mês)
2. Fazer downgrade para Basic (R$ 39,90/mês)
3. **Verificar:**
   - [ ] Dialog de downgrade mostra aviso sobre funcionalidades
   - [ ] Banner de "Mudança agendada" aparece
   - [ ] Campo `pending_plan_id` é salvo
   - [ ] Nenhuma cobrança ou crédito é processado
   - [ ] Usuário mantém acesso ao Plus até o fim do período
   - [ ] Na renovação, plano muda para Basic
   - [ ] Próxima cobrança é de R$ 39,90

#### Teste 4: Cancelar Mudança Agendada

1. Agendar qualquer mudança de plano (upgrade ou downgrade)
2. Clicar em "Cancelar mudança" no banner
3. **Verificar:**
   - [ ] Banner desaparece
   - [ ] Campos `pending_plan_id` e `pending_plan_change_at` são limpos
   - [ ] Metadata do Stripe é limpa
   - [ ] Na renovação, plano se mantém o mesmo

#### Teste 5: Downgrade para Starter (Gratuito)

1. Assinar qualquer plano pago
2. Selecionar plano Starter
3. **Verificar:**
   - [ ] Dialog de downgrade é exibido
   - [ ] Mudança é agendada para fim do período
   - [ ] No fim do período, assinatura é cancelada no Stripe
   - [ ] Plano muda para "starter" no banco
   - [ ] Usuário mantém acesso ao plano pago até o fim

### Cartões de Teste

Use os cartões de teste do Stripe:

```
Sucesso: 4242 4242 4242 4242
3D Secure: 4000 0027 6000 3184
Falha: 4000 0000 0000 0002
Saldo insuficiente: 4000 0000 0000 9995
```

### Comandos Úteis

```bash
# Ver logs de webhook em tempo real
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger manual de eventos
stripe trigger customer.subscription.updated

# Ver subscriptions
stripe subscriptions list --limit 10

# Ver invoices
stripe invoices list --limit 10

# Ver metadata de uma subscription
stripe subscriptions retrieve sub_xxxxx
```

---

## Troubleshooting

### Problema: Proration não está sendo calculada

**Solução:**

- Verificar se `proration_behavior: 'always_invoice'` está no update da subscription
- Conferir se `billing_cycle_anchor: 'unchanged'` está presente
- Usar `stripe invoices list` para ver se invoice de proration foi criada

### Problema: Mudança agendada não é aplicada

**Solução:**

- Verificar se webhook `customer.subscription.updated` está sendo recebido
- Confirmar que `pending_plan_change_at` está no passado
- Checar logs do webhook handler
- Verificar metadata da subscription no Stripe Dashboard

### Problema: Banner de mudança agendada não aparece

**Solução:**

- Verificar se `pending_plan_id` está sendo buscado na query do Supabase
- Confirmar que estados `pendingPlan` e `pendingPlanChangeAt` são atualizados
- Checar se o componente re-renderiza após `fetchCurrentPlan()`

### Problema: Preview de proration retorna erro

**Solução:**

- Verificar se usuário tem subscription ativa
- Confirmar que `plan_expire_at` existe no profile
- Validar que `newPlanId` é um plano válido
- Checar logs de erro no endpoint `/api/stripe/upgrade-preview`

---

## Próximos Passos

- [ ] Adicionar testes automatizados (E2E com Playwright)
- [ ] Criar dashboard de admin para ver mudanças agendadas
- [ ] Implementar notificações por email sobre mudanças de plano
- [ ] Adicionar analytics de conversões upgrade/downgrade
- [ ] Criar relatório de receita com impacto de proration

---

## Referências

- [Stripe Subscriptions API](https://stripe.com/docs/api/subscriptions)
- [Stripe Proration](https://stripe.com/docs/billing/subscriptions/prorations)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
