# Atualização de Stripe Price ID e Tipagem

## 📋 Resumo

Implementação de:

1. **Tipagem TypeScript** para objetos do Stripe (`StripeProduct`)
2. **Atualização automática** do `stripe_price_id` na tabela `subscriptions` durante upgrade/downgrade

## 🎯 Problema Resolvido

### Antes:

- ❌ Sem tipagem centralizada para produtos do Stripe
- ❌ `stripe_price_id` não era atualizado na tabela `subscriptions` ao mudar de plano
- ❌ Inconsistência entre o plano no profile e o price_id na subscription

### Depois:

- ✅ Tipagem forte e centralizada em `lib/stripe/types.ts`
- ✅ `stripe_price_id` atualizado automaticamente em upgrades e downgrades
- ✅ Consistência garantida entre todas as tabelas

## 📝 Arquivos Criados/Modificados

### 1. **lib/stripe/types.ts** (NOVO)

Arquivo centralizado com todas as tipagens do Stripe:

```typescript
export interface StripePriceInfo {
  id: string;
  amount: number | null;
  currency: string;
  interval: 'month' | 'year';
}

export interface StripePrices {
  monthly: StripePriceInfo;
  yearly: StripePriceInfo;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  metadata: Record<string, string>;
  features: string[];
  prices: StripePrices;
}
```

**Inclui:**

- Type guards para validação em runtime
- Mapeamento de nomes de produtos para IDs de planos
- Função utilitária `getPlanIdFromProductName()`

### 2. **lib/stripe/plan-change.service.ts** (MODIFICADO)

Atualizadas as funções para retornar também o `newPriceId`:

```typescript
// Interface de resultado com price ID
export interface ImmediateUpgradeResult {
  subscription: Stripe.Subscription;
  newPriceId: string;
}

export interface SchedulePlanChangeResult {
  subscription: Stripe.Subscription;
  newPriceId: string;
}

// Funções agora retornam o price ID junto com a subscription
export async function executeImmediateUpgrade(params: ImmediateUpgradeParams): Promise<ImmediateUpgradeResult> {
  // ...
  return {
    subscription: updatedSubscription,
    newPriceId,
  };
}
```

### 3. **app/api/stripe/change-plan/route.ts** (MODIFICADO)

Adicionada atualização do `stripe_price_id` na tabela `subscriptions`:

```typescript
// UPGRADE IMEDIATO
const result = await executeImmediateUpgrade({...});
const updatedSubscription = result.subscription;
const newPriceId = result.newPriceId;

// Atualizar profile
await supabase.from('profiles').update({
  plan: newPlanId,
  // ...
});

// NOVO: Atualizar subscriptions com novo price_id
await supabase.from('subscriptions').update({
  stripe_price_id: newPriceId,
  plan_id: newPlanId,
  event_type: 'upgrade_immediate',
}).eq('user_id', profile.id);
```

**Mesma lógica aplicada para downgrades:**

```typescript
// DOWNGRADE AGENDADO
await supabase
  .from('subscriptions')
  .update({
    stripe_price_id: newPriceId,
    plan_id: newPlanId,
    event_type: 'downgrade_scheduled',
  })
  .eq('user_id', profile.id);
```

### 4. **hooks/use-stripe-products.ts** (MODIFICADO)

Atualizado para usar tipagem centralizada:

```typescript
// ANTES: Tipagem local duplicada
export interface StripeProduct { ... }

// DEPOIS: Importa do arquivo central
import type { StripeProduct } from '@/lib/stripe/types';

// Re-exporta para conveniência
export type { StripeProduct } from '@/lib/stripe/types';
```

### 5. **app/api/stripe/products/route.ts** (MODIFICADO)

Adiciona tipagem ao retorno da API:

```typescript
import type { StripeProduct } from '@/lib/stripe/types';

// Tipagem explícita do array
const productsWithPrices: StripeProduct[] = products.data.map((product) => {
  return {
    id: product.id,
    name: product.name,
    // ... resto da estrutura conforme StripeProduct
  };
});
```

## 🔄 Fluxo de Atualização

### Upgrade Imediato:

```
1. Usuário confirma upgrade
   ↓
2. executeImmediateUpgrade()
   - Atualiza subscription no Stripe
   - Retorna { subscription, newPriceId }
   ↓
3. Atualiza tabela profiles
   - plan = newPlanId
   - plan_expire_at = atualizado
   ↓
4. Atualiza tabela subscriptions
   - stripe_price_id = newPriceId ✓
   - plan_id = newPlanId
   - event_type = 'upgrade_immediate'
```

### Downgrade Agendado:

```
1. Usuário confirma downgrade
   ↓
2. schedulePlanChange()
   - Agenda mudança no Stripe
   - Retorna { subscription, newPriceId }
   ↓
3. Atualiza tabela profiles
   - pending_plan_id = newPlanId
   - pending_plan_change_at = data_renovação
   ↓
4. Atualiza tabela subscriptions
   - stripe_price_id = newPriceId ✓
   - plan_id = newPlanId
   - event_type = 'downgrade_scheduled'
```

## 📊 Estrutura do Objeto StripeProduct

Exemplo de objeto retornado pela API:

```json
{
  "id": "prod_TCSAOytSIbuuYi",
  "name": "STRIPE_PRICE_ID_ADVANCED",
  "description": null,
  "metadata": {},
  "features": [],
  "prices": {
    "monthly": {
      "id": "price_1SG3GBQ4V3uDKzPxpl6rVH7s",
      "amount": 12990,
      "currency": "brl",
      "interval": "month"
    },
    "yearly": {
      "id": "price_1SG3bJQ4V3uDKzPxnt7GbHIV",
      "amount": null,
      "currency": "brl",
      "interval": "year"
    }
  }
}
```

## ✅ Type Safety

### Type Guards Incluídos:

```typescript
// Verifica se objeto é StripeProduct válido
export function isValidStripeProduct(obj: unknown): obj is StripeProduct {
  // Validação completa de todos os campos
}

// Uso:
if (isValidStripeProduct(data)) {
  // TypeScript sabe que data é StripeProduct
  console.log(data.prices.monthly.amount);
}
```

### Mapeamento de Nomes:

```typescript
export const STRIPE_PRODUCT_NAME_TO_PLAN_ID: Record<string, string> = {
  STRIPE_PRICE_ID_BASIC: 'basic',
  STRIPE_PRICE_ID_ESSENTIALS: 'essentials',
  STRIPE_PRICE_ID_PLUS: 'plus',
  STRIPE_PRICE_ID_ADVANCED: 'advanced',
};

// Extrai plan ID do nome do produto
getPlanIdFromProductName('STRIPE_PRICE_ID_PLUS'); // 'plus'
```

## 🔍 Verificação

Para verificar se tudo está funcionando:

1. **Faça um upgrade:**

   ```sql
   SELECT stripe_price_id, plan_id, event_type
   FROM subscriptions
   WHERE user_id = 'xxx';
   ```

   - ✓ `stripe_price_id` deve ser o novo price ID
   - ✓ `plan_id` deve ser o novo plano
   - ✓ `event_type` deve ser 'upgrade_immediate'

2. **Faça um downgrade:**
   ```sql
   SELECT stripe_price_id, plan_id, event_type
   FROM subscriptions
   WHERE user_id = 'xxx';
   ```
   - ✓ `stripe_price_id` deve ser o price ID do downgrade
   - ✓ `plan_id` deve ser o plano de downgrade
   - ✓ `event_type` deve ser 'downgrade_scheduled'

## 📦 Importações

Todos os arquivos agora podem importar tipos de um único lugar:

```typescript
// Importar tipo
import type { StripeProduct, StripePriceInfo } from '@/lib/stripe/types';

// Ou do hook (que re-exporta)
import type { StripeProduct } from '@/hooks/use-stripe-products';

// Type guards e utilities
import { isValidStripeProduct, getPlanIdFromProductName } from '@/lib/stripe/types';
```

## 🎯 Benefícios

1. **Type Safety:** Erros de tipo detectados em tempo de compilação
2. **Consistência:** Uma única fonte de verdade para tipos
3. **Manutenibilidade:** Mudanças em um único arquivo
4. **Validação:** Type guards para validação em runtime
5. **Auditoria:** `stripe_price_id` sempre atualizado para tracking
6. **Webhooks:** Facilita sincronização com webhooks do Stripe

## 🚀 Próximos Passos (Opcional)

- [ ] Criar webhook para `customer.subscription.updated` que também atualize `stripe_price_id`
- [ ] Adicionar índice na coluna `stripe_price_id` para queries mais rápidas
- [ ] Criar view SQL que mostra discrepâncias entre Stripe e database
- [ ] Adicionar logs estruturados para mudanças de price_id
- [ ] Criar job que sincroniza periodicamente com Stripe API

## 📚 Referências

- [Stripe API: Products](https://stripe.com/docs/api/products)
- [Stripe API: Prices](https://stripe.com/docs/api/prices)
- [Stripe API: Subscriptions](https://stripe.com/docs/api/subscriptions)
- [TypeScript: Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
