# Correção: Preço Mensal Zerado no Plano Basic

## 🐛 Problema Identificado

O plano **Basic** estava exibindo **R$ 0,00** quando a opção "Mensal" estava selecionada na página de preços, enquanto os outros planos (Essentials, Plus, Advanced) mostravam os valores corretos.

### Sintomas

```
Starter:    R$ 0,00/mês     | R$ 0,00/ano        ✅ Correto (plano grátis)
Basic:      R$ 0,00/mês     | R$ 269,10/ano      ❌ ERRO - deveria ser R$ 29,90/mês
Essentials: R$ 49,90/mês    | R$ 449,10/ano      ✅ Correto
Plus:       R$ 79,90/mês    | R$ 719,10/ano      ✅ Correto
Advanced:   R$ 129,90/mês   | R$ 1.169,10/ano    ✅ Correto
```

### Contexto

- O preço mensal **existia** no Stripe Dashboard (R$ 29,90)
- O preço estava **ativo**
- ID do preço: `price_1SHuMuEezeAMnhEzWi4Nn8y1`
- Mas a API não estava retornando esse preço

---

## 🔍 Investigação

### Passo 1: Verificação no Stripe Dashboard

Confirmado que o preço mensal existia e estava ativo:

- **Preço:** R$ 29,90 (2990 centavos)
- **Intervalo:** Mensal
- **Status:** Ativo ✅
- **Marcado como:** Padrão

### Passo 2: Debug da API

Criamos endpoints de debug para investigar:

```bash
# Ver todos os preços de um produto específico
GET /api/stripe/debug-prices?product=prod_TEN7yqB6u8yLoN

# Resultado:
{
  "totalPrices": 2,
  "prices": [
    {
      "id": "price_1SHvC9EezeAMnhEzIaDrRmd8",
      "active": true,
      "unit_amount": 26910,
      "interval": "year"
    },
    {
      "id": "price_1SHuMuEezeAMnhEzWi4Nn8y1",
      "active": true,
      "unit_amount": 2990,
      "interval": "month"  # ✅ EXISTE!
    }
  ]
}
```

### Passo 3: Identificação da Causa Raiz

Ao verificar o que `stripe.prices.list()` estava retornando:

```typescript
// Código original em lib/stripe/server.ts
const prices = await stripe.prices.list({
  active: true,
  expand: ['data.product'],
  // ❌ SEM LIMIT - usa o padrão da API (10 preços)
});
```

**Resultado:** A API do Stripe tem um **limite padrão de 10 resultados** e estava retornando apenas:

- 10 preços no total
- Apenas 1 preço do Basic (o anual)
- O preço mensal não estava sendo retornado

---

## ✅ Solução Implementada

### 1. Aumentar o Limite da API

```typescript
// lib/stripe/server.ts - ANTES
const prices = await stripe.prices.list({
  active: true,
  expand: ['data.product'],
});

// lib/stripe/server.ts - DEPOIS
const prices = await stripe.prices.list({
  active: true,
  expand: ['data.product'],
  limit: 100, // ✅ Garantir que todos os preços sejam retornados
});
```

### 2. Adicionar Bypass de Cache para Debug

```typescript
// app/api/stripe/products/route.ts
export async function GET(request: Request) {
  // Permitir bypass do cache Redis com ?bypass=true
  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.get('bypass') === 'true';

  let products = bypassCache ? null : await getCachedStripeProducts();
  // ...
}
```

**Uso:**

```bash
# Com cache (padrão)
GET /api/stripe/products

# Sem cache (debug)
GET /api/stripe/products?bypass=true
```

### 3. Endpoint para Limpar Cache

```typescript
// app/api/stripe/clear-cache/route.ts (NOVO)
import { invalidateStripeProductsCache } from '@/lib/cache/stripe-products-cache';

export async function POST() {
  await invalidateStripeProductsCache();
  return NextResponse.json({
    success: true,
    message: 'Stripe products cache cleared successfully',
  });
}
```

**Uso:**

```bash
curl -X POST http://localhost:8800/api/stripe/clear-cache
```

---

## 🧪 Validação

### Antes da Correção

```bash
curl -s http://localhost:8800/api/stripe/products | \
  jq '.products[] | select(.internalPlanId == "basic")'

# Resultado:
{
  "name": "Basic",
  "prices": {
    "monthly": null,  # ❌ PROBLEMA
    "yearly": { "unit_amount": 26910 }
  }
}
```

### Após a Correção

```bash
curl -s http://localhost:8800/api/stripe/products | \
  jq '.products[] | select(.internalPlanId == "basic")'

# Resultado:
{
  "name": "Basic",
  "prices": {
    "monthly": { "unit_amount": 2990 },   # ✅ CORRIGIDO
    "yearly": { "unit_amount": 26910 }
  }
}
```

### Verificação na Interface

```
Plano Basic:
- Toggle Mensal: R$ 29,90/mês    ✅ Exibindo corretamente
- Toggle Anual:  R$ 269,10/ano   ✅ Exibindo corretamente
- Economia:      25% no anual     ✅ Mantido
```

---

## 📊 Impacto

### Planos Afetados

- **Basic:** ✅ Corrigido
- **Outros planos:** ✅ Não afetados

### Valores Corretos do Plano Basic

| Período    | Valor         | Centavos | ID do Preço                      |
| ---------- | ------------- | -------- | -------------------------------- |
| **Mensal** | R$ 29,90/mês  | 2990     | `price_1SHuMuEezeAMnhEzWi4Nn8y1` |
| **Anual**  | R$ 269,10/ano | 26910    | `price_1SHvC9EezeAMnhEzIaDrRmd8` |

### Economia no Anual

```
Mensal: R$ 29,90 × 12 meses = R$ 358,80/ano
Anual:  R$ 269,10/ano
Economia: R$ 89,70/ano (24,96% ~25%)
```

---

## 🔧 Troubleshooting

### Se o preço ainda aparecer zerado

1. **Limpar o cache Redis:**

   ```bash
   curl -X POST http://localhost:8800/api/stripe/clear-cache
   ```

2. **Invalidar o cache do React Query no frontend:**

   - Recarregue a página com Ctrl+Shift+R (hard refresh)
   - Ou abra em uma aba anônima

3. **Verificar se o preço está ativo no Stripe:**

   ```bash
   curl -s 'http://localhost:8800/api/stripe/debug-prices?product=prod_TEN7yqB6u8yLoN'
   ```

4. **Testar com bypass do cache:**
   ```bash
   curl -s 'http://localhost:8800/api/stripe/products?bypass=true' | \
     jq '.products[] | select(.internalPlanId == "basic")'
   ```

---

## 📝 Lições Aprendidas

### 1. Sempre especificar `limit` em APIs paginadas

O Stripe API tem limites padrão para evitar sobrecarga. Sempre especifique explicitamente:

```typescript
// ❌ RUIM - usa limite padrão (10)
stripe.prices.list({ active: true });

// ✅ BOM - especifica limite adequado
stripe.prices.list({ active: true, limit: 100 });
```

### 2. Implementar ferramentas de debug

Os endpoints criados foram essenciais:

- `/api/stripe/products?bypass=true` - Debug sem cache
- `/api/stripe/clear-cache` - Invalidar cache manualmente
- `/api/stripe/debug-prices` - Ver todos os preços de um produto

### 3. Cache pode mascarar problemas

O Redis estava cacheando a resposta incorreta por 1 hora. Sempre testar com cache invalidado ao fazer mudanças no Stripe.

---

## 🚀 Próximos Passos (Recomendado)

### 1. Monitoramento

Adicionar logging quando preços esperados não forem encontrados:

```typescript
const monthlyPrice = productPrices.find((p) => p.recurring?.interval === 'month' && p.active);

if (!monthlyPrice && product.name !== 'Starter') {
  console.warn(`[Stripe] Missing monthly price for product: ${product.name}`);
}
```

### 2. Paginação Robusta

Se o número de preços crescer além de 100, implementar paginação:

```typescript
async function getAllPrices(): Promise<Stripe.Price[]> {
  const allPrices: Stripe.Price[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const response = await stripe.prices.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    });

    allPrices.push(...response.data);
    hasMore = response.has_more;
    startingAfter = response.data[response.data.length - 1]?.id;
  }

  return allPrices;
}
```

### 3. Testes Automatizados

Criar testes para validar que todos os planos têm ambos os preços:

```typescript
describe('Stripe Products', () => {
  it('should have both monthly and yearly prices for paid plans', async () => {
    const products = await getStripeProducts();

    for (const product of products) {
      if (product.name !== 'Starter') {
        expect(product.prices.monthly).toBeDefined();
        expect(product.prices.yearly).toBeDefined();
      }
    }
  });
});
```

---

## ✅ Checklist de Validação

- [x] Preço mensal do Basic aparece corretamente (R$ 29,90)
- [x] Preço anual do Basic mantém valor correto (R$ 269,10)
- [x] Economia de 25% preservada
- [x] Outros planos não afetados
- [x] Cache Redis pode ser invalidado manualmente
- [x] Endpoint de debug disponível
- [x] Sem erros TypeScript
- [x] Commit realizado
- [x] Documentação criada

---

## 📚 Referências

- [Stripe API - List Prices](https://stripe.com/docs/api/prices/list)
- [Stripe API - Pagination](https://stripe.com/docs/api/pagination)
- [Redis Caching Strategy](https://redis.io/docs/manual/client-side-caching/)
