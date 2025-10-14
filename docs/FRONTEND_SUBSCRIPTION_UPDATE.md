# 🎨 Frontend Update - Subscription Management

## 📋 Resumo

Atualizado frontend para usar o novo endpoint `/api/stripe/update-subscription`, eliminando o uso de `/schedule-downgrade` e melhorando a experiência de mudança de planos.

---

## 🔧 Arquivos Modificados

### 1. **`hooks/use-stripe.ts`**

#### **Adicionado: `updateSubscription` method**

```typescript
interface UseStripeReturn {
  // ... existing properties
  updateSubscription: (priceId: string, immediate: boolean) => Promise<{ success: boolean; message: string }>;
}
```

**Implementação:**

```typescript
const updateSubscription = useCallback(async (priceId: string, immediate: boolean) => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/stripe/update-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, immediate }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to update subscription');
    }

    return {
      success: true,
      message: data.message || 'Plano atualizado com sucesso',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(message);
    throw err; // Re-throw para caller tratar
  } finally {
    setLoading(false);
  }
}, []);
```

#### **Melhorado: `createCheckout` method**

Agora trata o HTTP 409 (subscription já existe):

```typescript
const createCheckout = useCallback(async (priceId: string) => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const data = await response.json();

    // ✨ NOVO: Trata caso de subscription já existente
    if (response.status === 409 && data.shouldRedirectToPortal) {
      throw new Error('Você já possui uma assinatura ativa. Use o gerenciamento de planos para alterá-la.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(message);
    throw err; // Re-throw para caller tratar
  } finally {
    setLoading(false);
  }
}, []);
```

---

### 2. **`app/(app)/plan/page.tsx`**

#### **Refatorada: `handleConfirmPlan` function**

**ANTES:**

```typescript
// 3 endpoints diferentes:
// 1. /api/stripe/cancel-subscription (FREE)
// 2. /api/stripe/schedule-downgrade (DOWNGRADE)
// 3. /api/stripe/create-checkout (UPGRADE)
```

**AGORA:**

```typescript
// 2 endpoints + lógica centralizada:
// 1. /api/stripe/cancel-subscription (apenas para FREE)
// 2. /api/stripe/update-subscription (UPGRADE ou DOWNGRADE entre PAID)
// 3. /api/stripe/create-checkout (apenas primeira subscription)
```

**Nova Lógica:**

```typescript
const handleConfirmPlan = async () => {
  if (!selectedPlan) return;

  setCheckoutLoading(true);

  try {
    const isCurrentlyOnFreePlan = isFreePlan(currentPlan);
    const isChangingToFreePlan = isFreePlan(selectedPlan.internalPlanId);
    const isUpgrade = modalVariant === 'upgrade';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CASE 1: FREE → PAID (Primeira subscription)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isCurrentlyOnFreePlan && !isChangingToFreePlan) {
      await createCheckout(selectedPriceId);
      // Redirect happens, no further action
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CASE 2: PAID → FREE (Cancelar subscription)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!isCurrentlyOnFreePlan && isChangingToFreePlan) {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to cancel subscription');
      }

      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura será cancelada ao final do período. Você voltará ao plano Starter.',
      });

      setModalOpen(false);
      invalidateStripeData();
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CASE 3: PAID → PAID (Update subscription)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!isCurrentlyOnFreePlan && !isChangingToFreePlan) {
      // ✨ USA O NOVO ENDPOINT!
      const result = await updateSubscription(selectedPriceId, isUpgrade);

      toast({
        title: isUpgrade ? 'Plano atualizado!' : 'Mudança agendada',
        description: result.message,
      });

      setModalOpen(false);
      invalidateStripeData();
      return;
    }

    // Should not reach here
    throw new Error('Invalid plan change scenario');
  } catch (error: any) {
    console.error('Error confirming plan:', error);
    logClientError(error, {
      component: 'Plan',
      action: 'handleConfirmPlan',
      planId: selectedPlan.internalPlanId,
    });
    toast({
      title: 'Erro',
      description: error.message || 'Não foi possível processar sua solicitação.',
      variant: 'destructive',
    });
  } finally {
    setCheckoutLoading(false);
  }
};
```

---

## 🔄 Fluxos de Mudança de Plano

### **Cenário 1: FREE → PAID (Primeira Subscription)**

```mermaid
User clicks "Upgrade to Basic"
    ↓
handleConfirmPlan() detecta: FREE → PAID
    ↓
createCheckout(priceId) chamado
    ↓
POST /api/stripe/create-checkout
    ↓
Backend valida: sem subscription existente ✓
    ↓
Stripe Checkout criado
    ↓
User redirecionado para pagamento
    ↓
Webhook: customer.subscription.created
    ↓
Profile atualizado com subscription_id
```

---

### **Cenário 2: BASIC → PRO (Upgrade Imediato)**

```mermaid
User clicks "Upgrade to Pro"
    ↓
handleConfirmPlan() detecta: PAID → PAID (upgrade)
    ↓
updateSubscription(priceId, immediate: true)
    ↓
POST /api/stripe/update-subscription { immediate: true }
    ↓
Backend atualiza subscription existente
    ↓
Proration calculada e cobrada
    ↓
Toast: "Plano atualizado!"
    ↓
invalidateStripeData() recarrega dados
```

---

### **Cenário 3: PRO → BASIC (Downgrade Agendado)**

```mermaid
User clicks "Change to Basic"
    ↓
handleConfirmPlan() detecta: PAID → PAID (downgrade)
    ↓
updateSubscription(priceId, immediate: false)
    ↓
POST /api/stripe/update-subscription { immediate: false }
    ↓
Backend agenda mudança para period_end
    ↓
SEM cobrança agora
    ↓
Toast: "Mudança agendada"
    ↓
invalidateStripeData() recarrega dados
```

---

### **Cenário 4: PAID → FREE (Cancelamento)**

```mermaid
User clicks "Downgrade to Starter"
    ↓
handleConfirmPlan() detecta: PAID → FREE
    ↓
POST /api/stripe/cancel-subscription
    ↓
Backend cancela subscription (cancel_at_period_end: true)
    ↓
Toast: "Assinatura será cancelada ao final do período"
    ↓
invalidateStripeData() recarrega dados
```

---

### **Cenário 5: PAID user tenta criar nova subscription (BLOQUEADO)**

```mermaid
User on BASIC tenta acessar checkout diretamente
    ↓
createCheckout(priceId) chamado
    ↓
POST /api/stripe/create-checkout
    ↓
Backend detecta subscription ativa
    ↓
HTTP 409 Conflict retornado
    ↓
Frontend detecta 409 + shouldRedirectToPortal
    ↓
Error thrown: "Você já possui uma assinatura ativa..."
    ↓
Toast exibe mensagem de erro
    ↓
User deve usar gerenciamento de planos
```

---

## 📊 Comparação: Antes vs Depois

### **ANTES:**

| Ação                    | Endpoint Usado         | Problemas                  |
| ----------------------- | ---------------------- | -------------------------- |
| FREE → PAID             | `/create-checkout`     | ✅ OK                      |
| UPGRADE (PAID → PAID)   | `/create-checkout`     | ❌ Cria nova subscription! |
| DOWNGRADE (PAID → PAID) | `/schedule-downgrade`  | ⚠️ Endpoint separado       |
| PAID → FREE             | `/cancel-subscription` | ✅ OK                      |

**Resultado:** Múltiplas subscriptions, inconsistências, cobranças duplicadas.

---

### **DEPOIS:**

| Ação                    | Endpoint Usado                            | Benefícios                        |
| ----------------------- | ----------------------------------------- | --------------------------------- |
| FREE → PAID             | `/create-checkout`                        | ✅ OK - Primeira subscription     |
| UPGRADE (PAID → PAID)   | `/update-subscription` (immediate: true)  | ✅ Atualiza existente + proration |
| DOWNGRADE (PAID → PAID) | `/update-subscription` (immediate: false) | ✅ Atualiza existente + agendado  |
| PAID → FREE             | `/cancel-subscription`                    | ✅ OK - Cancela no period_end     |
| PAID tenta checkout     | `/create-checkout` (bloqueado)            | ✅ HTTP 409 - previne duplicação  |

**Resultado:** Apenas 1 subscription por customer, experiência consistente, sem duplicações.

---

## 🎯 Melhorias de UX

### **1. Mensagens Claras**

**Upgrade Imediato:**

```
Toast: "Plano atualizado!"
Message: "Plano alterado imediatamente. O valor será ajustado proporcionalmente."
```

**Downgrade Agendado:**

```
Toast: "Mudança agendada"
Message: "Plano será alterado em 31/01/2025"
```

**Cancelamento:**

```
Toast: "Assinatura cancelada"
Message: "Sua assinatura será cancelada ao final do período. Você voltará ao plano Starter."
```

### **2. Loading States**

```typescript
// Durante checkout/update
setCheckoutLoading(true);
// Button mostra Loader2 spinner

// Após conclusão
setCheckoutLoading(false);
invalidateStripeData(); // Recarrega dados automaticamente
```

### **3. Error Handling**

```typescript
try {
  await updateSubscription(priceId, isUpgrade);
} catch (error: any) {
  // Logged para debugging
  logClientError(error, {
    component: 'Plan',
    action: 'handleConfirmPlan',
  });

  // Exibido para user
  toast({
    title: 'Erro',
    description: error.message || 'Não foi possível processar sua solicitação.',
    variant: 'destructive',
  });
}
```

---

## 🧪 Como Testar

### **Teste 1: FREE → PAID (Primeira vez)**

1. Crie uma conta nova (plano FREE)
2. Vá em `/plan`
3. Clique em "Escolher" no plano BASIC
4. Confirme no modal
5. **Esperado:** Redirecionamento para Stripe Checkout

### **Teste 2: BASIC → PRO (Upgrade)**

1. Tenha uma conta com plano BASIC ativo
2. Vá em `/plan`
3. Clique em "Upgrade" no plano PRO
4. Confirme no modal
5. **Esperado:**
   - Toast: "Plano atualizado!"
   - Sem redirect
   - Dados atualizados automaticamente
   - Proration cobrada

### **Teste 3: PRO → BASIC (Downgrade)**

1. Tenha uma conta com plano PRO ativo
2. Vá em `/plan`
3. Clique em "Alterar" no plano BASIC
4. Confirme no modal
5. **Esperado:**
   - Toast: "Mudança agendada"
   - Sem redirect
   - Dados mostram mudança pendente
   - SEM cobrança agora

### **Teste 4: PAID → FREE (Cancelamento)**

1. Tenha uma conta com qualquer plano PAID
2. Vá em `/plan`
3. Clique em "Voltar" no plano STARTER
4. Confirme no modal
5. **Esperado:**
   - Toast: "Assinatura cancelada"
   - Dados mostram cancelamento pendente

### **Teste 5: Tentativa de criar nova subscription (deve bloquear)**

1. Tenha uma conta com plano PAID ativo
2. Tente acessar checkout diretamente (hack/bug)
3. **Esperado:**
   - HTTP 409 retornado
   - Error toast exibido
   - Sem redirect para Stripe

---

## 🔍 Debugging

### **Console Logs:**

```typescript
// Hook use-stripe.ts
console.error('Checkout error:', err);
console.error('Update subscription error:', err);

// Page plan/page.tsx
console.error('Error confirming plan:', error);
logClientError(error, {
  component: 'Plan',
  action: 'handleConfirmPlan',
  planId: selectedPlan.internalPlanId,
});
```

### **Network Tab:**

1. **Checkout (FREE → PAID):**

   ```
   POST /api/stripe/create-checkout
   Body: { priceId: "price_xxx" }
   Response: { sessionId: "...", url: "https://checkout.stripe.com/..." }
   ```

2. **Update Subscription (PAID → PAID):**

   ```
   POST /api/stripe/update-subscription
   Body: { priceId: "price_yyy", immediate: true }
   Response: { success: true, message: "...", effectiveAt: "..." }
   ```

3. **Cancel (PAID → FREE):**
   ```
   POST /api/stripe/cancel-subscription
   Response: { success: true, cancelAt: "...", message: "..." }
   ```

---

## ✅ Checklist de Implementação

- [x] Adicionar `updateSubscription` ao hook `use-stripe.ts`
- [x] Tratar HTTP 409 no `createCheckout`
- [x] Refatorar `handleConfirmPlan` em `plan/page.tsx`
- [x] Implementar lógica de 3 casos (FREE→PAID, PAID→FREE, PAID→PAID)
- [x] Usar `immediate` flag corretamente (upgrade=true, downgrade=false)
- [x] Invalidar cache após mudanças
- [x] Melhorar mensagens de toast
- [x] Error handling robusto
- [ ] Testar todos os cenários E2E
- [ ] Atualizar documentação do usuário

---

## 📝 Breaking Changes para Outros Componentes

Se outros componentes usam diretamente os endpoints antigos:

### **Substituir:**

```typescript
// ❌ ANTIGO
await fetch('/api/stripe/schedule-downgrade', {
  method: 'POST',
  body: JSON.stringify({ priceId }),
});

// ✅ NOVO
const { updateSubscription } = useStripe();
await updateSubscription(priceId, false); // false = downgrade
```

### **Checkout:**

```typescript
// ❌ ANTIGO (permitia múltiplas subscriptions)
await fetch('/api/stripe/create-checkout', {
  method: 'POST',
  body: JSON.stringify({ priceId }),
});

// ✅ NOVO (bloqueia se subscription existe)
const { createCheckout } = useStripe();
try {
  await createCheckout(priceId);
} catch (error) {
  // Tratar HTTP 409
  if (error.message.includes('assinatura ativa')) {
    // Redirecionar para gerenciamento
  }
}
```

---

## 🏆 Benefícios Alcançados

1. ✅ **Código Limpo:** 1 endpoint para mudanças PAID→PAID
2. ✅ **UX Consistente:** Fluxo previsível para todas mudanças
3. ✅ **Sem Duplicação:** Checkout bloqueado se subscription existe
4. ✅ **Proration Correta:** Upgrade imediato calcula proporcional
5. ✅ **Downgrade Suave:** Mudança agendada sem perder acesso
6. ✅ **Error Handling:** Todas exceptions tratadas e logadas
7. ✅ **Type Safety:** Tipos TypeScript corretos
8. ✅ **Cache Management:** Invalidação automática após mudanças

---

**Status:** ✅ **FRONTEND ATUALIZADO E PRONTO PARA TESTE**

**Arquivos Modificados:**

- `hooks/use-stripe.ts` - Adicionado `updateSubscription`, melhorado `createCheckout`
- `app/(app)/plan/page.tsx` - Refatorado `handleConfirmPlan` com nova lógica

**Próximos Passos:**

1. Testar todos os 5 cenários
2. Verificar outros componentes que possam usar endpoints antigos
3. Atualizar documentação do usuário final
