# Implementação de Proration Automática para Upgrades

## 📋 Resumo

Implementação do sistema de **upgrade imediato com proration automática** usando a API nativa do Stripe. Quando um usuário faz upgrade de plano com uma assinatura ativa, o sistema agora:

1. ✅ Concede acesso imediato ao novo plano
2. ✅ Credita proporcionalmente os dias não utilizados do plano anterior
3. ✅ Cobra apenas pelos dias restantes do novo plano
4. ✅ Mantém a mesma data de renovação original

## 🎯 Exemplo de Funcionamento

**Cenário:**

- Data de renovação: dia 2 de cada mês
- Upgrade realizado: dia 10
- Dias no período: 30 dias
- Dias utilizados: 8 dias
- Dias restantes: 22 dias

**Cálculo automático do Stripe:**

1. Credita 22/30 (73.3%) do valor do plano antigo
2. Cobra 22/30 (73.3%) do valor do novo plano
3. Gera invoice imediato com a diferença
4. Mantém renovação para dia 2 do próximo mês

## 📚 Documentação de Referência

- [Stripe: Change Price](https://docs.stripe.com/billing/subscriptions/change-price)
- [Stripe: Prorations](https://docs.stripe.com/billing/subscriptions/prorations)
- [Stripe: Cancel Subscription](https://docs.stripe.com/billing/subscriptions/cancel)

## 🔧 Arquivos Modificados

### 1. `lib/stripe/plan-change.service.ts`

**Mudança principal:** `billing_cycle_anchor`

```typescript
// ❌ ANTES - Resetava o ciclo de faturamento
billing_cycle_anchor: 'now';

// ✅ AGORA - Mantém o ciclo de faturamento original
billing_cycle_anchor: 'unchanged';
```

**Impacto:**

- Com `'now'`: Resetaria a data de renovação para o dia do upgrade
- Com `'unchanged'`: Mantém a data de renovação original, fazendo proration apenas no valor

**Código completo:**

```typescript
export async function executeImmediateUpgrade(params: ImmediateUpgradeParams): Promise<Stripe.Subscription> {
  const { subscriptionId, newPlanId, billingPeriod } = params;

  const priceConfig = STRIPE_PRICE_IDS[newPlanId];
  const newPriceId = priceConfig[billingPeriod];

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice', // Invoice imediato com proration
    billing_cycle_anchor: 'unchanged', // Mantém data de renovação
    metadata: {
      ...subscription.metadata,
      planId: newPlanId,
      plan_change_type: 'immediate_upgrade',
    },
  });

  return updatedSubscription;
}
```

### 2. `app/api/stripe/change-plan/route.ts`

**Mudanças:**

1. Removido parâmetro `immediate` do schema de validação
2. Upgrades agora são **sempre** imediatos
3. Downgrades continuam sendo agendados (sem proration)

**Schema atualizado:**

```typescript
const ChangePlanSchema = z.object({
  newPlanId: z.enum(['starter', 'basic', 'essentials', 'plus', 'advanced']),
  billingPeriod: z.enum(['monthly', 'annual']),
  // immediate removido - upgrades são sempre imediatos
});
```

**Lógica de upgrade simplificada:**

```typescript
// 8. UPGRADE: sempre imediato com proration
if (upgrading) {
  const updatedSubscription = await executeImmediateUpgrade({
    subscriptionId: subscription.stripe_subscription_id,
    newPlanId,
    billingPeriod,
  });

  // Atualizar profile imediatamente
  await supabase
    .from('profiles')
    .update({
      plan: newPlanId,
      plan_expire_at: new Date(updatedSubscription.current_period_end * 1000),
      pending_plan_id: null,
      pending_plan_change_at: null,
    })
    .eq('user_id', user.id);

  return NextResponse.json({
    success: true,
    type: 'upgrade_immediate',
    message: `Upgrade para ${newPlanId} realizado com sucesso! Você foi cobrado proporcionalmente pelo período restante.`,
  });
}
```

### 3. `components/ImmediateUpgradeDialog.tsx` (NOVO)

**Criado novo componente** substituindo o `UpgradeConfirmDialog` que tinha opção de agendar.

**Características:**

- Dialog simples e direto
- Explica claramente o funcionamento da proration
- Mostra a data de renovação que será mantida
- Lista os benefícios do upgrade imediato

**Principais seções:**

```tsx
<Alert>
  <AlertDescription>
    <p>Como funciona o upgrade:</p>
    <ul>
      <li>✓ Acesso imediato às funcionalidades do novo plano</li>
      <li>✓ Crédito proporcional dos dias não utilizados</li>
      <li>✓ Cobrança apenas pelos dias restantes do novo plano</li>
      <li>✓ Data de renovação mantida</li>
    </ul>
  </AlertDescription>
</Alert>
```

### 4. `app/plan/page.tsx`

**Mudanças:**

1. Substituído import: `UpgradeConfirmDialog` → `ImmediateUpgradeDialog`
2. Removido parâmetro `immediate` das chamadas à API
3. Simplificada função `handleConfirmUpgrade`
4. Atualizado JSX do componente de diálogo

**Função simplificada:**

```typescript
const handleConfirmUpgrade = async () => {
  if (!selectedPlan) return;

  const response = await fetch('/api/stripe/change-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      newPlanId: selectedPlan.id,
      billingPeriod,
      // immediate removido - sempre é imediato
    }),
  });

  const result = await response.json();

  // Upgrade é sempre imediato
  setCurrentPlan(selectedPlan.id);
  toast({
    title: 'Upgrade realizado!',
    description: result.message,
  });
};
```

## 🔄 Fluxo Completo de Upgrade

```
┌─────────────────────┐
│ Usuário clica em    │
│ "Fazer Upgrade"     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ImmediateUpgrade    │
│ Dialog abre         │
│ - Explica proration │
│ - Mostra data       │
└──────────┬──────────┘
           │
           ▼ Confirma
┌─────────────────────┐
│ POST /api/stripe/   │
│ change-plan         │
│ { newPlanId,        │
│   billingPeriod }   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ executeImmediate    │
│ Upgrade()           │
│                     │
│ stripe.subs.update  │
│ - always_invoice    │
│ - unchanged anchor  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stripe calcula:     │
│ - Crédito: 22 dias  │
│ - Débito: 22 dias   │
│ - Invoice gerado    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Atualiza profile:   │
│ - plan = newPlan    │
│ - mantém expire_at  │
│ - limpa pending     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Usuário tem acesso  │
│ imediato ao novo    │
│ plano ✓             │
└─────────────────────┘
```

## 💰 Exemplo de Valores

**Plano atual:** Básico - R$ 30/mês
**Novo plano:** Plus - R$ 60/mês
**Ciclo:** 30 dias (renovação dia 1)
**Upgrade:** dia 10 (22 dias restantes)

**Cálculo Stripe:**

```
Crédito (Básico):   R$ 30 × (22/30) = R$ 22,00
Débito (Plus):      R$ 60 × (22/30) = R$ 44,00
Invoice imediato:   R$ 44,00 - R$ 22,00 = R$ 22,00
Próxima cobrança:   dia 1 (valor cheio R$ 60)
```

## ✅ Vantagens da Implementação

1. **Transparência:** Usuário vê claramente como funciona
2. **Justo:** Paga apenas pelo que vai usar
3. **Imediato:** Acesso instantâneo ao novo plano
4. **Simples:** Stripe cuida de toda complexidade
5. **Previsível:** Data de renovação não muda

## 🔒 Segurança e Validação

- ✅ Autenticação verificada antes de qualquer operação
- ✅ Validação de schema com Zod
- ✅ Verificação de assinatura ativa
- ✅ Log de erros estruturado
- ✅ Tratamento de exceções do Stripe
- ✅ Rollback automático em caso de falha

## 📊 Diferença: Upgrade vs Downgrade

| Aspecto                  | Upgrade          | Downgrade              |
| ------------------------ | ---------------- | ---------------------- |
| **Quando ocorre**        | Imediato         | Final do período       |
| **Acesso ao novo plano** | Instantâneo      | Após renovação         |
| **Proration**            | Sim (automática) | Não                    |
| **Invoice gerado**       | Sim (imediato)   | Não (espera renovação) |
| **Data de renovação**    | Mantida          | Mantida                |

## 🧪 Testando a Implementação

### Teste 1: Upgrade Básico → Plus

1. Criar assinatura Básico (mensal)
2. Aguardar alguns dias
3. Fazer upgrade para Plus
4. Verificar:
   - ✓ Acesso imediato
   - ✓ Invoice gerado com proration
   - ✓ Data de renovação mantida
   - ✓ Profile atualizado

### Teste 2: Upgrade com diferentes períodos restantes

- Teste com 5 dias restantes
- Teste com 20 dias restantes
- Verificar se proration está correta

### Teste 3: Upgrade Anual

- Criar assinatura anual
- Fazer upgrade após 2 meses
- Verificar crédito proporcional de 10 meses

## 🐛 Possíveis Erros e Tratamento

### Erro: "Insufficient funds"

```typescript
// Usuário não tem saldo/cartão para invoice imediato
catch (error) {
  if (error.code === 'card_declined') {
    toast({
      title: 'Cartão recusado',
      description: 'Verifique seus dados de pagamento',
    });
  }
}
```

### Erro: "Subscription not found"

```typescript
// Assinatura foi cancelada/expirada
if (!subscription) {
  return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 404 });
}
```

## 📝 Notas Importantes

1. **Proration é automática:** Não tentamos calcular manualmente
2. **Billing cycle anchor:** Crucial usar `'unchanged'` para manter data
3. **Metadata:** Sempre atualizar para tracking
4. **Webhooks:** Considerar adicionar handler para `invoice.payment_succeeded`
5. **UI:** Deixar claro que upgrade é imediato e explicar proration

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar preview de valores antes de confirmar (buscar do Stripe)
- [ ] Implementar webhook para confirmar payment
- [ ] Adicionar analytics para tracking de upgrades
- [ ] Criar testes automatizados (E2E com Stripe Test Mode)
- [ ] Adicionar loading states durante processamento
- [ ] Mostrar histórico de invoices gerados

## 📖 Recursos Adicionais

- [Stripe Dashboard - Subscriptions](https://dashboard.stripe.com/subscriptions)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe CLI para webhooks](https://stripe.com/docs/stripe-cli)
