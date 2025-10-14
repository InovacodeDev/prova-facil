# 🎣 Hooks do Stripe - Guia Completo

## 📋 Resumo

Sistema de hooks React customizados para gerenciar dados do Stripe com cache automático de **4 horas**.

**Hooks criados:**

- ✅ `useProducts()` - Lista de produtos/planos do Stripe
- ✅ `useSubscription()` - Subscription completa do usuário
- ✅ `usePlan()` - Apenas dados do plano do usuário (simplified)

**Características:**

- 🕐 Cache automático de 4 horas
- 🔄 Invalidação manual em mudanças de plano
- 🚀 Powered by TanStack Query (React Query)
- 💾 Backend com Redis cache adicional
- 🎯 Type-safe com TypeScript

---

## 🎯 Arquitetura de Cache

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
├─────────────────────────────────────────────────────┤
│  React Query Cache (4h staleTime, 6h gcTime)       │
│  ├─ ['stripe', 'products']                         │
│  ├─ ['stripe', 'subscription']                     │
│  └─ ['stripe', 'plan'] (derived from subscription) │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓ HTTP Request
┌─────────────────────────────────────────────────────┐
│                  API ROUTES                         │
├─────────────────────────────────────────────────────┤
│  /api/stripe/products       (GET)                  │
│  /api/stripe/subscription   (GET - NEW!)           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│               REDIS CACHE                           │
├─────────────────────────────────────────────────────┤
│  subscription:{userId} (24h TTL)                    │
│  stripe:products (1h TTL)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓ API Call (cache miss)
┌─────────────────────────────────────────────────────┐
│                STRIPE API                           │
│              (Source of Truth)                      │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Criados

### 1. **Hooks**

```
hooks/
├── use-products.ts      # Hook para produtos do Stripe
├── use-subscription.ts  # Hook para subscription do usuário
├── use-plan.ts          # Hook simplificado para plan data
└── stripe.ts            # Barrel export (importação única)
```

### 2. **API Routes**

```
app/api/stripe/
├── products/route.ts        # Já existia (updated)
└── subscription/route.ts    # NOVO - Fetch user subscription
```

### 3. **Componentes Atualizados**

```
components/
├── PricingShared.tsx   # Agora usa useProducts()
└── Pricing.tsx         # Assinatura atualizada

app/(app)/plan/
└── page.tsx            # Usa useProducts() + usePlan()
```

---

## 🎣 API dos Hooks

### `useProducts()`

Busca todos os produtos/planos do Stripe com cache de 4 horas.

```typescript
import { useProducts } from '@/hooks/stripe';

function PricingPage() {
  const {
    data: products, // StripeProductWithPrices[]
    isLoading, // boolean
    error, // Error | null
    refetch, // () => Promise<...>
  } = useProducts();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return products?.map((product) => <PriceCard key={product.id} {...product} />);
}
```

**Query Key:** `['stripe', 'products']`
**Cache:** 4h staleTime, 6h gcTime
**Refetch:** On window focus se dados estiverem stale

---

### `useSubscription()`

Busca a subscription completa do usuário autenticado.

```typescript
import { useSubscription } from '@/hooks/stripe';

function SubscriptionPanel() {
  const {
    data: subscription, // CachedSubscriptionData
    isLoading,
    error,
    refetch,
  } = useSubscription();

  return (
    <div>
      <p>Plan: {subscription?.plan}</p>
      <p>Status: {subscription?.status}</p>
      <p>Renews: {new Date(subscription?.currentPeriodEnd * 1000).toLocaleDateString()}</p>
    </div>
  );
}
```

**Query Key:** `['stripe', 'subscription']`
**Cache:** 4h staleTime, 6h gcTime
**Auth:** Requer usuário autenticado (401 se não autenticado)

**Tipo retornado (`CachedSubscriptionData`):**

```typescript
{
  subscriptionId: string | null;
  customerId: string;
  status: string; // 'active', 'canceled', 'past_due', etc.
  plan: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';
  planExpireAt: string | null; // ISO date
  renewStatus: string;
  productId: string | null;
  priceId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null; // Unix timestamp (seconds)
  currentPeriodStart: number | null;
  cachedAt: string; // ISO date
}
```

---

### `usePlan()`

Versão simplificada que extrai apenas dados do plano.

```typescript
import { usePlan } from '@/hooks/stripe';

function PlanBadge() {
  const {
    plan, // PlanData | null
    isLoading,
    error,
    refetch,
  } = usePlan();

  if (isLoading) return <Skeleton />;

  return (
    <Badge>
      {plan?.name} - {plan?.isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
```

**Tipo retornado (`PlanData`):**

```typescript
{
  id: PlanId; // 'starter' | 'basic' | ...
  name: string; // 'Starter', 'Basic', ...
  status: string; // 'active', 'canceled', ...
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
  currentPeriodStart: number | null;
  expiresAt: string | null;
  isFree: boolean; // true se starter ou status none
  isActive: boolean; // status === 'active'
  isPastDue: boolean; // status === 'past_due'
  isCanceled: boolean; // canceled ou cancelAtPeriodEnd
  productId: string | null;
  priceId: string | null;
}
```

---

## 🛠️ Hooks Utilitários

### Invalidação de Cache

```typescript
import { useInvalidateProducts, useInvalidateSubscription, useInvalidateAllStripeData } from '@/hooks/stripe';

function UpgradeButton() {
  const invalidateAll = useInvalidateAllStripeData();

  const handleUpgrade = async () => {
    await upgradePlan();

    // Força refetch de TODOS os dados do Stripe
    invalidateAll();
  };
}
```

**Hooks disponíveis:**

- `useInvalidateProducts()` - Invalida apenas products
- `useInvalidateSubscription()` - Invalida apenas subscription
- `useInvalidateAllStripeData()` - Invalida TUDO (`['stripe']`)

**Quando invalidar:**

- ✅ Após upgrade de plano
- ✅ Após downgrade de plano
- ✅ Após cancelamento de subscription
- ✅ Após criar nova subscription
- ✅ Após webhook do Stripe processar mudanças

---

### Prefetch de Produtos

```typescript
import { usePrefetchProducts } from '@/hooks/stripe';

function Navigation() {
  const prefetchProducts = usePrefetchProducts();

  return (
    <Link
      href="/pricing"
      onMouseEnter={prefetchProducts} // Preload ao hover
    >
      Pricing
    </Link>
  );
}
```

---

### Verificação de Plano

```typescript
import { useHasPlan, useCanAccessFeature } from '@/hooks/stripe';

function PremiumFeature() {
  // Verifica se usuário tem um dos planos
  const hasAccess = useHasPlan(['plus', 'advanced']);

  if (!hasAccess) return <UpgradePrompt />;

  return <PremiumContent />;
}

function AdvancedAnalytics() {
  // Verifica se usuário tem plano >= essentials
  const canAccess = useCanAccessFeature('essentials');

  if (!canAccess) return <PaywallMessage />;

  return <AnalyticsCharts />;
}
```

**Plan Tiers (crescente):**

```
starter < basic < essentials < plus < advanced
```

---

### Informações de Período

```typescript
import { usePlanPeriod } from '@/hooks/stripe';

function BillingInfo() {
  const period = usePlanPeriod();

  return (
    <div>
      <p>Renovação em: {period.daysUntilRenewal} dias</p>
      <p>Progresso do período: {period.periodProgress}%</p>
      <ProgressBar value={period.periodProgress} />
    </div>
  );
}
```

**Retorna:**

```typescript
{
  daysUntilRenewal: number | null;
  daysInPeriod: number | null;
  periodProgress: number | null; // 0-100
  startDate: Date | null;
  endDate: Date | null;
}
```

---

## 💡 Exemplos de Uso Completo

### Exemplo 1: Página de Pricing

```typescript
'use client';

import { useProducts } from '@/hooks/stripe';
import { PriceCard } from '@/components/PriceCard';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PricingPage() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p>Erro ao carregar planos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products?.map((product) => (
        <PriceCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

### Exemplo 2: Dashboard com Plan Info

```typescript
'use client';

import { usePlan, usePlanPeriod } from '@/hooks/stripe';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function DashboardHeader() {
  const { plan, isLoading } = usePlan();
  const period = usePlanPeriod();

  if (isLoading) return <Skeleton />;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2>Seu Plano</h2>
          <Badge variant={plan?.isActive ? 'default' : 'secondary'}>{plan?.name}</Badge>
        </div>

        {plan?.isFree ? (
          <UpgradeButton />
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>Renova em {period.daysUntilRenewal} dias</p>
            <Progress value={period.periodProgress} className="mt-2" />
          </div>
        )}
      </div>

      {plan?.isCanceled && (
        <Alert variant="warning" className="mt-4">
          Sua assinatura será cancelada ao final do período atual.
        </Alert>
      )}
    </Card>
  );
}
```

---

### Exemplo 3: Feature Gating

```typescript
'use client';

import { useCanAccessFeature } from '@/hooks/stripe';
import { AdvancedChart } from '@/components/AdvancedChart';
import { UpgradePrompt } from '@/components/UpgradePrompt';

export function AnalyticsPage() {
  const canAccess = useCanAccessFeature('essentials');

  if (!canAccess) {
    return <UpgradePrompt requiredPlan="Essentials" feature="Analytics Avançados" />;
  }

  return <AdvancedChart />;
}
```

---

### Exemplo 4: Invalidação após Upgrade

```typescript
'use client';

import { useInvalidateAllStripeData } from '@/hooks/stripe';
import { useStripe } from '@/hooks/use-stripe';
import { useToast } from '@/hooks/use-toast';

export function UpgradeButton({ priceId }: { priceId: string }) {
  const { createCheckout } = useStripe();
  const invalidateStripeData = useInvalidateAllStripeData();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    try {
      // Redireciona para Stripe Checkout
      await createCheckout(priceId);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o upgrade',
        variant: 'destructive',
      });
    }
  };

  // Invalidar dados ao voltar do checkout
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      invalidateStripeData(); // Força refetch de todos os dados
      toast({
        title: 'Upgrade concluído!',
        description: 'Seu plano foi atualizado com sucesso.',
      });
    }
  }, []);

  return <Button onClick={handleUpgrade}>Fazer Upgrade</Button>;
}
```

---

## 🔧 Configuração do QueryClient

O `QueryClient` está configurado em `components/providers/query-provider.tsx`:

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min (padrão geral)
      gcTime: 5 * 60 * 1000, // 5 min (padrão geral)
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 1,
    },
  },
});
```

**Os hooks do Stripe SOBRESCREVEM com configurações próprias:**

- `staleTime`: 4 horas
- `gcTime`: 6 horas
- `retry`: 1-2x

---

## 🚨 Casos de Uso Importantes

### 1. Após mudança de plano (upgrade/downgrade)

```typescript
const invalidateAll = useInvalidateAllStripeData();

// Após qualquer mudança de plano
await changePlan();
invalidateAll(); // CRITICAL!
```

### 2. Após webhook do Stripe

Se você tem um webhook listener, invalide o cache:

```typescript
// app/api/stripe/webhook/route.ts
import { invalidateSubscriptionCache } from '@/lib/cache/subscription-cache';

// Após processar evento do webhook
await invalidateSubscriptionCache(userId);
```

O React Query no frontend vai refetch automaticamente quando:

- Usuário voltar para a aba (refetchOnWindowFocus: true)
- Dados ficarem stale (após 4h)
- Invalidação manual for chamada

### 3. Loading States

```typescript
const { data, isLoading, isFetching, isPending } = useProducts();

// isLoading: primeira vez carregando (sem dados em cache)
// isFetching: refetching em background (pode ter dados antigos)
// isPending: similar a isLoading (novo nome)

if (isLoading) return <Skeleton />; // Primeira carga
if (isFetching && !data) return <Skeleton />; // Background refetch sem dados

return <Content data={data} />; // Mostra dados, mesmo durante refetch
```

---

## 📊 Monitoramento e Debug

### Ver dados em cache (DevTools)

```bash
npm install @tanstack/react-query-devtools
```

```tsx
// app/layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function RootLayout({ children }) {
  return (
    <QueryProvider>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  );
}
```

### Logs no console

Os hooks já incluem logs úteis:

```
[API] Fetching products from Stripe API
[API] Serving products from cache
[Stripe] Using cached subscription data for user: xxx
[Stripe] Cache miss, fetching from Stripe API for user: xxx
```

---

## 🎯 Benefícios

### Antes (sem hooks)

```typescript
// ❌ Código repetido em cada componente
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/stripe/products')
    .then((res) => res.json())
    .then((data) => {
      setProducts(data.products);
      setLoading(false);
    });
}, []);

// ❌ Sem cache - refetch toda vez
// ❌ Sem sincronização entre componentes
// ❌ Sem invalidação automática
```

### Depois (com hooks)

```typescript
// ✅ Uma linha
const { data: products, isLoading } = useProducts();

// ✅ Cache automático (4h)
// ✅ Dados sincronizados entre componentes
// ✅ Invalidação controlada
// ✅ Type-safe
```

---

## 📝 Checklist de Migração

Para migrar código existente para os novos hooks:

- [ ] Substituir `fetch('/api/stripe/products')` por `useProducts()`
- [ ] Substituir `fetch('/api/stripe/subscription-period')` por `useSubscription()` ou `usePlan()`
- [ ] Remover `useState` e `useEffect` relacionados a Stripe data
- [ ] Adicionar invalidação de cache após mudanças de plano
- [ ] Atualizar props dos componentes (não precisam mais passar `products` manualmente)
- [ ] Testar loading e error states

---

## 🚀 Próximos Passos Recomendados

1. **React Query DevTools** (instalado em dev)
2. **Error Boundary** para capturar erros de query
3. **Optimistic Updates** para melhor UX em mudanças de plano
4. **Polling** para subscription status (em casos específicos)

---

**Documentação criada por:** AI Agent
**Data:** 2025-10-13
**Status:** ✅ Completo e em Produção
