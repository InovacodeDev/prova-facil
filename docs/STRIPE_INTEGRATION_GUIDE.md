# 🔐 Guia de Integração do Stripe

Este documento detalha a integração completa do gateway de pagamento Stripe no Prova Fácil.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Estrutura do Sistema](#estrutura-do-sistema)
4. [Fluxo de Pagamento](#fluxo-de-pagamento)
5. [Configuração de Webhooks](#configuração-de-webhooks)
6. [Testes](#testes)
7. [Deploy em Produção](#deploy-em-produção)

---

## 🎯 Visão Geral

A integração com o Stripe permite que usuários assinem planos pagos (Basic, Essentials, Plus e Advanced) através de um fluxo de checkout seguro e type-safe.

### Características Implementadas

- ✅ Checkout modal integrado na página de planos
- ✅ Suporte a planos mensais e anuais
- ✅ Webhooks para sincronização automática de status
- ✅ Gestão de assinaturas (criação, atualização, cancelamento)
- ✅ Histórico de pagamentos
- ✅ Redirecionamento automático para planos após signup
- ✅ Type-safety completo com TypeScript

---

## ⚙️ Configuração Inicial

### 1. Criar Conta no Stripe

1. Acesse [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crie uma conta (use o modo de teste inicialmente)
3. Acesse o Dashboard

### 2. Obter Chaves de API

No [Dashboard do Stripe](https://dashboard.stripe.com/apikeys):

1. **Chave Publicável** (começa com `pk_test_`): Use no frontend
2. **Chave Secreta** (começa com `sk_test_`): Use no backend (NUNCA exponha no cliente)

### 3. Criar Produtos e Preços

No [Dashboard de Produtos](https://dashboard.stripe.com/products):

Para cada plano (Basic, Essentials, Plus, Advanced), crie:

1. **Produto**: Nome do plano, descrição
2. **Preço Mensal**: Modelo de cobrança recorrente mensal
3. **Preço Anual**: Modelo de cobrança recorrente anual

Copie os Price IDs (começam com `price_`) de cada preço criado.

### 4. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_seu_secret_key_aqui
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_seu_publishable_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui

# Stripe Price IDs
STRIPE_PRICE_ID_BASIC_MONTHLY=price_1234567890
STRIPE_PRICE_ID_BASIC_ANNUAL=price_0987654321
STRIPE_PRICE_ID_ESSENTIALS_MONTHLY=price_1111111111
STRIPE_PRICE_ID_ESSENTIALS_ANNUAL=price_2222222222
STRIPE_PRICE_ID_PLUS_MONTHLY=price_3333333333
STRIPE_PRICE_ID_PLUS_ANNUAL=price_4444444444
STRIPE_PRICE_ID_ADVANCED_MONTHLY=price_5555555555
STRIPE_PRICE_ID_ADVANCED_ANNUAL=price_6666666666

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:8800
```

### 5. Executar Migração do Banco de Dados

As tabelas `subscriptions` e `payments` foram adicionadas ao schema. Execute:

```bash
pnpm db:gen
# Em seguida, aplique as migrações no Supabase
```

---

## 🏗️ Estrutura do Sistema

### Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│                                                  │
│  ┌────────────────┐      ┌──────────────────┐  │
│  │  Plan Page     │─────▶│ CheckoutModal    │  │
│  └────────────────┘      └──────────────────┘  │
│                                 │                │
└─────────────────────────────────┼────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  API: Checkout   │
                        └──────────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │    Stripe    │
                          │   Checkout   │
                          └──────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │   Webhook    │
                          └──────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  Supabase DB     │
                        │  - subscriptions │
                        │  - payments      │
                        │  - profiles      │
                        └──────────────────┘
```

### Arquivos Criados/Modificados

#### Novos Arquivos

1. **`lib/stripe/stripe.service.ts`**

   - Serviço centralizado para operações Stripe
   - Funções: criar checkout, gerenciar assinaturas, webhooks

2. **`app/api/stripe/create-checkout-session/route.ts`**

   - API route para criar sessão de checkout
   - Validação com Zod
   - Autenticação obrigatória

3. **`app/api/stripe/webhook/route.ts`**

   - API route para processar webhooks do Stripe
   - Eventos: checkout.session.completed, subscription._, invoice._
   - Sincronização automática com banco de dados

4. **`components/CheckoutModal.tsx`**
   - Modal React para exibir detalhes do plano
   - Botão para iniciar checkout
   - Loading states e tratamento de erros

#### Arquivos Modificados

1. **`db/schema.ts`**

   - Adicionadas tabelas: `subscriptions`, `payments`
   - Enum: `subscriptionStatusEnum`
   - Relações com `profiles`

2. **`app/plan/page.tsx`**

   - Integração com `CheckoutModal`
   - Suporte a query params para abrir modal automaticamente
   - Tratamento de sucesso/cancelamento de checkout

3. **`app/auth/page.tsx`**

   - Redirecionamento para `/plan` após signup
   - Query params para abrir modal automaticamente

4. **`app/auth/callback/route.ts`**

   - Redirecionamento para `/plan` para novos usuários
   - Modal aberto automaticamente

5. **`.env.example`**
   - Adicionadas variáveis do Stripe

---

## 💳 Fluxo de Pagamento

### 1. Usuário Seleciona Plano Pago

Na página `/plan`, ao clicar em um plano pago (não Starter):

```typescript
const handleSelectPlan = (planId: string) => {
  const plan = plans.find((p) => p.id === planId);
  setSelectedPlan(plan);
  setCheckoutModalOpen(true);
};
```

### 2. Modal de Checkout Exibido

O `CheckoutModal` exibe:

- Nome e descrição do plano
- Preço (mensal ou anual)
- Lista de features
- Informações de segurança
- Botão "Ir para pagamento"

### 3. Chamada à API de Checkout

```typescript
const response = await fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  body: JSON.stringify({
    planId: 'essentials',
    billingPeriod: 'monthly',
  }),
});

const { url } = await response.json();
window.location.href = url; // Redireciona para Stripe Checkout
```

### 4. Checkout no Stripe

- Usuário preenche dados de pagamento
- Stripe processa o pagamento de forma segura
- Redireciona de volta para o app

### 5. Webhooks Sincronizam Dados

Após pagamento bem-sucedido, o Stripe envia webhooks:

- `checkout.session.completed`: Checkout finalizado
- `customer.subscription.created`: Assinatura criada
- `invoice.payment_succeeded`: Pagamento processado

O webhook handler:

1. Verifica assinatura do webhook (segurança)
2. Cria/atualiza registro em `subscriptions`
3. Registra pagamento em `payments`
4. Atualiza `profiles.plan` e `profiles.renew_status`

### 6. Usuário Redirecionado

URLs de redirecionamento:

- **Sucesso**: `/plan?success=true&session_id={CHECKOUT_SESSION_ID}`
- **Cancelamento**: `/plan?canceled=true`

---

## 🔔 Configuração de Webhooks

### Em Desenvolvimento (Local)

Para testar webhooks localmente, use o Stripe CLI:

1. **Instalar Stripe CLI**:

   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login**:

   ```bash
   stripe login
   ```

3. **Encaminhar webhooks para localhost**:

   ```bash
   stripe listen --forward-to localhost:8800/api/stripe/webhook
   ```

4. **Copiar webhook secret**:
   O CLI exibirá algo como `whsec_...`. Adicione ao `.env.local` como `STRIPE_WEBHOOK_SECRET`.

### Em Produção

1. Acesse [Webhooks no Dashboard](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o "Signing secret" e adicione como `STRIPE_WEBHOOK_SECRET` no ambiente de produção

---

## 🧪 Testes

### Testes Manuais

1. **Criar conta**: Verifique redirecionamento para `/plan` com modal aberto
2. **Selecionar plano pago**: Modal deve abrir corretamente
3. **Checkout**: Use [cartão de teste](https://stripe.com/docs/testing#cards):
   - Sucesso: `4242 4242 4242 4242`
   - Falha: `4000 0000 0000 0002`
4. **Webhooks**: Verifique logs no Stripe CLI
5. **Banco de dados**: Confirme criação de registros em `subscriptions` e `payments`

### Testes com Stripe CLI

```bash
# Simular evento de checkout concluído
stripe trigger checkout.session.completed

# Simular criação de assinatura
stripe trigger customer.subscription.created

# Simular pagamento bem-sucedido
stripe trigger invoice.payment_succeeded
```

---

## 🚀 Deploy em Produção

### Checklist de Produção

- [ ] Trocar chaves de teste (`sk_test_`, `pk_test_`) por chaves de produção (`sk_live_`, `pk_live_`)
- [ ] Criar produtos e preços no modo de produção do Stripe
- [ ] Atualizar Price IDs nas variáveis de ambiente de produção
- [ ] Configurar webhook endpoint no modo de produção
- [ ] Atualizar `STRIPE_WEBHOOK_SECRET` com o secret de produção
- [ ] Testar fluxo completo em ambiente de staging antes de ir para produção
- [ ] Configurar alertas para falhas de webhook
- [ ] Revisar políticas de cancelamento e reembolso

### Variáveis de Ambiente (Produção)

No Vercel ou plataforma de deploy:

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC_MONTHLY=price_live_...
# ... todos os outros price IDs
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

---

## 🛡️ Segurança

### Boas Práticas Implementadas

1. **Validação de Webhook**: Verificação de assinatura obrigatória
2. **Autenticação**: Rotas de checkout requerem usuário autenticado
3. **Validação de Input**: Uso de Zod para validar payloads
4. **Secrets nunca expostos**: Chaves secretas apenas no servidor
5. **Type Safety**: TypeScript estrito em toda a integração
6. **Error Logging**: Erros registrados em `error_logs`

### Nunca Faça

- ❌ Expor `STRIPE_SECRET_KEY` no código cliente
- ❌ Processar webhooks sem validação de assinatura
- ❌ Confiar em dados do cliente para valores de pagamento
- ❌ Usar a mesma conta Stripe para teste e produção

---

## 📚 Recursos Adicionais

- [Documentação oficial do Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)

---

## 🐛 Troubleshooting

### Webhook não está sendo chamado

1. Verifique se o Stripe CLI está rodando (`stripe listen`)
2. Confirme que a URL está correta
3. Verifique logs no Dashboard do Stripe > Webhooks > Tentativas

### Erro "Invalid signature"

1. Confirme que `STRIPE_WEBHOOK_SECRET` está correto
2. Certifique-se de que o body não foi parseado antes da verificação

### Assinatura não aparece no banco

1. Verifique logs do webhook
2. Confirme que os eventos estão configurados no Dashboard
3. Verifique se há erros em `error_logs` no banco

### Checkout redireciona mas nada acontece

1. Verifique se os webhooks estão configurados
2. Confirme que os Price IDs estão corretos
3. Revise logs da API route de checkout

---

**✅ Integração Completa!** O sistema está pronto para processar pagamentos de forma segura e escalável.
