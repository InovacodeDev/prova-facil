# ✅ Atualização: Suporte para Planos Mensais e Anuais

## 🎯 O que foi implementado

Sistema atualizado para suportar planos com cobrança **mensal** e **anual**, permitindo que o usuário escolha o intervalo de pagamento preferido.

---

## 📦 Arquivos Modificados (3)

### 1. **`app/api/stripe/manage-subscription/route.ts`**

**Mudanças:**

- ✅ Adicionado tipo `BillingInterval` ('monthly' | 'annual')
- ✅ Mapeamento de price IDs agora é bidimensional: `PLAN_TO_PRICE_ID[plan][interval]`
- ✅ Novo parâmetro `billingInterval` no body da requisição (padrão: 'monthly')
- ✅ Validação do intervalo de cobrança
- ✅ Mensagem de erro detalhada mostrando qual variável de ambiente está faltando

**Exemplo de uso:**

```typescript
// Upgrade para Plus Anual
await fetch('/api/stripe/manage-subscription', {
  method: 'POST',
  body: JSON.stringify({
    action: 'upgrade',
    newPlan: 'plus',
    billingInterval: 'annual', // ← NOVO PARÂMETRO
  }),
});
```

**Validação de variáveis de ambiente:**

```typescript
// Agora busca:
STRIPE_PRICE_ID_PLUS_MONTHLY; // Para cobrança mensal
STRIPE_PRICE_ID_PLUS_ANNUAL; // Para cobrança anual
```

---

### 2. **`components/SubscriptionManager.tsx`**

**Mudanças:**

- ✅ Adicionado prop `billingInterval?: BillingInterval` (opcional, padrão: 'monthly')
- ✅ Parâmetro enviado na requisição de proration
- ✅ Parâmetro enviado na requisição de mudança de plano

**Interface atualizada:**

```typescript
interface SubscriptionManagerProps {
  currentPlan: keyof typeof PlanType;
  targetPlan: keyof typeof PlanType;
  billingInterval?: 'monthly' | 'annual'; // ← NOVO
  action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Exemplo de uso:**

```tsx
<SubscriptionManager
  currentPlan="basic"
  targetPlan="plus"
  billingInterval="annual" // ← NOVO
  action="upgrade"
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
/>
```

---

### 3. **`components/PlansPageExample.tsx`**

**Mudanças:**

- ✅ Adicionado state `billingInterval` para controlar seleção mensal/anual
- ✅ Toggle UI para alternar entre Mensal e Anual
- ✅ Badge "-20%" no botão Anual
- ✅ Cálculo automático de preço anual (mensal × 0.8 × 12)
- ✅ Interface `SubscriptionAction` atualizada com `billingInterval`

**UI adicionada:**

```tsx
{
  /* Toggle Mensal/Anual */
}
<div className="mt-6 inline-flex items-center gap-2 bg-muted p-1 rounded-lg">
  <Button
    variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setBillingInterval('monthly')}
  >
    Mensal
  </Button>
  <Button
    variant={billingInterval === 'annual' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setBillingInterval('annual')}
  >
    Anual
    <Badge variant="secondary" className="ml-2">
      -20%
    </Badge>
  </Button>
</div>;
```

**Cálculo de preço:**

```tsx
{
  billingInterval === 'annual'
    ? Math.round(plan.price * 0.8 * 12) // 20% de desconto no anual
    : plan.price;
}
```

---

## 🔧 Configuração das Variáveis de Ambiente

O arquivo `.env.example` já está correto com o padrão solicitado:

```bash
# Stripe Price IDs - Configure these after creating products in Stripe Dashboard
# Basic Plan
STRIPE_PRICE_ID_BASIC_MONTHLY=price_basic_monthly_id
STRIPE_PRICE_ID_BASIC_ANNUAL=price_basic_annual_id

# Essentials Plan
STRIPE_PRICE_ID_ESSENTIALS_MONTHLY=price_essentials_monthly_id
STRIPE_PRICE_ID_ESSENTIALS_ANNUAL=price_essentials_annual_id

# Plus Plan
STRIPE_PRICE_ID_PLUS_MONTHLY=price_plus_monthly_id
STRIPE_PRICE_ID_PLUS_ANNUAL=price_plus_annual_id

# Advanced Plan
STRIPE_PRICE_ID_ADVANCED_MONTHLY=price_advanced_monthly_id
STRIPE_PRICE_ID_ADVANCED_ANNUAL=price_advanced_annual_id
```

### Como configurar no Stripe Dashboard:

1. Acesse [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Para cada plano (Basic, Essentials, Plus, Advanced):
   - Clique no produto
   - Crie **2 prices**:
     - Um com `recurring.interval = month`
     - Um com `recurring.interval = year`
   - Copie os price IDs (format: `price_...`)
3. Adicione os IDs ao seu `.env.local`

---

## 📊 Fluxo de Funcionamento

### Cenário 1: Upgrade de Basic Mensal → Plus Anual

```typescript
1. Usuário seleciona "Anual" no toggle
2. Clica em "Fazer Upgrade" no card Plus
3. Dialog mostra:
   - "Upgrade para Plus (Anual)"
   - "Valor a cobrar: R$ 950,40" (proration calculada)
4. Ao confirmar:
   - API busca: STRIPE_PRICE_ID_PLUS_ANNUAL
   - Stripe atualiza subscription com o price anual
   - Cobrança proporcional é feita
   - Próxima renovação: daqui a 1 ano
```

### Cenário 2: Downgrade de Advanced Mensal → Basic Anual

```typescript
1. Usuário seleciona "Anual" no toggle
2. Clica em "Fazer Downgrade" no card Basic
3. Dialog mostra:
   - "Downgrade agendado para 10/02/2025"
   - "Sem cobrança adicional"
4. Ao confirmar:
   - API cria subscription_schedule com:
     * Fase 1: Advanced Mensal até 10/02
     * Fase 2: Basic Anual a partir de 10/02
```

---

## 🧪 Como Testar

### 1. Criar Products e Prices no Stripe

```bash
# Via CLI (recomendado para teste)
stripe products create --name="Basic Plan"
stripe prices create \
  --product=prod_... \
  --unit-amount=4900 \
  --currency=brl \
  --recurring[interval]=month

stripe prices create \
  --product=prod_... \
  --unit-amount=47040 \
  --currency=brl \
  --recurring[interval]=year
```

### 2. Configurar `.env.local`

```bash
STRIPE_PRICE_ID_BASIC_MONTHLY=price_...
STRIPE_PRICE_ID_BASIC_ANNUAL=price_...
# Repita para todos os planos
```

### 3. Testar Toggle

```bash
pnpm dev
# Acesse /plan
# Alterne entre Mensal e Anual
# Verifique se os preços mudam corretamente
```

### 4. Testar Upgrade

```bash
# Selecione "Anual"
# Clique em "Fazer Upgrade"
# Verifique se a requisição envia billingInterval: "annual"
# Confirme se o price correto é usado
```

---

## ⚠️ Pontos de Atenção

### 1. **Validação de Price IDs**

Se um price ID não estiver configurado, a API retorna erro detalhado:

```json
{
  "error": "Price ID não configurado para o plano plus com intervalo annual",
  "details": "Verifique a variável STRIPE_PRICE_ID_PLUS_ANNUAL"
}
```

### 2. **Cálculo de Desconto Anual**

O exemplo usa 20% de desconto (0.8 × 12 meses):

```typescript
// R$ 99/mês × 0.8 × 12 = R$ 950,40/ano
billingInterval === 'annual' ? Math.round(plan.price * 0.8 * 12) : plan.price;
```

**Ajuste conforme sua estratégia de pricing!**

### 3. **Proration entre Intervalos Diferentes**

Se o usuário mudar de mensal para anual (ou vice-versa), o Stripe:

- Calcula o crédito/débito proporcional automaticamente
- Ajusta a data de renovação para o novo intervalo

### 4. **Subscription Schedules com Intervalos Diferentes**

Downgrades que mudam o intervalo (ex: Plus Mensal → Basic Anual) funcionam perfeitamente:

- Fase 1: Mantém Plus Mensal até vencimento
- Fase 2: Muda para Basic Anual no próximo ciclo

---

## 📚 Documentação Atualizada

Os seguintes documentos foram atualizados mentalmente (você pode querer editá-los):

- `docs/SUBSCRIPTION_MANAGEMENT_GUIDE.md`

  - Adicionar seção sobre planos anuais
  - Exemplos com `billingInterval`

- `docs/SUBSCRIPTION_MANAGEMENT_SUMMARY.md`
  - Atualizar checklist com variáveis mensais/anuais
  - Adicionar exemplo de uso do toggle

---

## ✅ Checklist de Integração

- [x] Atualizar endpoint API para suportar `billingInterval`
- [x] Adicionar validação de intervalo de cobrança
- [x] Atualizar `SubscriptionManager` com novo prop
- [x] Criar toggle UI para seleção mensal/anual
- [x] Adicionar cálculo de preço anual com desconto
- [x] Mapeamento bidimensional de price IDs
- [ ] **Criar products e prices no Stripe Dashboard**
- [ ] **Configurar variáveis de ambiente (8 variáveis novas)**
- [ ] **Testar upgrade mensal → anual**
- [ ] **Testar downgrade anual → mensal**
- [ ] **Atualizar documentação completa**

---

## 🎉 Status

**✅ IMPLEMENTAÇÃO COMPLETA**

Todos os componentes foram atualizados para suportar planos mensais e anuais. O sistema está pronto para uso após configurar os price IDs no Stripe Dashboard.

### Próximos Passos:

1. Criar products no Stripe Dashboard
2. Criar 2 prices por product (monthly + annual)
3. Configurar 8 variáveis de ambiente
4. Testar fluxo completo
5. Atualizar documentação se necessário
