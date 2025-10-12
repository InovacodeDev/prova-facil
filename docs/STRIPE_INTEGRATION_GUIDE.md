# Guia de Integração com Stripe

Este guia explica como configurar e usar a integração completa com o Stripe para gerenciar planos e pagamentos na plataforma Prova Fácil.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [Criação de Produtos no Stripe](#criação-de-produtos-no-stripe)
5. [Configuração de Webhooks](#configuração-de-webhooks)
6. [Migração do Banco de Dados](#migração-do-banco-de-dados)
7. [Testando Localmente](#testando-localmente)
8. [Deploy em Produção](#deploy-em-produção)
9. [Referência de API](#referência-de-api)

---

## 🎯 Visão Geral

A integração com o Stripe permite:

- ✅ Gerenciamento de assinaturas mensais e anuais
- ✅ Sincronização automática de status de pagamento
- ✅ Portal do cliente para autoatendimento
- ✅ Suporte a cupons e promoções
- ✅ Webhooks para atualizações em tempo real
- ✅ Preços dinâmicos vindos diretamente do Stripe

---

## 🔧 Pré-requisitos

### 1. Conta Stripe

- Crie uma conta em [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
- Ative o modo de teste para desenvolvimento

### 2. Stripe CLI (para testes locais)

```bash
# macOS (usando Homebrew)
brew install stripe/stripe-cli/stripe

# Login na sua conta
stripe login
```

### 3. Dependências do Projeto

As dependências já estão instaladas:

- `stripe` (server-side SDK)
- `@stripe/stripe-js` (client-side SDK)

---

## ⚙️ Configuração Inicial

### 1. Obter Chaves da API

Acesse [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

Você precisará de:

- **Publishable key** (começa com `pk_test_`)
- **Secret key** (começa com `sk_test_`)

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Webhook Secret (obteremos isso depois)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## 🛍️ Criação de Produtos no Stripe

### Estrutura dos Planos

Crie 5 produtos no Stripe Dashboard correspondendo aos nossos planos:

| Plano      | Questões/Mês | Preço Mensal | Preço Anual |
| ---------- | ------------ | ------------ | ----------- |
| Starter    | 25           | R$ 0         | R$ 0        |
| Basic      | 50           | R$ 29,90     | R$ 269,10   |
| Essentials | 75           | R$ 49,90     | R$ 449,10   |
| Plus       | 100          | R$ 79,90     | R$ 719,10   |
| Advanced   | 150          | R$ 119,90    | R$ 1.079,10 |

### Passo a Passo para Criar Produtos

#### 1. Acessar o Dashboard

Vá para [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)

#### 2. Criar Produto "Starter"

```
Nome: Prova Fácil - Starter
Descrição: Plano gratuito para testar a plataforma

Metadata (importante para funcionalidades):
  features: ["Até 25 questões/mês", "1 tipo de questão", "Upload TXT/DOCX (10MB)", "Entrada de texto direto", "Suporte por email"]
  aiLevel: IA Básica
  questionsPerMonth: 25
  highlighted: false

Preço: R$ 0,00
```

**⚠️ Copie o Product ID** (começa com `prod_`)

#### 3. Criar Produto "Basic"

```
Nome: Prova Fácil - Basic
Descrição: Perfeito para 2-3 turmas pequenas

Metadata:
  features: ["Até 50 questões/mês", "Até 2 tipos de questões", "Upload TXT/DOCX (20MB)", "Entrada de texto direto", "Suporte prioritário 24h"]
  aiLevel: IA Básica
  questionsPerMonth: 50
  highlighted: false

Preços:
  - Mensal: R$ 29,90 (recurring: month)
  - Anual: R$ 269,10 (recurring: year)
```

**⚠️ Copie o Product ID**

#### 4. Criar Produto "Essentials"

```
Nome: Prova Fácil - Essentials
Descrição: Ótimo para 4-5 turmas regulares

Metadata:
  features: ["Até 75 questões/mês", "Até 3 tipos de questões", "Upload PDF/DOCX/TXT + links (30MB)", "IA avançada", "Suporte prioritário email e WhatsApp"]
  aiLevel: IA Avançada
  questionsPerMonth: 75
  highlighted: false

Preços:
  - Mensal: R$ 49,90
  - Anual: R$ 449,10
```

**⚠️ Copie o Product ID**

#### 5. Criar Produto "Plus" (Recomendado)

```
Nome: Prova Fácil - Plus
Descrição: Completo para múltiplas turmas

Metadata:
  features: ["Até 100 questões/mês", "Todos os tipos de questões", "Upload ilimitado (50MB)", "IA avançada", "Suporte VIP prioritário"]
  aiLevel: IA Avançada
  questionsPerMonth: 100
  highlighted: true  ⬅️ Este plano será destacado

Preços:
  - Mensal: R$ 79,90
  - Anual: R$ 719,10
```

**⚠️ Copie o Product ID**

#### 6. Criar Produto "Advanced"

```
Nome: Prova Fácil - Advanced
Descrição: Uso ilimitado para grandes instituições

Metadata:
  features: ["150 questões/mês", "Todos os tipos de questões", "Upload ilimitado (100MB)", "IA avançada premium", "Suporte VIP dedicado", "Relatórios avançados"]
  aiLevel: IA Premium
  questionsPerMonth: 150
  highlighted: false

Preços:
  - Mensal: R$ 119,90
  - Anual: R$ 1.079,10
```

**⚠️ Copie o Product ID**

### 3. Adicionar Product IDs ao `.env.local`

```bash
STRIPE_PRODUCT_STARTER=prod_xxxxxxxxxxxxx
STRIPE_PRODUCT_BASIC=prod_xxxxxxxxxxxxx
STRIPE_PRODUCT_ESSENTIALS=prod_xxxxxxxxxxxxx
STRIPE_PRODUCT_PLUS=prod_xxxxxxxxxxxxx
STRIPE_PRODUCT_ADVANCED=prod_xxxxxxxxxxxxx
```

---

## 🔗 Configuração de Webhooks

### Por que Webhooks são Necessários?

Webhooks mantêm o banco de dados sincronizado com o Stripe quando:

- Uma assinatura é criada
- Uma assinatura é atualizada
- Uma assinatura é cancelada
- Um pagamento falha

### Configuração em Desenvolvimento (Local)

#### 1. Usar o Stripe CLI

```bash
# Iniciar forwarding de webhooks
stripe listen --forward-to localhost:8800/api/stripe/webhook
```

Isso retornará um **webhook signing secret**. Copie-o para `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### 2. Eventos Que Precisamos Escutar

O webhook já está configurado para escutar:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

### Configuração em Produção

#### 1. Acessar o Dashboard de Webhooks

[https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

#### 2. Adicionar Endpoint

```
URL: https://seu-dominio.com/api/stripe/webhook
Eventos: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, customer.subscription.trial_will_end
```

#### 3. Copiar o Signing Secret

Adicione ao `.env.local` de produção:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 💾 Migração do Banco de Dados

Execute a migração para adicionar os campos do Stripe ao perfil:

```bash
# Conectar ao Supabase e executar a migração
psql $DATABASE_URL < db/migrations/0001_add_stripe_fields_to_profiles.sql
```

Ou use o Supabase Dashboard:

1. Vá para SQL Editor
2. Cole o conteúdo de `db/migrations/0001_add_stripe_fields_to_profiles.sql`
3. Execute

### Campos Adicionados:

- `stripe_customer_id`: ID do cliente no Stripe
- `stripe_subscription_id`: ID da assinatura ativa

---

## 🧪 Testando Localmente

### 1. Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

### 2. Iniciar o Webhook Listener

```bash
# Em outro terminal
stripe listen --forward-to localhost:8800/api/stripe/webhook
```

### 3. Testar o Fluxo de Checkout

#### a) Acessar a página de planos

```
http://localhost:8800/plan
```

#### b) Selecionar um plano e clicar em "Assinar"

#### c) Usar cartões de teste do Stripe

**Cartão de sucesso:**

```
Número: 4242 4242 4242 4242
Validade: Qualquer data futura
CVC: Qualquer 3 dígitos
CEP: Qualquer
```

**Cartão que requer autenticação:**

```
Número: 4000 0025 0000 3155
```

**Cartão que falha:**

```
Número: 4000 0000 0000 0002
```

#### d) Verificar Logs

```bash
# Terminal do servidor
# Deve mostrar logs do webhook sendo processado

# Terminal do Stripe CLI
# Deve mostrar eventos sendo enviados
```

### 4. Verificar Portal de Cobrança

Após criar uma assinatura, teste o portal:

```
http://localhost:8800/plan
# Clique em "Gerenciar Assinatura"
```

---

## 🚀 Deploy em Produção

### Checklist Pré-Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Produtos criados no Stripe (modo live)
- [ ] Webhook configurado (URL de produção)
- [ ] Migração do banco executada
- [ ] Testado em modo teste
- [ ] Stripe Billing Portal ativado

### 1. Mudar para Modo Live

No Stripe Dashboard, alterne de "Test mode" para "Live mode"

### 2. Recriar Produtos

Produtos de teste não são copiados automaticamente. Recrie-os em modo live.

### 3. Atualizar Variáveis de Ambiente

Use as chaves **live** (começam com `pk_live_` e `sk_live_`)

### 4. Configurar Webhook de Produção

```
URL: https://prova-facil.com/api/stripe/webhook
```

### 5. Testar com Pequeno Valor

Faça um teste real com um plano de menor valor antes do lançamento oficial.

---

## 📚 Referência de API

### Endpoints Criados

#### `POST /api/stripe/create-checkout`

Cria uma sessão de checkout do Stripe.

**Body:**

```json
{
  "priceId": "price_xxxxx"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
}
```

#### `POST /api/stripe/create-portal`

Cria uma sessão do portal de cobrança.

**Response:**

```json
{
  "url": "https://billing.stripe.com/p/session/xxxxx"
}
```

#### `GET /api/stripe/products`

Retorna todos os produtos ativos com preços.

**Response:**

```json
{
  "products": [
    {
      "id": "prod_xxxxx",
      "name": "Prova Fácil - Basic",
      "description": "Perfeito para 2-3 turmas pequenas",
      "features": ["50 questões/mês", "..."],
      "aiLevel": "IA Básica",
      "questionsPerMonth": 50,
      "internalPlanId": "basic",
      "prices": {
        "monthly": { "id": "price_xxxxx", "unit_amount": 2990 },
        "yearly": { "id": "price_xxxxx", "unit_amount": 26910 }
      }
    }
  ]
}
```

#### `POST /api/stripe/webhook`

Processa eventos do Stripe (webhooks).

**Eventos tratados:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

---

## 🔒 Segurança

### Best Practices Implementadas

✅ Webhook signature verification
✅ API keys nunca expostas no cliente
✅ Autenticação obrigatória em endpoints sensíveis
✅ Validação de dados de entrada
✅ Customer ID único por usuário

### Importante

- **NUNCA** commite `.env.local` no Git
- **SEMPRE** use HTTPS em produção
- **SEMPRE** valide webhooks

---

## 🐛 Troubleshooting

### Webhook não está funcionando

```bash
# Verifique se o Stripe CLI está rodando
stripe listen --forward-to localhost:8800/api/stripe/webhook

# Verifique os logs do servidor
# Deve aparecer "Webhook received: customer.subscription.created"
```

### Erro "Invalid signature"

- Certifique-se de que `STRIPE_WEBHOOK_SECRET` está correto
- No Stripe CLI, use o secret fornecido quando executou `stripe listen`

### Produtos não aparecem

- Verifique se os produtos estão ativos no Stripe
- Verifique se os `STRIPE_PRODUCT_*` estão corretos no `.env.local`
- Teste a API: `GET /api/stripe/products`

### Checkout não redireciona

- Verifique se `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está correto
- Abra o console do navegador para ver erros JavaScript

---

## 📝 Metadata dos Produtos

Para que a integração funcione corretamente, cada produto no Stripe DEVE ter este metadata:

```json
{
  "features": "[\"Feature 1\", \"Feature 2\", \"Feature 3\"]",
  "aiLevel": "IA Básica",
  "questionsPerMonth": "50",
  "highlighted": "false"
}
```

**Importante:**

- `features` deve ser um JSON stringificado (array de strings)
- `questionsPerMonth` deve ser string com número
- `highlighted` deve ser "true" ou "false" (string)

---

## 🎓 Próximos Passos

Após configurar o Stripe:

1. ✅ Testar localmente com cartões de teste
2. ✅ Verificar sincronização de status no banco
3. ✅ Testar portal de cobrança
4. ✅ Configurar notificações por email (opcional)
5. ✅ Deploy em produção
6. ✅ Monitorar webhooks no Dashboard do Stripe

---

## 🆘 Suporte

- [Documentação Oficial do Stripe](https://docs.stripe.com)
- [Stripe API Reference](https://docs.stripe.com/api)
- [Stripe Webhook Events](https://docs.stripe.com/api/events/types)

---

**✨ A integração está completa e pronta para uso!**
