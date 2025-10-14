# Sistema de Sincronização Automática de Subscriptions do Stripe

## 📋 Visão Geral

Este sistema garante que o `stripe_subscription_id` no perfil do usuário esteja sempre sincronizado com a subscription mais recente e ativa do Stripe. Isso resolve problemas onde:

- Novas subscriptions são criadas mas o perfil não é atualizado
- Subscriptions antigas permanecem vinculadas após upgrade/downgrade
- Inconsistências entre Stripe e banco de dados

## 🏗️ Arquitetura

### Componentes Criados

1. **API Endpoint**: `/api/stripe/sync-customer-subscription`

   - Busca todas as subscriptions do Stripe para um customer
   - Identifica a subscription ativa mais recente
   - Atualiza o profile com subscription_id e plan_id corretos
   - Invalida o cache para refresh imediato

2. **Webhook Handler**: `/api/webhooks/supabase`

   - Recebe eventos de mudança do banco de dados via webhook do Supabase
   - Detecta mudanças em profiles com stripe_customer_id
   - Chama automaticamente o endpoint de sync

3. **Database Trigger**: `trigger_sync_stripe_subscription`

   - Monitora INSERT/UPDATE na tabela profiles
   - Envia notificação pg_notify quando Stripe fields mudam
   - Pode ser usado com listener Node.js ou webhooks

4. **Realtime Listener** (Opcional): `lib/stripe/subscription-sync-listener.ts`
   - Escuta eventos de mudança em tempo real via Supabase Realtime
   - Alternativa aos webhooks para ambientes self-hosted

## 🚀 Configuração

### Opção 1: Supabase Webhooks (Recomendado)

Esta é a opção mais simples e confiável para ambientes de produção.

#### 1. Configurar Webhook no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Database** → **Webhooks**
4. Clique em **Create a new hook**
5. Configure:
   ```
   Name: Sync Stripe Subscriptions
   Table: profiles
   Events: ☑ Insert, ☑ Update
   Type: HTTP Request
   Method: POST
   URL: https://your-app.com/api/webhooks/supabase
   HTTP Headers:
     Authorization: Bearer YOUR_WEBHOOK_SECRET_HERE
   ```

#### 2. Adicionar Variável de Ambiente

Adicione ao seu `.env`:

```bash
SUPABASE_WEBHOOK_SECRET=your-secure-random-secret-here
```

> **Dica**: Gere um secret seguro com: `openssl rand -base64 32`

#### 3. Testar o Webhook

```bash
# Simular um evento de webhook
curl -X POST https://your-app.com/api/webhooks/supabase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET_HERE" \
  -d '{
    "type": "UPDATE",
    "table": "profiles",
    "schema": "public",
    "record": {
      "id": "user-id-here",
      "stripe_customer_id": "cus_XXX",
      "stripe_subscription_id": "sub_XXX"
    },
    "old_record": {
      "id": "user-id-here",
      "stripe_customer_id": "cus_XXX",
      "stripe_subscription_id": "sub_YYY"
    }
  }'
```

### Opção 2: Realtime Listener (Para Desenvolvimento)

Use esta opção se preferir um processo Node.js separado que escuta mudanças em tempo real.

#### 1. Adicionar Variáveis de Ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 2. Iniciar o Listener

```bash
# Em desenvolvimento
npm run dev
# Em outro terminal
node --loader ts-node/esm lib/stripe/subscription-sync-listener.ts

# Ou adicione um script no package.json:
"scripts": {
  "sync:listen": "node --loader ts-node/esm lib/stripe/subscription-sync-listener.ts"
}
```

#### 3. Habilitar Realtime no Supabase

```sql
-- No SQL Editor do Supabase
ALTER TABLE profiles REPLICA IDENTITY FULL;
```

## 📊 Fluxo de Funcionamento

### Fluxo Completo (com Webhooks)

```
1. Usuário atualiza subscription no Stripe
   ↓
2. Stripe Webhook processa a mudança
   ↓
3. Profile é atualizado no banco (stripe_subscription_id muda)
   ↓
4. Supabase Webhook detecta a mudança
   ↓
5. POST /api/webhooks/supabase é chamado
   ↓
6. Webhook chama POST /api/stripe/sync-customer-subscription
   ↓
7. Endpoint busca subscription ativa no Stripe
   ↓
8. Endpoint atualiza profile com dados corretos
   ↓
9. Cache é invalidado
   ↓
10. UI reflete mudança imediatamente
```

### O que o Endpoint de Sync Faz

```typescript
// 1. Busca TODAS as subscriptions do customer no Stripe
const subscriptions = await stripe.subscriptions.list({
  customer: customerId,
  status: 'all',
  limit: 100,
});

// 2. Filtra apenas subscriptions ativas
const activeSubscriptions = subscriptions.data.filter((sub) => ['active', 'trialing', 'past_due'].includes(sub.status));

// 3. Pega a mais recente (Stripe retorna ordenado por data)
const mostRecentSubscription = activeSubscriptions[0] || null;

// 4. Extrai product_id → mapeia para plan_id
const productId = subscription.items.data[0]?.price?.product;
const plan = await db.plans.findOne({ stripe_product_id: productId });

// 5. Atualiza profile
await db.profiles.update({
  stripe_subscription_id: subscription.id,
  plan_id: plan.id,
});

// 6. Invalida cache
await invalidateSubscriptionCacheByCustomerId(customerId);
```

## 🧪 Testes

### Testar Manualmente o Sync

```bash
# Via API diretamente
curl -X POST http://localhost:3000/api/stripe/sync-customer-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_XXX",
    "profileId": "user-id-here"
  }'
```

### Testar o Trigger

```sql
-- No SQL Editor do Supabase
-- Atualizar um profile para disparar o sync
UPDATE profiles
SET stripe_subscription_id = 'sub_test_123'
WHERE stripe_customer_id = 'cus_XXX';

-- Verificar logs do webhook/listener
-- Deve ver: "Stripe subscription sync notification triggered"
```

### Cenários de Teste

1. **Upgrade de Plano**

   - Usuário no Starter compra Basic
   - Nova subscription criada
   - Webhook do Stripe atualiza profile
   - Sistema sincroniza automaticamente

2. **Downgrade de Plano**

   - Usuário cancela subscription
   - Webhook do Stripe atualiza profile
   - Sistema busca subscription ativa mais recente
   - Se nenhuma ativa, volta para starter

3. **Múltiplas Subscriptions**

   - Usuário tem subscription antiga cancelada
   - Cria nova subscription (upgrade)
   - Sistema ignora a antiga e usa a nova

4. **Subscription Expirada**
   - Subscription expira
   - Webhook atualiza para status 'canceled'
   - Sistema busca outras subscriptions ativas
   - Se nenhuma, volta para starter

## 🔍 Debug e Logs

### Logs do Endpoint de Sync

```bash
# Ver logs em tempo real
# Procure por: "[Sync Customer Subscription]"

[Sync Customer Subscription] Request received
[Sync Customer Subscription] Syncing for customer: cus_XXX
[Sync Customer Subscription] Fetching subscriptions from Stripe...
[Sync Customer Subscription] Found 2 subscriptions
[Sync Customer Subscription] Found 1 active subscriptions
[Sync Customer Subscription] Most recent active subscription: sub_XXX
[Sync Customer Subscription] Product ID: prod_XXX
[Sync Customer Subscription] Mapped to plan_id: basic
[Sync Customer Subscription] Profile updated successfully
[Sync Customer Subscription] Cache invalidated for customer: cus_XXX
```

### Logs do Webhook

```bash
# Procure por: "[Supabase Webhook]" ou "[Profile Webhook]"

[Supabase Webhook] Request received
[Supabase Webhook] Event type: UPDATE
[Supabase Webhook] Table: profiles
[Profile Webhook] Processing profile change
[Profile Webhook] Profile ID: user-id
[Profile Webhook] Customer ID: cus_XXX
[Profile Webhook] Triggering subscription sync...
[Profile Webhook] ✅ Subscription synced successfully
```

### Verificar Trigger no Banco

```sql
-- Ver se o trigger está ativo
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'profiles'::regclass
AND tgname = 'trigger_sync_stripe_subscription';

-- Ver notificações (se usando listener)
LISTEN sync_stripe_subscription;
-- Em outro terminal, faça um UPDATE no profiles
-- Deve ver: Asynchronous notification "sync_stripe_subscription" received
```

## 🛠️ Troubleshooting

### Webhook Não Está Sendo Chamado

1. Verifique se o webhook está ativo no Supabase Dashboard
2. Verifique a URL do webhook (deve ser acessível publicamente)
3. Teste com ngrok em desenvolvimento:
   ```bash
   ngrok http 3000
   # Use a URL do ngrok no webhook do Supabase
   ```

### Endpoint Retorna 404

1. Verifique se o arquivo existe: `app/api/webhooks/supabase/route.ts`
2. Reinicie o servidor Next.js
3. Verifique a URL completa: `https://your-app.com/api/webhooks/supabase`

### Subscription Não Está Sincronizando

1. Verifique os logs do endpoint
2. Verifique se `stripe_customer_id` está correto no profile
3. Verifique se há subscriptions ativas no Stripe:
   ```bash
   stripe subscriptions list --customer cus_XXX
   ```
4. Verifique se a tabela `plans` tem o `stripe_product_id` correto

### Cache Não Está Sendo Invalidado

1. Verifique se Redis está rodando
2. Verifique logs de invalidação de cache
3. Force invalidação manual:
   ```typescript
   import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';
   await invalidateSubscriptionCacheByCustomerId('cus_XXX');
   ```

## 📝 Manutenção

### Monitorar Sincronizações

Adicione métricas ao endpoint:

```typescript
// Exemplo com logging estruturado
console.log(
  JSON.stringify({
    event: 'subscription_sync',
    customer_id: customerId,
    profile_id: profileId,
    old_subscription: oldSubscriptionId,
    new_subscription: newSubscriptionId,
    timestamp: new Date().toISOString(),
  })
);
```

### Alertas Recomendados

1. **Sync Failures**: Alertar quando sync falha por mais de 3 vezes
2. **Webhook Downtime**: Alertar se webhook não responde
3. **Inconsistent Data**: Verificar periodicamente se há perfis com subscription_id inválido

## 🔐 Segurança

### Webhook Secret

- Use um secret forte e aleatório
- Rotacione o secret periodicamente
- Nunca commite o secret no git
- Use diferentes secrets para dev/staging/production

### Rate Limiting

Considere adicionar rate limiting ao webhook:

```typescript
// Exemplo com upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests por minuto
});
```

## 📚 Referências

- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Stripe Subscriptions API](https://stripe.com/docs/api/subscriptions)
- [PostgreSQL NOTIFY/LISTEN](https://www.postgresql.org/docs/current/sql-notify.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## ✅ Checklist de Implementação

- [ ] Endpoint `/api/stripe/sync-customer-subscription` criado
- [ ] Endpoint `/api/webhooks/supabase` criado
- [ ] Trigger SQL aplicado no banco de dados
- [ ] Webhook configurado no Supabase Dashboard
- [ ] Variável `SUPABASE_WEBHOOK_SECRET` adicionada
- [ ] Testes realizados com sucesso
- [ ] Logs verificados
- [ ] Documentação revisada
- [ ] Deploy em produção

## 🎯 Benefícios

✅ **Consistência**: Profile sempre reflete subscription ativa mais recente
✅ **Automático**: Nenhuma intervenção manual necessária
✅ **Resiliente**: Funciona mesmo com múltiplas subscriptions
✅ **Performático**: Cache é invalidado automaticamente
✅ **Seguro**: Webhook protegido com secret
✅ **Escalável**: Suporta milhares de webhooks por minuto
✅ **Debugável**: Logs detalhados em cada etapa

---

**Data de Criação**: 2025-10-14
**Versão**: 1.0.0
**Autor**: Prova Fácil Team
