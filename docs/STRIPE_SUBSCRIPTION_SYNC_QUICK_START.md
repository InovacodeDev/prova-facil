# 🔄 Sistema de Sincronização Automática de Subscriptions

> **Objetivo**: Garantir que o `stripe_subscription_id` no perfil esteja sempre sincronizado com a subscription ativa mais recente do Stripe.

## 🚀 Quick Start

### 1. Configurar Webhook no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com) → Seu Projeto
2. Vá para **Database** → **Webhooks** → **Create a new hook**
3. Configure:
   - **Name**: `Sync Stripe Subscriptions`
   - **Table**: `profiles`
   - **Events**: ☑ Insert, ☑ Update
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-app.com/api/webhooks/supabase`
   - **HTTP Headers**:
     ```
     Authorization: Bearer YOUR_WEBHOOK_SECRET
     ```

### 2. Adicionar Variável de Ambiente

```bash
# .env
SUPABASE_WEBHOOK_SECRET=your-secure-random-secret-here
```

Gere um secret seguro:

```bash
openssl rand -base64 32
```

### 3. Aplicar Trigger SQL

Execute no SQL Editor do Supabase:

```sql
-- O trigger já está em db/triggers.sql
-- Se ainda não aplicado, execute:
\i db/triggers.sql
```

### 4. Testar

```bash
# Testar manualmente o endpoint
node scripts/test-subscription-sync.js cus_XXX

# Ou testar o webhook completo
curl -X POST http://localhost:3000/api/webhooks/supabase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "type": "UPDATE",
    "table": "profiles",
    "schema": "public",
    "record": {
      "id": "user-id",
      "stripe_customer_id": "cus_XXX",
      "stripe_subscription_id": "sub_XXX"
    },
    "old_record": {
      "stripe_subscription_id": "sub_OLD"
    }
  }'
```

## 📋 Como Funciona

### Fluxo Automático

```
┌─────────────────────────────────────────────────────────┐
│  1. Mudança no Profile (INSERT/UPDATE)                 │
│     - stripe_customer_id alterado                       │
│     - stripe_subscription_id alterado                   │
│     - plan_id alterado                                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  2. Trigger SQL Detecta Mudança                         │
│     - trigger_sync_stripe_subscription                  │
│     - Envia notificação                                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  3. Supabase Webhook Recebe Evento                      │
│     - POST /api/webhooks/supabase                       │
│     - Verifica Authorization header                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  4. Webhook Chama Endpoint de Sync                      │
│     - POST /api/stripe/sync-customer-subscription       │
│     - Envia customerId e profileId                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  5. Endpoint Busca Subscriptions no Stripe              │
│     - stripe.subscriptions.list({ customer })           │
│     - Filtra apenas ativas (active/trialing/past_due)   │
│     - Pega a mais recente                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  6. Endpoint Atualiza Profile                           │
│     - Extrai product_id → mapeia plan_id                │
│     - UPDATE profiles SET                               │
│       stripe_subscription_id = 'sub_XXX',               │
│       plan_id = 'basic'                                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  7. Cache Invalidado                                    │
│     - invalidateSubscriptionCacheByCustomerId()         │
│     - UI reflete mudança imediatamente                  │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Casos de Uso

### ✅ Upgrade de Plano

- Usuário no Starter compra plano Basic
- Nova subscription criada no Stripe
- Webhook do Stripe atualiza profile
- Sistema detecta mudança e sincroniza automaticamente
- `stripe_subscription_id` → `sub_new_XXX`
- `plan_id` → `basic`

### ✅ Múltiplas Subscriptions

- Usuário tem subscription antiga (cancelada)
- Cria nova subscription
- Sistema busca TODAS as subscriptions do customer
- Filtra apenas as ativas
- Usa a mais recente
- Ignora subscriptions antigas

### ✅ Subscription Expirada

- Subscription expira ou é cancelada
- Status muda para `canceled`
- Sistema busca outras subscriptions ativas
- Se nenhuma encontrada → volta ao `starter`

### ✅ Downgrade

- Usuário cancela subscription
- Webhook do Stripe processa cancelamento
- Sistema busca próxima subscription ativa
- Se nenhuma → `plan_id` volta para `starter`

## 🔍 Debug

### Verificar Logs

```bash
# Logs do endpoint de sync
# Procure por: "[Sync Customer Subscription]"

[Sync Customer Subscription] Request received
[Sync Customer Subscription] Syncing for customer: cus_XXX
[Sync Customer Subscription] Found 2 subscriptions
[Sync Customer Subscription] Found 1 active subscriptions
[Sync Customer Subscription] Most recent active subscription: sub_XXX
[Sync Customer Subscription] Mapped to plan_id: basic
[Sync Customer Subscription] Profile updated successfully
```

### Testar Manualmente

```bash
# Testar endpoint diretamente
node scripts/test-subscription-sync.js cus_XXX

# Ver ajuda
node scripts/test-subscription-sync.js --help
```

### Verificar Trigger no Banco

```sql
-- Ver se trigger está ativo
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'profiles'::regclass
AND tgname = 'trigger_sync_stripe_subscription';

-- Testar trigger manualmente
UPDATE profiles
SET stripe_subscription_id = 'sub_test_123'
WHERE stripe_customer_id = 'cus_XXX';
-- Deve ver logs do webhook sendo chamado
```

## 🛠️ Troubleshooting

### Webhook não está sendo chamado

1. ✅ Verifique se está ativo no Supabase Dashboard
2. ✅ URL do webhook está correta e acessível
3. ✅ Use ngrok para desenvolvimento: `ngrok http 3000`

### Subscription não sincroniza

1. ✅ Verifique `stripe_customer_id` no profile
2. ✅ Verifique subscriptions no Stripe: `stripe subscriptions list --customer cus_XXX`
3. ✅ Verifique logs do endpoint
4. ✅ Verifique tabela `plans` tem `stripe_product_id` correto

### Cache não invalida

1. ✅ Verifique se Redis está rodando
2. ✅ Verifique logs de invalidação
3. ✅ Force invalidação manual via código

## 📚 Documentação Completa

Ver [`docs/STRIPE_SUBSCRIPTION_SYNC_SYSTEM.md`](./STRIPE_SUBSCRIPTION_SYNC_SYSTEM.md) para:

- Arquitetura detalhada
- Guias de configuração
- Testes e validação
- Monitoramento e alertas
- Segurança e melhores práticas

## 🎉 Benefícios

- ✅ **Zero Intervenção Manual**: Sistema 100% automático
- ✅ **Sempre Atualizado**: Profile reflete subscription mais recente
- ✅ **Resiliente**: Funciona com múltiplas subscriptions
- ✅ **Performático**: Cache invalidado automaticamente
- ✅ **Seguro**: Webhook protegido com secret
- ✅ **Escalável**: Suporta milhares de eventos/minuto

---

**Próximos Passos**:

1. [x] Criar endpoints e triggers
2. [ ] Configurar webhook no Supabase
3. [ ] Adicionar secret ao `.env`
4. [ ] Testar com `scripts/test-subscription-sync.js`
5. [ ] Deploy em produção
