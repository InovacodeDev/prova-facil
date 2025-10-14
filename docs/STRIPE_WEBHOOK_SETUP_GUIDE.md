# Guia de Configuração de Webhooks do Stripe

## 📋 Visão Geral

Este guia explica como configurar webhooks do Stripe para manter seu banco de dados automaticamente sincronizado com mudanças de subscription, pagamentos e outros eventos do Stripe.

## 🎯 O que são Webhooks?

Webhooks são notificações em tempo real que o Stripe envia para sua aplicação quando eventos importantes acontecem (pagamentos, cancelamentos, etc). Sem webhooks, você precisaria fazer polling constante da API do Stripe, o que é ineficiente e pode causar atrasos.

## 🔧 Passo 1: Configurar Webhook no Stripe Dashboard

### Desenvolvimento Local (usando Stripe CLI)

1. **Instalar Stripe CLI**:

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   # Veja: https://stripe.com/docs/stripe-cli#install

   # Windows
   # Baixe de: https://github.com/stripe/stripe-cli/releases/latest
   ```

2. **Login no Stripe CLI**:

   ```bash
   stripe login
   ```

   Isso abrirá seu navegador para autorizar.

3. **Iniciar o Forward de Webhooks**:

   ```bash
   # Forward webhooks para localhost
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copiar o Webhook Secret**:
   O CLI exibirá algo como:

   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```

   Copie esse secret e adicione ao seu `.env`:

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

5. **Testar Webhooks**:
   Em outro terminal, dispare um evento de teste:
   ```bash
   stripe trigger customer.subscription.created
   ```

### Produção (Stripe Dashboard)

1. **Acessar o Dashboard**:

   - Vá para: https://dashboard.stripe.com/webhooks
   - Clique em **"Add endpoint"**

2. **Configurar o Endpoint**:

   ```
   Endpoint URL: https://your-app.com/api/stripe/webhook
   Description: Production webhook for subscription sync
   ```

3. **Selecionar Eventos**:
   Marque os seguintes eventos:

   **Subscription Events** (Obrigatórios):

   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`

   **Payment Events** (Recomendados):

   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

   **Checkout Events** (Recomendados):

   - ✅ `checkout.session.completed`

   **Customer Events** (Opcionais):

   - ⚪ `customer.updated`
   - ⚪ `customer.deleted`

4. **Obter o Webhook Secret**:

   - Após criar o endpoint, clique nele
   - Na seção **"Signing secret"**, clique em **"Reveal"**
   - Copie o secret (começará com `whsec_`)

5. **Adicionar ao `.env` de Produção**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

## 🔐 Passo 2: Configurar Variáveis de Ambiente

Seu `.env` deve ter:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxx  # ou sk_live_xxxxx para produção
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Supabase (Service Role necessário para webhooks)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

## 📡 Passo 3: Entender o Fluxo de Webhooks

### Fluxo Completo

```
┌────────────────────────────────────────────────────────┐
│ 1. Evento no Stripe                                    │
│    - Usuário completa checkout                         │
│    - Subscription é renovada                           │
│    - Pagamento falha                                   │
│    - Usuário cancela subscription                      │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 2. Stripe Envia Webhook                                │
│    POST https://your-app.com/api/stripe/webhook        │
│    Headers:                                            │
│      - stripe-signature: xxx                           │
│    Body: { type: "event", data: {...} }               │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 3. Sua API Verifica Assinatura                        │
│    stripe.webhooks.constructEvent()                    │
│    - Verifica que veio do Stripe                       │
│    - Previne ataques de replay                         │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 4. API Responde 200 OK Imediatamente                  │
│    - Confirma recebimento (< 5 segundos)               │
│    - Evita retry do Stripe                             │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 5. Processamento Assíncrono                           │
│    setImmediate(() => {                                │
│      - Atualiza banco de dados                         │
│      - Invalida cache                                  │
│      - Envia emails (se necessário)                    │
│    })                                                  │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 6. Database Atualizado                                 │
│    - stripe_subscription_id                            │
│    - plan_id                                           │
│    - updated_at                                        │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 7. Cache Invalidado                                    │
│    - Redis cache cleared                               │
│    - Next request fetches fresh data                   │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 8. UI Atualizada (via Realtime)                       │
│    - Supabase Realtime detecta mudança                 │
│    - Sidebar atualiza automaticamente                  │
│    - User vê novo plano instantaneamente               │
└────────────────────────────────────────────────────────┘
```

## 🎯 Eventos Tratados

### `customer.subscription.created`

**Quando:** Nova subscription é criada
**Ação:**

- Atualiza `stripe_subscription_id` no profile
- Mapeia `product_id` → `plan_id`
- Invalida cache
- Cancela subscriptions antigas (se existirem)

### `customer.subscription.updated`

**Quando:** Subscription é modificada (upgrade, downgrade, renovação)
**Ação:**

- Atualiza `stripe_subscription_id` e `plan_id`
- Invalida cache
- UI atualiza automaticamente

### `customer.subscription.deleted`

**Quando:** Subscription é cancelada
**Ação:**

- Set `stripe_subscription_id = null`
- Set `plan_id = 'starter'`
- Usuário volta ao plano gratuito
- Invalida cache

### `invoice.payment_succeeded`

**Quando:** Pagamento de fatura bem-sucedido
**Ação:**

- Confirma que subscription está ativa
- Sincroniza dados do Stripe
- Envia email de confirmação (TODO)

### `invoice.payment_failed`

**Quando:** Pagamento de fatura falha
**Ação:**

- Loga falha para análise
- Envia email de notificação (TODO)
- Atualiza status se necessário (TODO)

### `checkout.session.completed`

**Quando:** Checkout é completado
**Ação:**

- Sincroniza subscription criada
- Atualiza profile imediatamente
- Trabalha em conjunto com `sync-subscription` endpoint

## 🧪 Testar Webhooks

### Testes Locais com Stripe CLI

```bash
# 1. Iniciar forward de webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 2. Em outro terminal, disparar eventos de teste
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed

# 3. Ver logs no terminal do forward
# Deve mostrar: ✓ Webhook received: customer.subscription.created
```

### Testes no Dashboard

1. Vá para: https://dashboard.stripe.com/test/webhooks
2. Clique no seu endpoint
3. Clique em **"Send test webhook"**
4. Selecione o evento (e.g., `customer.subscription.created`)
5. Clique em **"Send test webhook"**
6. Verifique a resposta (deve ser 200 OK)

### Verificar Logs

```bash
# Logs da aplicação Next.js
# Procure por: "[Stripe Webhook]"

[Stripe Webhook] ====================================
[Stripe Webhook] Incoming webhook request
[Stripe Webhook] ✅ Signature verified
[Stripe Webhook] Event type: customer.subscription.created
[Stripe Webhook] Event ID: evt_xxxxx
[Stripe Webhook] Processing event: customer.subscription.created
[Stripe Webhook] Subscription event: sub_xxxxx
[Stripe Webhook] Customer: cus_xxxxx
[Stripe Webhook] Status: active
[Stripe Webhook] ✅ Event processed successfully
```

## 🔍 Debug e Troubleshooting

### Webhook Não Está Sendo Recebido

**1. Verificar URL do Endpoint**

```bash
# Deve ser acessível publicamente
curl -X POST https://your-app.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**2. Verificar Logs do Stripe**

- Dashboard → Webhooks → Seu endpoint → Logs
- Procure por erros 4xx ou 5xx

**3. Usar ngrok para Desenvolvimento**

```bash
# Instalar ngrok
brew install ngrok

# Expor localhost
ngrok http 3000

# Usar URL do ngrok no webhook
https://xxxxx.ngrok.io/api/stripe/webhook
```

### Erro de Signature Verification

**Causa:** `STRIPE_WEBHOOK_SECRET` incorreto ou ausente

**Solução:**

```bash
# 1. Verificar se variável está definida
echo $STRIPE_WEBHOOK_SECRET

# 2. Se vazio, adicionar ao .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 3. Reiniciar aplicação
npm run dev
```

### Profile Não Atualiza

**1. Verificar logs do webhook**

```bash
# Procure por erros:
# [Stripe Webhook] ❌ Error updating profile
```

**2. Verificar se customer_id existe no profile**

```sql
-- No SQL Editor do Supabase
SELECT id, stripe_customer_id, stripe_subscription_id, plan_id
FROM profiles
WHERE stripe_customer_id = 'cus_XXX';
```

**3. Verificar se plans table tem product_id**

```sql
SELECT id, stripe_product_id
FROM plans
WHERE stripe_product_id = 'prod_XXX';
```

### Webhook Timeout (504)

**Causa:** Processamento demora > 5 segundos

**Solução:** Já implementado! Usamos `setImmediate()` para processar de forma assíncrona.

## 📊 Monitoramento

### Métricas Importantes

1. **Taxa de Sucesso**: % de webhooks que retornam 200 OK
2. **Latência**: Tempo entre evento e resposta (deve ser < 5s)
3. **Retry Rate**: % de webhooks que precisam de retry
4. **Error Rate**: % de webhooks que falham

### Ver no Stripe Dashboard

1. Dashboard → Webhooks → Seu endpoint
2. Ver gráficos de:
   - Sucessos vs Falhas
   - Latência de resposta
   - Eventos mais comuns

## 🚀 Próximos Passos

- [ ] Configurar webhook no Stripe Dashboard
- [ ] Adicionar `STRIPE_WEBHOOK_SECRET` ao `.env`
- [ ] Testar com `stripe trigger`
- [ ] Verificar logs
- [ ] Monitorar taxa de sucesso
- [ ] Deploy em produção
- [ ] Configurar webhook de produção

## 📚 Referências

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)

---

**Data de Criação**: 2025-10-14
**Versão**: 1.0.0
**Autor**: Prova Fácil Team
