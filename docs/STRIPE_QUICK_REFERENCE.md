# Stripe Quick Reference

Guia rápido de comandos e conceitos essenciais.

## 🚀 Setup Rápido

### 1. Variáveis de Ambiente

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRODUCT_BASIC=prod_...
STRIPE_PRODUCT_ESSENTIALS=prod_...
STRIPE_PRODUCT_PLUS=prod_...
STRIPE_PRODUCT_ADVANCED=prod_...
```

### 2. Migração

```bash
psql $DATABASE_URL < db/migrations/0001_add_stripe_fields_to_profiles.sql
```

### 3. Webhook Local

```bash
stripe listen --forward-to localhost:8800/api/stripe/webhook
```

## 📡 API Endpoints

| Endpoint                      | Método | Autenticação | Descrição                 |
| ----------------------------- | ------ | ------------ | ------------------------- |
| `/api/stripe/products`        | GET    | ❌           | Lista produtos com preços |
| `/api/stripe/create-checkout` | POST   | ✅           | Cria checkout session     |
| `/api/stripe/create-portal`   | POST   | ✅           | Abre billing portal       |
| `/api/stripe/webhook`         | POST   | ⚠️ Signature | Processa eventos          |

## 💳 Cartões de Teste

| Cenário    | Número              | CVC      | Validade |
| ---------- | ------------------- | -------- | -------- |
| Sucesso    | 4242 4242 4242 4242 | Qualquer | Futura   |
| Requer 3DS | 4000 0025 0000 3155 | Qualquer | Futura   |
| Falha      | 4000 0000 0000 0002 | Qualquer | Futura   |

## 🎣 Hook useStripe

```tsx
import { useStripe } from '@/hooks/use-stripe';

function MyComponent() {
  const { createCheckout, openBillingPortal, fetchProducts, loading, error } = useStripe();

  // Iniciar checkout
  await createCheckout('price_xxxxx');

  // Abrir portal
  await openBillingPortal();

  // Buscar produtos
  await fetchProducts();
}
```

## 🔧 Comandos Úteis

### Testar Webhook Localmente

```bash
# Terminal 1
pnpm dev

# Terminal 2
stripe listen --forward-to localhost:8800/api/stripe/webhook

# Terminal 3 (para enviar evento de teste)
stripe trigger customer.subscription.created
```

### Ver Logs do Stripe

```bash
stripe logs tail
```

### Listar Produtos

```bash
stripe products list
```

### Listar Preços

```bash
stripe prices list
```

## 📊 Metadata do Produto

Formato obrigatório no Stripe Dashboard:

```json
{
  "features": "[\"Feature 1\", \"Feature 2\", \"Feature 3\"]",
  "aiLevel": "IA Básica",
  "questionsPerMonth": "50",
  "highlighted": "false"
}
```

## 🐛 Debug

### Verificar Webhook

```bash
curl -X POST http://localhost:8800/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "customer.subscription.created"}'
```

### Verificar Produtos

```bash
curl http://localhost:8800/api/stripe/products
```

### Verificar Autenticação

Abrir DevTools → Application → Cookies → Verificar `sb-access-token`

## 📚 Links Úteis

- [Dashboard](https://dashboard.stripe.com)
- [API Keys](https://dashboard.stripe.com/apikeys)
- [Webhooks](https://dashboard.stripe.com/webhooks)
- [Produtos](https://dashboard.stripe.com/products)
- [Clientes](https://dashboard.stripe.com/customers)
- [Assinaturas](https://dashboard.stripe.com/subscriptions)
- [Documentação](https://docs.stripe.com)

## ⚡ Troubleshooting

| Problema              | Solução                                |
| --------------------- | -------------------------------------- |
| Invalid signature     | Verificar `STRIPE_WEBHOOK_SECRET`      |
| Unauthorized          | Fazer login no app                     |
| Produtos não aparecem | Verificar `STRIPE_PRODUCT_*` no .env   |
| Webhook não funciona  | Verificar `stripe listen` está rodando |
| Checkout não abre     | Verificar console do navegador         |

## 🎓 Fluxo Simplificado

```
Usuário clica "Assinar"
  ↓
createCheckout(priceId)
  ↓
POST /api/stripe/create-checkout
  ↓
Stripe Checkout abre
  ↓
Usuário paga
  ↓
Webhook recebe evento
  ↓
Banco atualizado
  ↓
Usuário redirecionado
```
