# Mudança de Período e Alerta Aprimorado

## 📋 Visão Geral

Implementadas duas melhorias importantes no sistema de planos:

1. **Usar estilo de alerta do billing** (box laranja em vez de Alert amber)
2. **Permitir mudança de período mensal ↔ anual** no mesmo plano

---

## ✅ Funcionalidades Implementadas

### 1. Alerta de Mudança de Plano (Novo Estilo)

**Antes:**

```tsx
<Alert className="border-amber-500 bg-amber-50">
  <AlertCircle />
  <AlertDescription>Mudança de plano agendada: Seu plano será alterado para...</AlertDescription>
</Alert>
```

**Depois (estilo do billing):**

```tsx
<div className="border border-orange-200 bg-orange-50 p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="h-5 w-5 text-orange-600" />
    <div className="flex-1">
      <p className="font-semibold text-orange-900">Mudança de plano agendada</p>
      <p className="text-sm text-orange-800">Após 15 de dezembro de 2025, seu plano será alterado para Starter.</p>
    </div>
    <Badge variant="outline" className="bg-white">
      → starter
    </Badge>
  </div>
</div>
```

**Características:**

- ✅ Layout flex com ícone, texto e badge
- ✅ Cores laranja (orange-200, orange-50, orange-900)
- ✅ Ícone maior (h-5 w-5) à esquerda
- ✅ Badge com seta "→ plano" à direita
- ✅ Fonte semibold no título
- ✅ Dark mode suportado
- ✅ Mais destaque e profissional

---

### 2. Mudança de Período (Mensal ↔ Anual)

**Funcionalidade:**
Permite que usuário no **plano Plus Mensal** possa mudar para **Plus Anual** (e vice-versa) sem precisar cancelar e reativar a assinatura.

**Comportamento:**

1. Usuário vê seu plano atual com badge "Atual"
2. Ao alternar para período diferente:
   - Card do mesmo plano mostra badge "Economize 25%" (se anual)
   - Card do mesmo plano mostra badge "Seu Plano" (se mensal)
   - Botão muda para "Mudar para Anual" ou "Mudar para Mensal"
3. Ao clicar, modal mostra:
   - Título: "Confirmar Mudança de Período"
   - Descrição: "Seu plano Plus será alterado para cobrança anual em 15/12/2025. Seu novo valor será R$ 449,90."
   - Botão: "Confirmar Mudança"
4. Mudança agendada para o fim do período atual
5. Alerta laranja aparece mostrando a mudança agendada

**Lógica de Detecção:**

```typescript
const isCurrentPlanDifferentPeriod =
  isCurrentPlan &&
  currentBillingPeriod &&
  ((currentBillingPeriod === 'monthly' && billingPeriod === 'annual') ||
    (currentBillingPeriod === 'annual' && billingPeriod === 'monthly'));
```

**Estados do Botão:**

```typescript
if (isCurrentPlan && !isCurrentPlanDifferentPeriod) {
  buttonText = 'Plano Atual';
  isButtonDisabled = true;
} else if (isCurrentPlanDifferentPeriod) {
  buttonText = billingPeriod === 'annual' ? 'Mudar para Anual' : 'Mudar para Mensal';
  isButtonDisabled = false;
} else {
  buttonText = 'Selecionar Plano';
  isButtonDisabled = false;
}
```

**Badge no Card:**

```typescript
{
  isCurrentPlan && !isCurrentPlanDifferentPeriod && <Badge variant="secondary">Atual</Badge>;
}
{
  isCurrentPlanDifferentPeriod && (
    <Badge variant="outline">{billingPeriod === 'annual' ? 'Economize 25%' : 'Seu Plano'}</Badge>
  );
}
```

---

## 🔧 Arquitetura da Solução

### Props Adicionadas

#### PricingShared.tsx

```typescript
interface PricingSharedProps {
  currentPlan?: string;
  currentBillingPeriod?: 'monthly' | 'annual'; // ✅ NOVO
  scheduledNextPlan?: string | null;
  currentPeriodEnd?: string | null;
  onPlanClick: (planId: string, priceId: string, billingPeriod: 'monthly' | 'annual') => void;
}
```

#### PlanConfirmationModal.tsx

```typescript
interface PlanConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: StripeProductWithPrices | null;
  billingPeriod: 'monthly' | 'annual';
  onConfirm: () => void;
  loading: boolean;
  variant: 'upgrade' | 'downgrade';
  currentPlan?: string;
  currentBillingPeriod?: 'monthly' | 'annual'; // ✅ NOVO
  currentPeriodEnd?: string;
}
```

### Fluxo de Dados

```
useSubscription()
    ↓
subscription.renewStatus (monthly | yearly)
    ↓
currentBillingPeriod: 'monthly' | 'annual'
    ↓
plan/page.tsx
    ├─ Passa para PricingShared
    └─ Passa para PlanConfirmationModal
    ↓
PricingShared
    ├─ Detecta isPeriodChange
    ├─ Ajusta badge e botão
    └─ Chama onPlanClick
    ↓
handleSelectPlan
    ├─ Detecta isPeriodChange
    └─ Define variant='upgrade'
    ↓
Modal mostra mensagem específica
```

---

## 🧪 Cenários de Teste

### Cenário 1: Usuário em Plus Mensal vê opção Anual

**Estado Inicial:**

- Plano: Plus
- Período: Mensal (R$ 49,90/mês)
- Toggle: Mensal selecionado

**Ação:**

1. Usuário clica no toggle "Anual"
2. Card do Plus mostra:
   - Badge: "Economize 25%"
   - Botão: "Mudar para Anual"
   - Preço: R$ 449,90/ano

**Resultado Esperado:**

- ✅ Badge "Economize 25%" visível
- ✅ Botão habilitado e com texto correto
- ✅ Ao clicar, modal abre com título "Confirmar Mudança de Período"

### Cenário 2: Mudança de Mensal para Anual

**Pré-requisitos:**

- Plano: Plus Mensal
- Próxima renovação: 15/12/2025

**Passos:**

1. Toggle para "Anual"
2. Clique em "Mudar para Anual" no card Plus
3. Modal abre mostrando:
   - Título: "Confirmar Mudança de Período"
   - Descrição: "Seu plano Plus será alterado para cobrança anual ao final do período atual em 15/12/2025. Seu novo valor será R$ 449,90."
   - Botão: "Confirmar Mudança"
4. Clique em "Confirmar Mudança"
5. Toast: "Mudança agendada"
6. Alerta laranja aparece na página

**Resultado Esperado:**

- ✅ Modal com informações corretas
- ✅ Mudança agendada para 15/12/2025
- ✅ Alerta laranja exibido
- ✅ Badge "→ plus" no alerta

### Cenário 3: Alerta Laranja Após Agendar

**Estado:**

- Mudança agendada: Plus Mensal → Plus Anual em 15/12/2025

**Visual Esperado:**

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Mudança de plano agendada           [→ plus]       │
│     Após 15 de dezembro de 2025, seu plano será        │
│     alterado para plus.                                 │
└─────────────────────────────────────────────────────────┘
```

**Características:**

- ✅ Borda laranja (border-orange-200)
- ✅ Background orange-50 (dark: orange-950)
- ✅ Ícone AlertCircle laranja
- ✅ Badge branca "→ plus"
- ✅ Texto em orange-900 (dark: orange-100)

---

## 📊 Comparação: Antes vs Depois

### Alerta de Mudança Agendada

| Aspecto          | Antes (Alert)           | Depois (Box)                 |
| ---------------- | ----------------------- | ---------------------------- |
| **Cor**          | Amber (amarelo)         | Orange (laranja)             |
| **Layout**       | Texto corrido           | Flex com ícone, texto, badge |
| **Ícone**        | h-4 w-4                 | h-5 w-5 (maior)              |
| **Badge**        | ❌ Não tinha            | ✅ "→ plano"                 |
| **Consistência** | ❌ Diferente do billing | ✅ Igual ao billing          |
| **Destaque**     | Médio                   | Alto                         |

### Mudança de Período

| Aspecto         | Antes                    | Depois                         |
| --------------- | ------------------------ | ------------------------------ |
| **Permitido**   | ❌ Não                   | ✅ Sim                         |
| **Botão**       | "Plano Atual" (disabled) | "Mudar para Anual" (enabled)   |
| **Badge**       | "Atual"                  | "Economize 25%"                |
| **Modal**       | N/A                      | "Confirmar Mudança de Período" |
| **Agendamento** | N/A                      | Ao final do período            |

---

## 🎨 Estilos CSS

### Alerta Laranja

```tsx
<div className="max-w-2xl mx-auto rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
    <div className="flex-1 space-y-1">
      <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">Mudança de plano agendada</p>
      <p className="text-sm text-orange-800 dark:text-orange-200">
        Após 15 de dezembro de 2025, seu plano será alterado para plus.
      </p>
    </div>
    <Badge variant="outline" className="bg-white dark:bg-slate-950 shrink-0">
      → plus
    </Badge>
  </div>
</div>
```

### Badge Dinâmica

```tsx
{
  isCurrentPlanDifferentPeriod && (
    <Badge variant="outline" className="text-xs">
      {billingPeriod === 'annual' ? 'Economize 25%' : 'Seu Plano'}
    </Badge>
  );
}
```

---

## 🔄 Integração com Stripe

### API Call (updateSubscription)

Quando usuário confirma mudança de período:

```typescript
// plan/page.tsx - handleConfirmPlan()
const result = await updateSubscription(selectedPriceId, isUpgrade);

// Se isPeriodChange = true e isUpgrade = true
// Stripe agenda a mudança para o fim do período
```

### Metadata Stripe

```javascript
subscription.metadata = {
  downgrade_scheduled_to: 'prod_xxx_plus_annual', // Product ID do anual
  previous_plan_product_id: 'prod_xxx_plus_monthly',
  previous_plan_expires_at: '2025-12-15',
};
```

### Schedule Change

```javascript
// Stripe dashboard
subscription.schedule.phases = [
  {
    // Fase atual (mensal)
    start_date: 1700000000,
    end_date: 1734220800, // 15/12/2025
    items: [{ price: 'price_monthly_plus' }],
  },
  {
    // Próxima fase (anual)
    start_date: 1734220800, // 15/12/2025
    end_date: null,
    items: [{ price: 'price_annual_plus' }],
  },
];
```

---

## 🐛 Troubleshooting

### Badge "Economize 25%" não aparece

**Causa:** currentBillingPeriod não está sendo passado

**Solução:**

```typescript
// plan/page.tsx
const currentBillingPeriod: 'monthly' | 'annual' =
  subscription?.renewStatus === 'yearly' ? 'annual' : 'monthly';

<PricingShared
  currentPlan={currentPlan}
  currentBillingPeriod={currentBillingPeriod}  // ✅
  ...
/>
```

### Botão continua "Plano Atual" em período diferente

**Causa:** Lógica de detecção de período não está correta

**Verificar:**

```typescript
const isCurrentPlanDifferentPeriod =
  isCurrentPlan && // ✅ Mesmo plano
  currentBillingPeriod && // ✅ Tem período atual
  ((currentBillingPeriod === 'monthly' && billingPeriod === 'annual') ||
    (currentBillingPeriod === 'annual' && billingPeriod === 'monthly'));
```

### Modal não mostra "Mudança de Período"

**Causa:** isPeriodChange não detectado no modal

**Solução:**

```typescript
// PlanConfirmationModal.tsx
const isPeriodChange = currentPlan === plan.internalPlanId && currentBillingPeriod !== billingPeriod;

if (isPeriodChange) {
  title = 'Confirmar Mudança de Período';
  description = `Seu plano ${plan.name} será alterado...`;
}
```

---

## 📈 Benefícios

### UX Melhorada

1. **Visual mais profissional** - Alerta laranja com layout estruturado
2. **Flexibilidade** - Usuário pode mudar período sem cancelar
3. **Transparência** - Sabe exatamente quando mudança ocorre
4. **Economia destacada** - Badge "Economize 25%" chama atenção

### Negócio

1. **Mais conversões para anual** - Facilita upgrade de período
2. **Menos cancelamentos** - Usuário não precisa cancelar
3. **Maior lifetime value** - Anual tem melhor retenção
4. **Experiência consistente** - Alerta igual em pricing e billing

### Técnica

1. **Código reutilizável** - Mesma lógica de alerta
2. **Type-safe** - Props tipadas com TypeScript
3. **Manutenível** - Separação clara de responsabilidades
4. **Escalável** - Fácil adicionar mais períodos (trimestral, etc)

---

## 🚀 Próximos Passos (Sugeridos)

### Melhorias de UX

- [ ] Mostrar economia total no modal ("Economize R$ 149,40/ano")
- [ ] Comparação lado a lado (mensal vs anual)
- [ ] Preview da próxima fatura
- [ ] Countdown até mudança efetiva

### Funcionalidades

- [ ] Período trimestral (3 meses)
- [ ] Desconto especial para upgrade mensal → anual
- [ ] Trial period para testar anual
- [ ] Cancelar mudança agendada

### Analytics

- [ ] Track conversões mensal → anual
- [ ] A/B test de mensagens
- [ ] Funil de mudança de período
- [ ] Taxa de abandono no modal

---

## ✅ Checklist de Validação

- [x] Alerta laranja aparece quando há mudança agendada
- [x] Layout igual ao billing (flex com ícone, texto, badge)
- [x] Badge "→ plano" à direita
- [x] Cores orange (200, 50, 900) aplicadas
- [x] Dark mode suportado
- [x] Botão "Mudar para Anual" habilitado em período diferente
- [x] Badge "Economize 25%" aparece no anual
- [x] Badge "Seu Plano" aparece no mensal
- [x] Modal mostra "Confirmar Mudança de Período"
- [x] Descrição do modal menciona data correta
- [x] Mudança agendada para fim do período
- [x] TypeScript sem erros
- [x] Commits realizados
- [x] Documentação criada
