# 🐛 Debug Guide - Payment Verification Errors

## Erro: Invalid time value

### Sintoma

```
RangeError: Invalid time value
    at Date.toISOString (<anonymous>)
    at POST (app/api/stripe/verify-session/route.ts:194:42)
```

### Causa Raiz

O objeto `subscription` retornado pela sessão de checkout do Stripe não contém as propriedades `current_period_end` e `current_period_start` quando a subscription é apenas expandida parcialmente.

### Solução Implementada

#### 1. Buscar Subscription Completa

Em vez de confiar apenas no expand da sessão, agora buscamos a subscription diretamente:

```typescript
let subscription: Stripe.Subscription;

if (typeof session.subscription === 'string') {
  // Se subscription é um ID, buscar os dados completos
  subscription = await stripe.subscriptions.retrieve(session.subscription);
} else if (session.subscription) {
  // Se subscription já foi expandida
  subscription = session.subscription as Stripe.Subscription;
} else {
  // Erro: subscription não encontrada
  return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
}
```

#### 2. Validação de Propriedades

Adicionamos validação para garantir que as propriedades existem:

```typescript
const sub = subscription as any;

// Validar existência
if (!sub.current_period_end || !sub.current_period_start) {
  console.error('Datas do período não encontradas na subscription');
  return NextResponse.json({ error: 'Dados do período da assinatura não encontrados' }, { status: 400 });
}
```

#### 3. Validação de Datas Válidas

Verificamos se as datas são válidas antes de usar:

```typescript
const currentPeriodEnd = new Date(sub.current_period_end * 1000);
const currentPeriodStart = new Date(sub.current_period_start * 1000);

// Validar que as datas são válidas
if (isNaN(currentPeriodEnd.getTime()) || isNaN(currentPeriodStart.getTime())) {
  console.error('Datas inválidas na subscription');
  return NextResponse.json({ error: 'Datas da assinatura são inválidas' }, { status: 400 });
}
```

#### 4. Logging para Debug

Adicionamos logs detalhados:

```typescript
console.log('Subscription obtida:', {
  id: subscription.id,
  status: subscription.status,
  hasCurrentPeriodEnd: !!(subscription as any).current_period_end,
  hasCurrentPeriodStart: !!(subscription as any).current_period_start,
});

console.log('Datas da subscription:', {
  currentPeriodStart: currentPeriodStart.toISOString(),
  currentPeriodEnd: currentPeriodEnd.toISOString(),
});
```

---

## Como Testar a Correção

### 1. Teste Manual

```bash
# Iniciar servidor
pnpm dev

# Fazer um checkout completo
# Observar logs no terminal
```

### 2. Verificar Logs

Após o redirect do Stripe, você deve ver:

```
Subscription obtida: {
  id: 'sub_xxxxx',
  status: 'active',
  hasCurrentPeriodEnd: true,
  hasCurrentPeriodStart: true
}

Datas da subscription: {
  currentPeriodStart: '2025-10-08T00:00:00.000Z',
  currentPeriodEnd: '2025-11-08T00:00:00.000Z'
}

Sessão verificada e perfil atualizado para usuário xxx - plano: basic
```

### 3. Teste com Session ID Direto

```bash
# Teste via curl
curl -X POST http://localhost:8800/api/stripe/verify-session \
  -H "Content-Type: application/json" \
  -H "Cookie: <seu_cookie_de_autenticacao>" \
  -d '{"sessionId": "cs_test_xxxxx"}'
```

---

## Outros Erros Comuns

### Erro: "Subscription não encontrada"

**Causa:** Session não tem subscription associada (pode acontecer em payment mode)

**Solução:** Verificar que o checkout foi criado com `mode: 'subscription'`

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription', // ← IMPORTANTE
  // ... resto da config
});
```

### Erro: "Datas do período não encontradas"

**Causa:** Subscription está em estado estranho ou foi cancelada antes de completar

**Solução:** Verificar status da subscription no Stripe Dashboard

### Erro: "Esta sessão não pertence a você"

**Causa:** Tentativa de verificar session_id de outro usuário

**Solução:** Este é o comportamento correto de segurança. Ignorar ou verificar autenticação.

---

## Debugging no Stripe Dashboard

### 1. Ver Detalhes da Session

1. Acesse: https://dashboard.stripe.com/test/payments
2. Procure pelo Session ID (cs_test_xxxxx)
3. Verifique:
   - Status: deve ser "complete"
   - Payment status: deve ser "paid"
   - Subscription: deve ter um link para a subscription criada

### 2. Ver Detalhes da Subscription

1. Acesse: https://dashboard.stripe.com/test/subscriptions
2. Procure pelo Subscription ID (sub_xxxxx)
3. Verifique:
   - Status: deve ser "active"
   - Current period: deve ter start e end dates
   - Customer: deve estar associado

### 3. Ver Eventos (Webhooks)

1. Acesse: https://dashboard.stripe.com/test/events
2. Procure por eventos recentes:
   - `checkout.session.completed`
   - `customer.subscription.created`
3. Verifique o payload dos eventos

---

## Monitoramento em Produção

### Logs a Monitorar

```typescript
// Sucesso
'Sessão verificada e perfil atualizado para usuário {userId} - plano: {planId}';

// Erro de dados
'Datas do período não encontradas na subscription';
'Datas inválidas na subscription';

// Erro de acesso
'Tentativa de verificar sessão de outro usuário';
```

### Métricas Recomendadas

1. **Taxa de sucesso de verificação:**

   - Meta: > 99%
   - Alarme: < 95%

2. **Tempo de verificação:**

   - Meta: < 2s
   - Alarme: > 5s

3. **Erros de datas inválidas:**
   - Meta: 0 ocorrências/dia
   - Alarme: > 5 ocorrências/dia

---

## Rollback em Caso de Problema

Se o erro persistir em produção:

### Solução Temporária via Webhook

O webhook `checkout.session.completed` já atualiza o perfil:

```typescript
// app/api/stripe/webhook/route.ts
case 'checkout.session.completed': {
  // Este já processa o pagamento
  // Pode ser usado como fallback
}
```

### Solução Manual (Emergência)

```sql
-- Atualizar perfil manualmente
UPDATE profiles
SET
  plan = 'basic',
  plan_expire_at = '2025-11-08',
  renew_status = 'monthly'
WHERE user_id = '<user_id>';

-- Criar subscription manualmente
INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  status,
  plan_id,
  current_period_start,
  current_period_end
) VALUES (
  '<profile_id>',
  'sub_xxxxx',
  'cus_xxxxx',
  'price_xxxxx',
  'active',
  'basic',
  '2025-10-08',
  '2025-11-08'
);
```

---

## Contato de Suporte

Se o problema persistir após todas as verificações:

1. **Coletar dados:**

   - Session ID
   - User ID
   - Logs do servidor
   - Screenshot do Stripe Dashboard

2. **Verificar:**

   - Variáveis de ambiente
   - Versão do Stripe SDK
   - Status da API do Stripe

3. **Reportar:**
   - Abrir issue no repositório
   - Incluir todos os dados coletados
   - Mencionar passos já realizados

---

**Última atualização:** Outubro 2025
**Status da correção:** ✅ Implementada e testada
