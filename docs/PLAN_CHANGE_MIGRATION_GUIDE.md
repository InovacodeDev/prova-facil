# 🚀 Guia Rápido de Migração - Sistema de Mudança de Planos

## Passo a Passo para Deploy

### 1. Aplicar Migration no Banco de Dados

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Navegue até **SQL Editor**
3. Cole o seguinte SQL:

```sql
-- Migration: Adicionar campos de mudança de plano agendada
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "pending_plan_id" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "pending_plan_change_at" timestamp with time zone;

-- Criar índice para performance em queries de mudanças agendadas
CREATE INDEX IF NOT EXISTS "profiles_pending_plan_idx" ON "profiles" ("pending_plan_id", "pending_plan_change_at");
```

4. Clique em **Run**
5. Verifique o sucesso: "Success. No rows returned"

#### Opção B: Via arquivo de migration

```bash
# Se você usa Supabase CLI
cd /Users/titorm/Documents/prova-facil
cat db/migrations/0003_messy_the_enforcers.sql | supabase db execute
```

### 2. Verificar Variáveis de Ambiente

Certifique-se de que `.env.local` contém todas as chaves necessárias:

```bash
# Stripe - Keys principais
STRIPE_SECRET_KEY=sk_test_...              # ou sk_live_... para produção
STRIPE_PUBLISHABLE_KEY=pk_test_...         # ou pk_live_... para produção
STRIPE_WEBHOOK_SECRET=whsec_...            # Copiar do Stripe Dashboard

# Stripe - Price IDs (Mensal)
STRIPE_PRICE_ID_BASIC_MONTHLY=price_...
STRIPE_PRICE_ID_ESSENTIALS_MONTHLY=price_...
STRIPE_PRICE_ID_PLUS_MONTHLY=price_...
STRIPE_PRICE_ID_ADVANCED_MONTHLY=price_...

# Stripe - Price IDs (Anual)
STRIPE_PRICE_ID_BASIC_ANNUAL=price_...
STRIPE_PRICE_ID_ESSENTIALS_ANNUAL=price_...
STRIPE_PRICE_ID_PLUS_ANNUAL=price_...
STRIPE_PRICE_ID_ADVANCED_ANNUAL=price_...
```

### 3. Configurar Webhook no Stripe

#### Para Desenvolvimento Local:

```bash
# Instalar Stripe CLI (se ainda não tiver)
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Encaminhar webhooks para localhost
stripe listen --forward-to localhost:8800/api/stripe/webhook

# Copie o webhook signing secret que aparece (whsec_...)
# e adicione em .env.local como STRIPE_WEBHOOK_SECRET
```

#### Para Produção:

1. Acesse [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/stripe/webhook`
   - **Description**: "Prova Fácil - Webhook Handler"
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated` ← **CRÍTICO**
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Clique em **Add endpoint**
5. Copie o **Signing secret** (whsec\_...)
6. Adicione em `.env.local` ou variáveis de ambiente de produção

### 4. Testar Localmente

```bash
# Terminal 1: Iniciar o servidor
cd /Users/titorm/Documents/prova-facil
pnpm dev

# Terminal 2: Encaminhar webhooks (se testando pagamentos)
stripe listen --forward-to localhost:8800/api/stripe/webhook

# Acessar
# http://localhost:8800
```

#### Cenário de Teste Rápido:

1. Faça login ou crie uma conta
2. Vá para `/plan`
3. Assine o plano **Essentials** (use cartão de teste: `4242 4242 4242 4242`)
4. Após confirmação, clique em **Selecionar Plano** no card **Plus**
5. Verifique:
   - [ ] Dialog de upgrade abre
   - [ ] Preview de proration é carregado e exibe valores
   - [ ] Você pode escolher entre "Fazer upgrade agora" ou "Atualizar na próxima renovação"
6. Escolha "Fazer upgrade agora" e confirme
7. Verifique:
   - [ ] Toast de sucesso aparece
   - [ ] Plano muda para Plus
   - [ ] No Stripe Dashboard, subscription foi atualizada

### 5. Deploy para Produção

#### Vercel (Recomendado para Next.js)

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Deploy
cd /Users/titorm/Documents/prova-facil
vercel --prod

# Configurar variáveis de ambiente na Vercel Dashboard
# Settings → Environment Variables
# Adicionar todas as variáveis de STRIPE_* listadas acima
```

#### Variáveis de Ambiente na Vercel:

1. Acesse o projeto na Vercel Dashboard
2. Settings → Environment Variables
3. Adicione todas as variáveis listadas na seção 2
4. **IMPORTANTE**: Use as chaves de **produção** (`sk_live_`, `pk_live_`)

### 6. Monitoramento Pós-Deploy

#### Logs de Webhook

```bash
# Ver logs em tempo real (desenvolvimento)
stripe listen --forward-to https://seu-dominio.com/api/stripe/webhook

# Ver logs históricos no Stripe Dashboard
# https://dashboard.stripe.com/webhooks → Seu webhook → Attempts
```

#### Verificar Mudanças Agendadas

```sql
-- No SQL Editor do Supabase
SELECT
  user_id,
  plan,
  pending_plan_id,
  pending_plan_change_at,
  plan_expire_at
FROM profiles
WHERE pending_plan_id IS NOT NULL
ORDER BY pending_plan_change_at ASC;
```

---

## ✅ Checklist de Verificação

Antes de considerar o deploy completo, verifique:

### Banco de Dados

- [ ] Migration 0003 aplicada com sucesso
- [ ] Colunas `pending_plan_id` e `pending_plan_change_at` existem em `profiles`
- [ ] Índice criado (opcional mas recomendado)

### Stripe

- [ ] Webhook configurado com URL de produção
- [ ] Eventos corretos selecionados (especialmente `customer.subscription.updated`)
- [ ] Signing secret copiado para variáveis de ambiente
- [ ] Todos os Price IDs (8 no total) configurados

### Código

- [ ] Arquivo `.env.local` completo (desenvolvimento)
- [ ] Variáveis de ambiente configuradas na plataforma de hosting (produção)
- [ ] Build passa sem erros: `pnpm build`
- [ ] Linting passa: `pnpm lint`

### Testes Manuais

- [ ] Upgrade imediato funciona e cobra proration correta
- [ ] Upgrade agendado salva pending_plan_id e não cobra nada
- [ ] Downgrade é sempre agendado
- [ ] Banner de mudança agendada aparece corretamente
- [ ] Cancelar mudança agendada funciona
- [ ] Webhook processa mudanças agendadas na renovação

---

## 🔧 Troubleshooting

### Problema: Webhook retorna 400 "Assinatura inválida"

**Causa**: `STRIPE_WEBHOOK_SECRET` incorreto ou não configurado

**Solução**:

1. Copie o signing secret correto do Stripe Dashboard
2. Atualize a variável de ambiente
3. Reinicie o servidor/redeploy

### Problema: Proration não é calculada

**Causa**: Dados de `plan_expire_at` ausentes

**Solução**:

```sql
-- Verificar se plan_expire_at está populado
SELECT user_id, plan, plan_expire_at FROM profiles WHERE plan_expire_at IS NULL;

-- Se necessário, popular manualmente baseado nas subscriptions
UPDATE profiles p
SET plan_expire_at = s.current_period_end
FROM subscriptions s
WHERE p.user_id = s.user_id AND p.plan_expire_at IS NULL;
```

### Problema: Mudança agendada não é aplicada

**Causa**: Webhook não está recebendo `customer.subscription.updated`

**Solução**:

1. Verificar no Stripe Dashboard → Webhooks → Attempts
2. Confirmar que o evento está sendo enviado
3. Verificar logs do servidor para erros
4. Testar manualmente: `stripe trigger customer.subscription.updated`

---

## 📚 Documentação Relacionada

- **Guia Completo**: `docs/PLAN_CHANGE_GUIDE.md`
- **Resumo**: `docs/PLAN_CHANGE_COMPLETE_SUMMARY.md`
- **Setup Stripe Geral**: `docs/STRIPE_INTEGRATION_GUIDE.md`

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do webhook no Stripe Dashboard
2. Verifique os logs do servidor (Vercel Logs ou terminal local)
3. Consulte `docs/PLAN_CHANGE_GUIDE.md` seção "Troubleshooting"
4. Verifique que a migration foi aplicada: `SELECT * FROM profiles LIMIT 1;` deve mostrar as novas colunas

**Status da implementação**: ✅ Completo e testado
**Última atualização**: Janeiro 2025
