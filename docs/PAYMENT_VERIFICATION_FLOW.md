# 🔄 Fluxo de Aprovação de Pagamento - Guia Completo

## 📋 Visão Geral

Este documento detalha o fluxo completo de verificação e aprovação de pagamento quando o usuário retorna da tela de checkout do Stripe.

---

## 🎯 Objetivo

Garantir que quando o usuário conclui o pagamento no Stripe e retorna para a aplicação, o sistema:

1. ✅ Valide o status da sessão de checkout
2. ✅ Confirme que o pagamento foi processado com sucesso
3. ✅ Atualize o perfil do usuário com o plano correto
4. ✅ Atualize a subscription no banco de dados
5. ✅ Registre o pagamento
6. ✅ Forneça feedback visual claro ao usuário

---

## 🔄 Fluxo Completo

### 1. Usuário Inicia o Checkout

```
Página de Planos (/plan)
    ↓
Usuário clica em "Selecionar Plano"
    ↓
CheckoutModal é exibido
    ↓
Usuário clica em "Continuar com Pagamento"
    ↓
POST /api/stripe/create-checkout-session
    ↓
Stripe Checkout Session criada com:
  - success_url: /plan?success=true&session_id={CHECKOUT_SESSION_ID}
  - cancel_url: /plan?canceled=true
    ↓
Usuário é redirecionado para Stripe Hosted Checkout
```

### 2. Usuário Preenche Dados de Pagamento no Stripe

```
Stripe Hosted Checkout Page
    ↓
Usuário preenche:
  - Número do cartão
  - Data de validade
  - CVV
  - Informações de cobrança
    ↓
Stripe processa o pagamento
```

### 3. Retorno para a Aplicação

#### Cenário A: Pagamento Bem-sucedido

```
Stripe redireciona para:
  /plan?success=true&session_id=cs_test_xxxxx
    ↓
useEffect detecta session_id na URL
    ↓
handleCheckoutReturn(sessionId) é chamado
    ↓
Estado verifyingPayment = true
    ↓
PaymentVerification component é exibido
  Status: "Verificando pagamento..."
    ↓
POST /api/stripe/verify-session
  Body: { sessionId: "cs_test_xxxxx" }
    ↓
Backend:
  1. Valida usuário autenticado
  2. Busca sessão no Stripe
  3. Verifica status === 'complete'
  4. Verifica payment_status === 'paid'
  5. Verifica se sessão pertence ao usuário
  6. Atualiza perfil no banco:
     - plan = planId (ex: "essentials")
     - plan_expire_at = currentPeriodEnd
     - renew_status = "monthly" ou "yearly"
  7. Cria/atualiza subscription no banco
  8. Registra pagamento na tabela payments
    ↓
Response: {
  success: true,
  status: 'complete',
  paymentStatus: 'paid',
  plan: 'essentials',
  billingPeriod: 'monthly'
}
    ↓
Frontend:
  1. setCurrentPlan(result.plan)
  2. setPaymentStatus('success')
  3. PaymentVerification mostra checkmark verde
  4. Aguarda 2 segundos
  5. Toast de sucesso: "Pagamento confirmado! 🎉"
  6. Recarrega dados do perfil
  7. Redireciona para /plan (URL limpa)
```

#### Cenário B: Pagamento Cancelado

```
Stripe redireciona para:
  /plan?canceled=true
    ↓
useEffect detecta canceled=true
    ↓
Toast: "Checkout cancelado"
    ↓
URL limpa: router.replace('/plan')
    ↓
Usuário volta para página de planos
```

#### Cenário C: Pagamento Pendente

```
Stripe redireciona para:
  /plan?success=true&session_id=cs_test_xxxxx
    ↓
POST /api/stripe/verify-session
    ↓
Backend detecta:
  - session.status !== 'complete' OU
  - session.payment_status !== 'paid'
    ↓
Response: {
  success: false,
  status: 'pending',
  message: 'Pagamento ainda não foi concluído'
}
    ↓
Frontend:
  1. setPaymentStatus('error')
  2. PaymentVerification mostra X vermelho
  3. Toast: "Pagamento pendente"
  4. Redireciona para /plan
```

---

## 🛠️ Componentes Implementados

### 1. Endpoint: `/api/stripe/verify-session`

**Arquivo:** `app/api/stripe/verify-session/route.ts`

**Método:** POST

**Request:**

```json
{
  "sessionId": "cs_test_xxxxx"
}
```

**Validações:**

1. ✅ SessionId é obrigatório (Zod validation)
2. ✅ Usuário está autenticado
3. ✅ Sessão existe no Stripe
4. ✅ Sessão pertence ao usuário autenticado
5. ✅ Status da sessão é 'complete'
6. ✅ Payment status é 'paid'

**Ações:**

1. 📝 Atualiza profile:

   - `plan` → novo plano
   - `plan_expire_at` → data de expiração
   - `renew_status` → monthly/yearly

2. 📝 Cria/atualiza subscription:

   - `stripe_subscription_id`
   - `stripe_customer_id`
   - `stripe_price_id`
   - `status`
   - `current_period_start`
   - `current_period_end`
   - `cancel_at_period_end`

3. 📝 Registra payment:
   - `stripe_payment_intent_id`
   - `stripe_invoice_id`
   - `amount`
   - `currency`
   - `status`

**Response (Sucesso):**

```json
{
  "success": true,
  "status": "complete",
  "paymentStatus": "paid",
  "plan": "essentials",
  "billingPeriod": "monthly",
  "currentPeriodEnd": "2025-11-08T00:00:00.000Z",
  "message": "Pagamento confirmado e plano atualizado com sucesso"
}
```

**Response (Erro):**

```json
{
  "success": false,
  "status": "pending",
  "message": "Pagamento ainda não foi concluído"
}
```

---

### 2. Componente: `PaymentVerification`

**Arquivo:** `components/PaymentVerification.tsx`

**Props:**

```typescript
interface PaymentVerificationProps {
  status: 'verifying' | 'success' | 'error';
  message?: string;
}
```

**Estados Visuais:**

#### Verifying (Verificando)

- 🔄 Loader animado
- Título: "Verificando pagamento..."
- Descrição: "Aguarde enquanto confirmamos seu pagamento..."
- Lista de ações:
  - ✓ Validando sessão de pagamento
  - ⏳ Atualizando seu plano
  - ⏳ Liberando acesso às funcionalidades

#### Success (Sucesso)

- ✅ Checkmark verde animado (zoom-in)
- Título: "Pagamento confirmado!"
- Descrição: "Seu plano foi ativado com sucesso!"
- Mensagem: "Redirecionando em instantes..."

#### Error (Erro)

- ❌ X vermelho
- Título: "Erro na verificação"
- Descrição: Mensagem de erro customizada
- Instrução: "Por favor, entre em contato com o suporte se o problema persistir."

**Comportamento:**

- Overlay em fullscreen com backdrop blur
- Não pode ser fechado pelo usuário (process automático)
- Desaparece automaticamente após conclusão

---

### 3. Integração na Página de Planos

**Arquivo:** `app/plan/page.tsx`

**Estados Adicionados:**

```typescript
const [verifyingPayment, setVerifyingPayment] = useState(false);
const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
```

**Função `handleCheckoutReturn`:**

```typescript
const handleCheckoutReturn = async (sessionId: string) => {
  setVerifyingPayment(true);
  setPaymentStatus('verifying');

  try {
    const response = await fetch('/api/stripe/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const result = await response.json();

    if (result.success && result.status === 'complete') {
      setCurrentPlan(result.plan);
      setPaymentStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({ title: 'Pagamento confirmado! 🎉' });
      await fetchCurrentPlan();
      router.replace('/plan');
    } else {
      setPaymentStatus('error');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast({ title: 'Pagamento pendente', variant: 'destructive' });
      router.replace('/plan');
    }
  } catch (error) {
    setPaymentStatus('error');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast({ title: 'Erro ao verificar pagamento', variant: 'destructive' });
    router.replace('/plan');
  } finally {
    setVerifyingPayment(false);
  }
};
```

**useEffect Atualizado:**

```typescript
useEffect(() => {
  const sessionId = searchParams.get('session_id');
  if (sessionId) {
    handleCheckoutReturn(sessionId);
    return; // Não executa o resto do useEffect
  }

  // Resto da lógica...
}, [searchParams]);
```

**Render:**

```tsx
return (
  <div className="min-h-screen bg-background">
    {/* Payment Verification Overlay */}
    {verifyingPayment && <PaymentVerification status={paymentStatus} />}

    {/* Resto do conteúdo... */}
  </div>
);
```

---

## 🔒 Segurança

### Validações de Segurança Implementadas

1. **Autenticação Obrigatória**

   ```typescript
   const {
     data: { user },
     error: authError,
   } = await supabase.auth.getUser();
   if (authError || !user) {
     return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
   }
   ```

2. **Verificação de Propriedade da Sessão**

   ```typescript
   if (session.metadata?.userId !== user.id) {
     return NextResponse.json({ error: 'Esta sessão não pertence a você' }, { status: 403 });
   }
   ```

3. **Validação de Status da Sessão**

   ```typescript
   if (session.status !== 'complete') {
     return NextResponse.json({ success: false, message: 'Pagamento não concluído' });
   }
   ```

4. **Validação de Status do Pagamento**

   ```typescript
   if (session.payment_status !== 'paid') {
     return NextResponse.json({ success: false, message: 'Pagamento não confirmado' });
   }
   ```

5. **Input Validation com Zod**
   ```typescript
   const VerifySessionSchema = z.object({
     sessionId: z.string().min(1, 'Session ID é obrigatório'),
   });
   ```

---

## 🧪 Testando o Fluxo

### Setup de Teste

1. **Certifique-se de ter as variáveis de ambiente configuradas:**

   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_APP_URL=http://localhost:8800
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

### Teste Passo a Passo

#### Teste 1: Fluxo Completo de Sucesso

1. Acesse `http://localhost:8800/plan`
2. Clique em "Selecionar Plano" no plano Essentials
3. No modal, clique em "Continuar com Pagamento"
4. Você será redirecionado para o Stripe Checkout
5. Use o cartão de teste: `4242 4242 4242 4242`
   - Validade: Qualquer data futura
   - CVV: Qualquer 3 dígitos
   - CEP: Qualquer código
6. Complete o pagamento
7. **Verificar:**
   - [ ] Você é redirecionado para `/plan?success=true&session_id=cs_test_...`
   - [ ] Overlay de "Verificando pagamento..." aparece
   - [ ] Após ~2 segundos, checkmark verde aparece
   - [ ] Toast de "Pagamento confirmado! 🎉" é exibido
   - [ ] URL é limpa para `/plan`
   - [ ] O card do plano Essentials mostra "Plano Atual"
   - [ ] Header mostra o novo plano

#### Teste 2: Cancelamento de Checkout

1. Acesse `http://localhost:8800/plan`
2. Inicie o checkout para qualquer plano
3. No Stripe Checkout, clique no botão "Voltar" ou feche a aba
4. **Verificar:**
   - [ ] Você retorna para `/plan?canceled=true`
   - [ ] Toast de "Checkout cancelado" é exibido
   - [ ] URL é limpa para `/plan`
   - [ ] Plano não foi alterado

#### Teste 3: Session ID Inválido

1. Acesse manualmente: `http://localhost:8800/plan?session_id=cs_invalid_xxxxx`
2. **Verificar:**
   - [ ] Overlay de "Verificando pagamento..." aparece
   - [ ] Após ~2 segundos, X vermelho aparece
   - [ ] Toast de erro é exibido
   - [ ] URL é limpa para `/plan`

#### Teste 4: Session ID de Outro Usuário

1. Faça login como Usuário A
2. Inicie um checkout e copie o session_id da URL
3. Faça logout e login como Usuário B
4. Acesse: `http://localhost:8800/plan?session_id=<session_id_do_usuario_A>`
5. **Verificar:**
   - [ ] Erro 403 "Esta sessão não pertence a você"
   - [ ] Toast de erro é exibido
   - [ ] Plano não é alterado

---

## 🐛 Troubleshooting

### Problema: "Sessão de checkout não encontrada"

**Causa:** Session ID inválido ou expirado

**Solução:**

- Sessões de checkout expiram após 24 horas
- Verificar se o session_id na URL está correto
- Iniciar um novo checkout

### Problema: "Esta sessão não pertence a você"

**Causa:** Tentativa de usar session_id de outro usuário

**Solução:**

- Verificar se o usuário correto está logado
- Iniciar um novo checkout com o usuário atual

### Problema: "Pagamento ainda não foi concluído"

**Causa:** Pagamento está pendente ou falhou

**Solução:**

- Verificar status no Stripe Dashboard
- Se o pagamento foi aprovado, aguardar webhook processar
- Se falhou, iniciar novo checkout

### Problema: Profile não é atualizado

**Causa:** Erro no endpoint de verificação ou permissões do banco

**Solução:**

1. Verificar logs do servidor
2. Verificar permissões RLS no Supabase
3. Verificar se o profile existe no banco
4. Verificar se o session_id é válido

---

## 📊 Dados Atualizados no Banco

### Tabela: `profiles`

```sql
UPDATE profiles
SET
  plan = 'essentials',              -- Plano adquirido
  plan_expire_at = '2025-11-08',    -- Data de expiração
  renew_status = 'monthly',          -- Tipo de renovação
  updated_at = NOW()
WHERE user_id = '<user_id>';
```

### Tabela: `subscriptions`

```sql
INSERT INTO subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  plan_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  '<profile_id>',
  'cus_xxxxx',
  'sub_xxxxx',
  'price_xxxxx',
  'active',
  'essentials',
  '2025-10-08',
  '2025-11-08',
  false,
  NOW(),
  NOW()
);
```

### Tabela: `payments`

```sql
INSERT INTO payments (
  user_id,
  stripe_payment_intent_id,
  stripe_invoice_id,
  amount,
  currency,
  status,
  created_at
) VALUES (
  '<profile_id>',
  'pi_xxxxx',
  'in_xxxxx',
  6990,  -- R$ 69,90 em centavos
  'brl',
  'succeeded',
  NOW()
);
```

---

## ✅ Checklist de Implementação

### Backend

- [x] Endpoint `/api/stripe/verify-session` criado
- [x] Validação com Zod
- [x] Autenticação obrigatória
- [x] Verificação de propriedade da sessão
- [x] Atualização do profile
- [x] Criação/atualização de subscription
- [x] Registro de payment
- [x] Logging de erros
- [x] Type safety com TypeScript

### Frontend

- [x] Componente `PaymentVerification` criado
- [x] Estados de verificação (verifying, success, error)
- [x] Função `handleCheckoutReturn` implementada
- [x] useEffect atualizado para detectar session_id
- [x] Integração com toast notifications
- [x] Loading states apropriados
- [x] Error handling robusto
- [x] URL cleanup após processamento

### UX

- [x] Feedback visual durante verificação
- [x] Animações suaves (zoom-in para sucesso)
- [x] Mensagens claras e informativas
- [x] Overlay não-fechável durante processo
- [x] Redirecionamento automático após conclusão
- [x] Toast notifications de sucesso/erro

### Segurança

- [x] Validação de autenticação
- [x] Verificação de propriedade
- [x] Input validation
- [x] Status checks múltiplos
- [x] Error logging

---

## 🚀 Próximos Passos

1. [ ] Adicionar testes E2E com Playwright
2. [ ] Implementar retry logic para falhas de rede
3. [ ] Adicionar analytics de conversão
4. [ ] Criar dashboard de pagamentos para admin
5. [ ] Implementar email notifications de confirmação
6. [ ] Adicionar suporte para múltiplos métodos de pagamento

---

## 📚 Referências

- [Stripe Checkout Sessions](https://stripe.com/docs/api/checkout/sessions)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod Validation](https://zod.dev/)

**Status:** ✅ Implementação Completa
**Última atualização:** Outubro 2025
