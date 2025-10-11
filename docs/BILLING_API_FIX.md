# 🔧 Correção: Erro "Neither apiKey nor config.authenticator provided"

## 🐛 Problema Identificado

A página `/billing` (Client Component) estava importando diretamente a função `getSubscriptionData()` do arquivo `lib/stripe/subscription-helper.ts`, que contém:

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});
```

**Por que isso causou erro?**

- Client Components rodam no navegador (browser)
- `process.env.STRIPE_SECRET_KEY` só existe no servidor (Node.js)
- Importar código do servidor no cliente causa erro de runtime
- Além disso, expor a chave secreta no cliente é uma **vulnerabilidade de segurança crítica**

---

## ✅ Solução Implementada

### 1. Criado novo endpoint: `/api/stripe/subscription-data/route.ts`

**Função:** Atua como proxy seguro entre o cliente e a Stripe API.

**Segurança implementada:**

- ✅ Verifica autenticação do usuário
- ✅ Valida ownership (subscription pertence ao usuário)
- ✅ Retorna 403 se tentar acessar dados de outro usuário
- ✅ Mantém STRIPE_SECRET_KEY apenas no servidor

**Request:**

```typescript
GET /api/stripe/subscription-data?subscriptionId=sub_...
```

**Response:**

```json
{
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "planId": "BASIC",
    "priceId": "price_...",
    "currentPeriodStart": "2025-01-01T00:00:00Z",
    "currentPeriodEnd": "2025-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "canceledAt": null,
    "trialEnd": null
  }
}
```

### 2. Atualizado `app/billing/page.tsx`

**Mudanças:**

- ❌ Removido: `import { getSubscriptionData } from '@/lib/stripe/subscription-helper';`
- ✅ Adicionado: Chamada para API via `fetch()`

**Antes:**

```typescript
const subData = await getSubscriptionData(subscriptionId); // ❌ Erro!
```

**Depois:**

```typescript
const response = await fetch(`/api/stripe/subscription-data?subscriptionId=${subscriptionId}`);
const { subscription: subData } = await response.json(); // ✅ Funciona!
```

---

## 📊 Arquitetura Corrigida

```
┌─────────────────────┐
│   Browser (Client)  │
│                     │
│  billing/page.tsx   │
│  ('use client')     │
└──────────┬──────────┘
           │ fetch()
           ▼
┌─────────────────────┐
│   Server (API)      │
│                     │
│  /api/stripe/       │
│  subscription-data  │
│  route.ts           │
└──────────┬──────────┘
           │
           │ usa STRIPE_SECRET_KEY
           ▼
┌─────────────────────┐
│   Stripe API        │
│                     │
│  Subscriptions      │
└─────────────────────┘
```

**Fluxo seguro:**

1. Cliente solicita dados via API pública
2. API valida autenticação e ownership
3. API busca dados do Stripe usando chave secreta
4. API retorna dados sanitizados ao cliente

---

## 🔐 Benefícios da Correção

1. **Segurança:** STRIPE_SECRET_KEY nunca é exposta ao navegador
2. **Separação de Responsabilidades:** Cliente não precisa conhecer lógica da Stripe
3. **Validação Centralizada:** Autenticação e ownership em um único lugar
4. **Facilita Testes:** API pode ser mockada em testes E2E
5. **Escalabilidade:** Adicionar cache, rate limiting, etc. fica mais fácil

---

## 🧪 Como Testar

### 1. Teste com usuário autenticado

```bash
1. Fazer login na aplicação
2. Acessar /billing
3. Verificar que os dados do plano aparecem corretamente
4. Não deve aparecer erro no console
```

### 2. Teste de segurança (ownership)

```bash
1. Abrir DevTools → Network
2. Acessar /billing
3. Copiar o subscriptionId de outro usuário
4. Fazer request manual: fetch('/api/stripe/subscription-data?subscriptionId=sub_outro_usuario')
5. Verificar resposta: 403 Forbidden
```

### 3. Teste sem autenticação

```bash
1. Fazer logout
2. Tentar acessar diretamente: /api/stripe/subscription-data?subscriptionId=sub_...
3. Verificar resposta: 401 Unauthorized
```

---

## 📝 Checklist de Validação

- [x] Erro "Neither apiKey nor config.authenticator provided" corrigido
- [x] STRIPE_SECRET_KEY não exposta no cliente
- [x] Endpoint de API criado com autenticação
- [x] Validação de ownership implementada
- [x] billing/page.tsx atualizado para usar API
- [x] Zero erros de TypeScript
- [x] Documentação atualizada

---

## 🎯 Arquivos Modificados

### Criados:

- ✅ `app/api/stripe/subscription-data/route.ts` (70 linhas)

### Modificados:

- ✅ `app/billing/page.tsx` (removeu import, adicionou fetch)
- ✅ `docs/BILLING_PAGE_SUMMARY.md` (atualizado para mencionar nova API)

---

## ⚠️ Lições Aprendidas

### ❌ NÃO FAÇA:

```typescript
// ❌ Client Component importando código do servidor
'use client';
import { getSubscriptionData } from '@/lib/stripe/subscription-helper';
```

### ✅ FAÇA:

```typescript
// ✅ Client Component chamando API
'use client';
const response = await fetch('/api/stripe/subscription-data?...');
```

### Regra Geral:

- **Server Components:** Podem importar e usar diretamente bibliotecas do servidor (Stripe, Prisma, etc.)
- **Client Components:** Devem usar APIs (fetch) para acessar dados do servidor
- **API Routes:** Ponte segura entre cliente e servidor

---

## 🎉 Status

**✅ CORREÇÃO APLICADA E TESTADA**

O erro foi completamente resolvido. A página de billing agora funciona corretamente sem expor credenciais sensíveis.
