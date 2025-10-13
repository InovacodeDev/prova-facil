# Auto-Criação de Customer e Plano Starter no Cadastro

## 📋 Resumo

Ao criar uma nova conta, o sistema automaticamente:

1. ✅ Cria o perfil no banco de dados
2. ✅ Cria um **Customer** no Stripe
3. ✅ Cria uma **Subscription gratuita** do plano **Starter**
4. ✅ Atualiza o perfil com os IDs do Stripe (`stripe_customer_id` e `stripe_subscription_id`)

## 🎯 Objetivo

Garantir que todos os novos usuários já comecem com:

- Uma conta no Stripe vinculada
- O plano Starter ativo (gratuito, sem necessidade de pagamento)
- Acesso imediato às funcionalidades básicas da plataforma

## 🔄 Fluxo do Cadastro

```
┌─────────────────────────────────┐
│  1. Usuário preenche formulário │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  2. Supabase Auth cria usuário  │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  3. Cria perfil no banco        │
│     - plan: 'starter'           │
│     - renew_status: 'none'      │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  4. API: create-starter-        │
│     subscription                │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
┌──────────┐  ┌──────────────┐
│  Stripe  │  │   Database   │
│  Customer│  │   Update     │
└──────────┘  └──────────────┘
      │             │
      ↓             ↓
┌──────────────────────────────────┐
│  Stripe Subscription (Starter)   │
│  - Price: R$ 0,00                │
│  - Status: active                │
└──────────┬───────────────────────┘
           │
           ↓
┌──────────────────────────────────┐
│  Profile atualizado com IDs      │
│  - stripe_customer_id            │
│  - stripe_subscription_id        │
└──────────────────────────────────┘
```

## 📁 Arquivos Criados/Modificados

### 1. Novo Endpoint de API

**Arquivo:** `app/api/stripe/create-starter-subscription/route.ts`

**Responsabilidades:**

- Criar Customer no Stripe (se não existir)
- Buscar ou criar Price gratuito para o produto Starter
- Criar Subscription gratuita
- Atualizar profile com os IDs do Stripe
- Invalidar cache de subscription

**Exemplo de chamada:**

```typescript
const response = await fetch('/api/stripe/create-starter-subscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'uuid-do-usuario',
    email: 'usuario@example.com',
    fullName: 'Nome Completo',
  }),
});

const data = await response.json();
// {
//   success: true,
//   customerId: 'cus_xxx',
//   subscriptionId: 'sub_xxx',
//   message: 'Starter subscription created successfully'
// }
```

### 2. Atualização na Página de Auth

**Arquivo:** `app/auth/page.tsx`

**Mudanças no `handleSignUp`:**

```typescript
// ANTES:
// 2. Criar profile
// 3. Redirecionar ou solicitar confirmação

// DEPOIS:
// 2. Criar profile
// 3. Criar customer e subscription Starter ← NOVO
// 4. Redirecionar ou solicitar confirmação
```

**Código adicionado:**

```typescript
// 3. Criar customer no Stripe e subscription do plano Starter (gratuito)
try {
  const response = await fetch('/api/stripe/create-starter-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: signUpData.user.id,
      email: email,
      fullName: fullName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Erro ao criar subscription Starter:', data);
    toast({
      title: 'Aviso',
      description: 'Sua conta foi criada, mas houve um problema ao configurar o plano inicial.',
      variant: 'destructive',
    });
  }
} catch (error) {
  console.error('Erro ao criar subscription Starter:', error);
  // Não bloqueamos o cadastro
}
```

## 🛠️ Configuração Necessária

### 1. Price Gratuito no Stripe

O endpoint cria automaticamente um Price gratuito se não existir:

```javascript
// Propriedades do Price criado automaticamente
{
  product: STRIPE_PRODUCTS.starter,
  unit_amount: 0,           // R$ 0,00 - Gratuito
  currency: 'brl',
  recurring: {
    interval: 'month',
  },
  nickname: 'Starter - Free',
  metadata: {
    plan: 'starter',
  }
}
```

**Você pode criar manualmente no Stripe Dashboard:**

1. Acesse: https://dashboard.stripe.com/products
2. Encontre o produto "Starter"
3. Clique em "Add another price"
4. Configure:
   - **Pricing model:** Standard pricing
   - **Price:** R$ 0,00
   - **Billing period:** Monthly
   - **Price description:** Starter - Free

### 2. Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRODUCT_STARTER=prod_xxx  # ID do produto Starter no Stripe
```

## 🔐 Segurança e Validações

### Verificações Implementadas

1. ✅ **Validação de dados obrigatórios:** `userId` e `email` são obrigatórios
2. ✅ **Verificação de duplicidade:** Se o usuário já tem customer/subscription, não cria novamente
3. ✅ **Tratamento de erros:** Erros são logados mas não bloqueiam o cadastro do usuário
4. ✅ **Invalidação de cache:** Cache de subscription é invalidado após criação

### Comportamento em Caso de Erro

Se houver erro ao criar o customer/subscription:

- ❌ O cadastro do usuário **NÃO é bloqueado**
- ✅ O usuário pode fazer login normalmente
- ⚠️ Um toast de aviso é exibido
- 📝 O erro é logado no console para debug
- 🔄 O usuário pode atualizar o plano posteriormente via interface

## 📊 Exemplo de Dados Criados

### No Stripe Dashboard

**Customer:**

```json
{
  "id": "cus_RabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO",
  "email": "usuario@example.com",
  "name": "João da Silva",
  "metadata": {
    "supabase_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Subscription:**

```json
{
  "id": "sub_1QRabcdefghijklmnopqrstuvwxyz",
  "customer": "cus_RabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO",
  "status": "active",
  "items": [
    {
      "price": {
        "id": "price_1QRabcdefghijklmnopqrstuvwxyz",
        "unit_amount": 0,
        "currency": "brl",
        "recurring": {
          "interval": "month"
        }
      }
    }
  ],
  "metadata": {
    "supabase_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "plan": "starter"
  }
}
```

### No Banco de Dados (profiles)

```sql
-- Antes da chamada da API
user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
full_name: 'João da Silva'
email: 'usuario@example.com'
plan: 'starter'
renew_status: 'none'
stripe_customer_id: NULL
stripe_subscription_id: NULL

-- Depois da chamada da API
user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
full_name: 'João da Silva'
email: 'usuario@example.com'
plan: 'starter'
renew_status: 'none'
stripe_customer_id: 'cus_RabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO'
stripe_subscription_id: 'sub_1QRabcdefghijklmnopqrstuvwxyz'
```

## 🧪 Testes

### Testar o Fluxo Completo

1. **Limpar dados de teste anteriores:**

   ```bash
   # No Stripe Dashboard, deletar customers de teste
   # No Supabase, deletar usuários de teste
   ```

2. **Criar nova conta:**

   - Acesse: http://localhost:3000/auth
   - Preencha o formulário de cadastro
   - Clique em "Criar Conta"

3. **Verificar no Stripe Dashboard:**

   - https://dashboard.stripe.com/customers
   - Verifique se o customer foi criado
   - Clique no customer e verifique a subscription ativa

4. **Verificar no banco de dados:**

   ```sql
   SELECT
     user_id,
     email,
     stripe_customer_id,
     stripe_subscription_id,
     plan
   FROM profiles
   WHERE email = 'seu-email-teste@example.com';
   ```

5. **Verificar no console do navegador:**
   ```javascript
   // Deve mostrar:
   // "Starter subscription criada com sucesso: { ... }"
   ```

### Testar Criação de Duplicatas (Idempotência)

```typescript
// Chamar o endpoint duas vezes com o mesmo userId
const response1 = await fetch('/api/stripe/create-starter-subscription', { ... });
const response2 = await fetch('/api/stripe/create-starter-subscription', { ... });

// Segunda chamada deve retornar:
// {
//   success: true,
//   message: 'Customer and subscription already exist'
// }
```

## 🚀 Deploy

Após fazer deploy, certifique-se de:

1. ✅ Variáveis de ambiente estão configuradas na Vercel/produção
2. ✅ Webhook do Stripe está configurado e funcionando
3. ✅ Price gratuito do Starter existe no Stripe (modo produção)
4. ✅ Testar com um email real em produção

## 🔧 Troubleshooting

### Erro: "Starter product not configured in Stripe"

**Causa:** Variável `STRIPE_PRODUCT_STARTER` não está definida ou está incorreta.

**Solução:**

1. Verifique o ID do produto no Stripe Dashboard
2. Atualize o `.env.local`:
   ```bash
   STRIPE_PRODUCT_STARTER=prod_xxx
   ```
3. Reinicie o servidor

### Erro: "Failed to fetch user profile"

**Causa:** Profile não foi criado antes da chamada da API.

**Solução:** Verificar se o insert do profile não está retornando erro. O código já trata esse caso e tenta criar o profile no login se necessário.

### Subscription não aparece no perfil

**Causa:** Atualização do profile falhou, mas customer e subscription foram criados.

**Solução:** O webhook do Stripe deve atualizar o profile posteriormente. Se não ocorrer:

1. Verificar logs do webhook
2. Reenviar o webhook manualmente no Stripe Dashboard
3. Ou chamar a API novamente (é idempotente)

### Price gratuito não é criado

**Causa:** Permissões insuficientes na API key do Stripe.

**Solução:**

1. Verificar se a `STRIPE_SECRET_KEY` tem permissão de escrita
2. Criar o price manualmente no Stripe Dashboard
3. Verificar logs do servidor para detalhes do erro

## 📝 Notas Importantes

1. **Plano Starter é gratuito:** Não há cobrança, não é necessário método de pagamento
2. **Não bloqueia cadastro:** Se falhar, o usuário ainda consegue se cadastrar
3. **Webhook sincroniza:** O webhook do Stripe mantém os dados sincronizados
4. **Cache é invalidado:** Forçar nova busca dos dados após criação
5. **Idempotente:** Pode ser chamado múltiplas vezes sem criar duplicatas

---

**Implementado por:** AI Agent
**Data:** 2025-10-13
**Status:** ✅ Completo e Funcional
