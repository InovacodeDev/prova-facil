# Melhorias no Sistema de Mudança de Planos

## 📋 Visão Geral

Implementadas duas melhorias importantes para dar mais visibilidade ao usuário sobre mudanças de planos agendadas.

---

## ✅ Funcionalidades Implementadas

### 1. Alerta de Mudança de Plano na Tela de Planos

**Localização:** `/plan` - Logo abaixo do toggle Mensal/Anual

**Comportamento:**

- ✅ Aparece **somente** quando há um downgrade/cancelamento agendado
- ✅ Alert destacado em **amber** (cor de atenção)
- ✅ Ícone **AlertCircle** para chamar atenção
- ✅ Mensagem clara e objetiva

**Conteúdo do Alerta:**

```
⚠️ Mudança de plano agendada: Seu plano será alterado para
[Nome do Plano] em [Data Formatada].
```

**Exemplo Real:**

```
⚠️ Mudança de plano agendada: Seu plano será alterado para
Starter em 15 de dezembro de 2025.
```

**Dados Exibidos:**

- Nome do próximo plano (capitalizado)
- Data da mudança em português (formato: "15 de dezembro de 2025")

**Fonte de Dados:**

- `scheduledNextPlan` do cache Redis (metadata.downgrade_scheduled_to)
- `currentPeriodEnd` da subscription Stripe

---

### 2. Data Correta no Modal de Confirmação

**Localização:** Modal de confirmação ao selecionar plano

**Problema Corrigido:**
Antes: "Seu plano atual será cancelado ao final do período de cobrança em ."
Depois: "Seu plano atual será cancelado ao final do período de cobrança em **15/12/2025**."

**Como Funciona:**

- Utiliza a função `formatPeriodEnd()` que já existia
- Recebe `currentPeriodEnd` como prop
- Formata a data para o padrão brasileiro (DD/MM/YYYY)
- Mostra claramente quando a mudança acontecerá

---

## 🔧 Arquitetura da Solução

### Fluxo de Dados

```
Stripe Subscription Metadata
    ↓
Redis Cache (CachedSubscriptionData)
    ├─ scheduledNextPlan: "starter" | "basic" | null
    └─ currentPeriodEnd: timestamp
    ↓
useSubscription() Hook
    ↓
plan/page.tsx
    ├─ Extrai scheduledNextPlan
    ├─ Converte currentPeriodEnd para ISO string
    └─ Passa props para PricingShared
    ↓
PricingShared Component
    ├─ Verifica se scheduledNextPlan existe
    ├─ Formata data com toLocaleDateString('pt-BR')
    └─ Renderiza Alert se houver mudança agendada
```

### Componentes Modificados

#### 1. `PricingShared.tsx`

```typescript
interface PricingSharedProps {
  currentPlan?: string;
  scheduledNextPlan?: string | null; // ✅ NOVO
  currentPeriodEnd?: string | null; // ✅ NOVO
  onPlanClick: (planId: string, priceId: string, billingPeriod: 'monthly' | 'annual') => void;
}

// Alert condicional
{
  scheduledNextPlan && currentPeriodEnd && (
    <Alert className="border-amber-500 bg-amber-50">
      <AlertCircle />
      <AlertDescription>
        Mudança de plano agendada: Seu plano será alterado para <strong>{scheduledNextPlan}</strong> em{' '}
        <strong>{new Date(currentPeriodEnd).toLocaleDateString('pt-BR')}</strong>.
      </AlertDescription>
    </Alert>
  );
}
```

#### 2. `app/(app)/plan/page.tsx`

```typescript
import { useSubscription } from '@/hooks/stripe'; // ✅ NOVO

// Extrai dados da subscription
const { data: subscription } = useSubscription();
const scheduledNextPlan = subscription?.scheduledNextPlan || null;
const currentPeriodEnd = plan?.currentPeriodEnd ? new Date(plan.currentPeriodEnd * 1000).toISOString() : null;

// Passa para PricingShared
<PricingShared
  currentPlan={currentPlan}
  scheduledNextPlan={scheduledNextPlan} // ✅ NOVO
  currentPeriodEnd={currentPeriodEnd} // ✅ NOVO
  onPlanClick={handleSelectPlan}
/>;
```

---

## 🧪 Como Testar

### Cenário 1: Agendar Downgrade (Plus → Basic)

**Pré-requisitos:**

- Ter assinatura ativa no plano Plus
- Estar na página `/plan`

**Passos:**

1. Clique em "Selecionar Plano" no card **Basic**
2. Confirme o downgrade no modal
3. Aguarde o processamento
4. Observe o alerta aparecer na página

**Resultado Esperado:**

```
⚠️ Mudança de plano agendada: Seu plano será alterado para
Basic em [data do fim do período atual].
```

### Cenário 2: Cancelar Assinatura (Qualquer → Starter)

**Pré-requisitos:**

- Ter assinatura ativa em qualquer plano pago
- Estar na página `/billing`

**Passos:**

1. No card "Seu Plano", clique em "Cancelar Assinatura"
2. Confirme o cancelamento
3. Navegue para `/plan`
4. Observe o alerta

**Resultado Esperado:**

```
⚠️ Mudança de plano agendada: Seu plano será alterado para
Starter em [data do fim do período atual].
```

### Cenário 3: Modal de Confirmação

**Passos:**

1. Na página `/plan`, clique em qualquer plano (downgrade)
2. Observe o modal de confirmação
3. Leia a descrição

**Resultado Esperado (Downgrade para Starter):**

```
"Seu plano atual será cancelado ao final do período de
cobrança em 15/12/2025. Você voltará ao plano gratuito
Starter após essa data."
```

**Resultado Esperado (Downgrade para Outro Plano):**

```
"Seu plano será alterado para Basic (mensal) ao final do
período de cobrança atual em 15/12/2025. Seu novo valor
será R$ 19,90."
```

---

## 📊 Casos de Uso Cobertos

### ✅ Downgrade Agendado

- **De:** Plus (R$ 49,90/mês)
- **Para:** Basic (R$ 19,90/mês)
- **Quando:** Fim do período atual
- **Alerta:** ✅ Aparece
- **Data:** ✅ Formatada

### ✅ Cancelamento Agendado

- **De:** Qualquer plano pago
- **Para:** Starter (gratuito)
- **Quando:** Fim do período atual
- **Alerta:** ✅ Aparece
- **Data:** ✅ Formatada

### ✅ Sem Mudança Agendada

- **Status:** Assinatura ativa normal
- **scheduledNextPlan:** `null`
- **Alerta:** ❌ Não aparece
- **Comportamento:** Normal

### ✅ Plano Gratuito

- **Status:** Starter sem assinatura
- **scheduledNextPlan:** `null`
- **currentPeriodEnd:** `null`
- **Alerta:** ❌ Não aparece

---

## 🎨 Estilo Visual

### Alert de Mudança Agendada

```css
Classes: "border-amber-500 bg-amber-50 dark:bg-amber-950"
Cor do texto: "text-amber-900 dark:text-amber-100"
Ícone: AlertCircle (amber-600/amber-500)
Layout: Centralizado, max-w-2xl
```

### Typography

- **Normal:** text-sm
- **Destacado (plano/data):** `<strong>` + capitalize
- **Espaçamento:** Integrado ao space-y-8 existente

---

## 🔄 Integração com Sistema Existente

### Metadata do Stripe

```typescript
// No Stripe Dashboard ou API
subscription.metadata = {
  downgrade_scheduled_to: 'prod_xxx_basic', // Product ID do plano de destino
  previous_plan_product_id: 'prod_xxx_plus', // Product ID do plano anterior
  previous_plan_expires_at: '2025-12-15', // Data de expiração
};
```

### Cache Redis

```typescript
interface CachedSubscriptionData {
  // ... outros campos
  scheduledNextPlan: string | null; // "starter" | "basic" | "essentials" | "plus" | "advanced"
  currentPeriodEnd: number | null; // Unix timestamp
}
```

### React Query

- **Query Key:** `['stripe', 'subscription']`
- **Stale Time:** 4 horas
- **Refetch:** On window focus

---

## 🐛 Troubleshooting

### Alerta não aparece após agendar downgrade

**Possíveis Causas:**

1. Cache não invalidado
2. Metadata não salva no Stripe
3. currentPeriodEnd é null

**Solução:**

```typescript
// Force refetch
const invalidateStripeData = useInvalidateAllStripeData();
invalidateStripeData();
refetchPlan();
```

### Data aparece como "Invalid Date"

**Causa:** `currentPeriodEnd` não é um timestamp válido

**Solução:** Verificar conversão no plan/page.tsx

```typescript
const currentPeriodEnd = plan?.currentPeriodEnd ? new Date(plan.currentPeriodEnd * 1000).toISOString() : null;
```

### Alerta aparece duplicado

**Causa:** Component rerenderizando

**Solução:** Verificar deps do useEffect e React.StrictMode

---

## 📈 Melhorias Futuras

### Funcionalidades Sugeridas

- [ ] Botão para **cancelar** a mudança agendada
- [ ] Countdown mostrando dias restantes
- [ ] Animação ao aparecer/desaparecer
- [ ] Toast notification ao agendar mudança
- [ ] Email reminder antes da mudança

### Melhorias de UX

- [ ] Mostrar comparação de features (plano atual vs próximo)
- [ ] Preview do novo plano no alerta
- [ ] Link direto para gerenciar assinatura
- [ ] Histórico de mudanças de plano

---

## 📚 Referências

- **Stripe Metadata:** https://stripe.com/docs/api/metadata
- **React Query:** https://tanstack.com/query/latest
- **Date Formatting:** https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString

---

## ✅ Checklist de Validação

- [x] Alerta aparece quando scheduledNextPlan existe
- [x] Alerta **não** aparece quando scheduledNextPlan é null
- [x] Data formatada corretamente (pt-BR)
- [x] Nome do plano capitalizado
- [x] Ícone AlertCircle visível
- [x] Cores amber aplicadas
- [x] Responsivo (mobile e desktop)
- [x] Dark mode suportado
- [x] Modal mostra data correta
- [x] TypeScript sem erros
- [x] Commits realizados
- [x] Documentação atualizada
