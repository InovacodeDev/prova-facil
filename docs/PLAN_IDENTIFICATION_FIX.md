# Correção: Plano Identificado Corretamente via Subscription

## 🐛 Problema Identificado

As páginas da plataforma (criar questões, dashboard, etc.) estavam mostrando **plano "Starter"** mesmo quando o usuário tinha um plano pago ativo (ex: Essentials, Plus).

### Sintomas

```
Usuário real: Plano Essentials ativo no Stripe
Tela mostrava: "Plano Starter"
Limites aplicados: 30 questões/mês (Starter) ❌
Limites corretos: 100 questões/mês (Essentials) ✅
```

### Causa Raiz

O sistema estava usando o campo **`plan`** da tabela `profiles`, que:

- Não é atualizado automaticamente quando subscription muda
- Pode ficar desatualizado
- Não reflete a subscription ativa no Stripe

**Fluxo Antigo (Errado):**

```
profiles.plan → usePlan(planId) → config do plano
     ↑
Desatualizado, manual
```

---

## ✅ Solução Implementada

Agora o plano é identificado pelo **`productId`** da subscription ativa do Stripe, que é a fonte da verdade.

**Fluxo Novo (Correto):**

```
Stripe Subscription
  ↓ productId (ex: prod_xxx_essentials)
useSubscription()
  ↓
usePlan()
  ↓ busca plan_id pela tabela plans.stripe_product_id
  ↓ retorna: { id: 'essentials', name: 'Essentials', ... }
usePlanConfig(plan.id)
  ↓ busca configuração completa
  ↓ retorna: { questions_month: 100, doc_type: [...], ... }
```

---

## 🔧 Arquitetura da Solução

### 1. Hook `usePlan()` Refatorado

**Antes:**

```typescript
// ❌ Recebia planId do profile (desatualizado)
const { plan } = usePlan(profile?.plan);
```

**Depois:**

```typescript
// ✅ Busca automaticamente da subscription
const { plan, isLoading } = usePlan();

// Retorna:
{
  id: 'essentials',
  name: 'Essentials',
  status: 'active',
  productId: 'prod_xxx_essentials',
  isFree: false,
  isActive: true,
  // ... outros campos
}
```

### 2. Novo Hook `usePlanConfig()`

Busca a configuração detalhada do plano (limites, features):

```typescript
const { plan } = usePlan();
const { config, isLoading } = usePlanConfig(plan?.id);

// Retorna:
{
  id: 'essentials',
  questions_month: 100,
  doc_type: ['text', 'docx', 'pdf', 'link'],
  docs_size: 30,
  max_question_types: 3,
  support: ['email', 'whatsapp']
}
```

### 3. Novo Endpoint `/api/plans/[id]`

```typescript
// GET /api/plans/essentials
{
  "plan": {
    "id": "essentials",
    "questions_month": 100,
    "doc_type": ["text", "docx", "pdf", "link"],
    "docs_size": 30,
    "max_question_types": 3,
    "support": ["email", "whatsapp"]
  }
}
```

**Fallback:** Retorna configuração "starter" se plano não encontrado.

---

## 📝 Alterações por Arquivo

### `hooks/use-plan.ts`

**Adicionado:**

1. Interface `PlanConfig` para configuração do plano
2. Função `fetchPlanConfig()` para buscar config da API
3. Hook `usePlanConfig()` com caching do React Query

```typescript
export interface PlanConfig {
  id: string;
  questions_month: number;
  doc_type: string[];
  docs_size: number;
  max_question_types: number;
  support: string[];
}

export function usePlanConfig(planId?: string) {
  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['plan-config', planId],
    queryFn: () => fetchPlanConfig(planId!),
    enabled: !!planId,
    staleTime: 4 * 60 * 60 * 1000, // 4 horas
    gcTime: 6 * 60 * 60 * 1000,
  });

  return { config, isLoading, error };
}
```

### `app/api/plans/[id]/route.ts` (NOVO)

Endpoint para buscar configuração completa do plano:

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id: planId } = params;

  const { data: planData } = await supabase
    .from('plans')
    .select('id, questions_month, doc_type, docs_size, max_question_types, support')
    .eq('id', planId)
    .maybeSingle();

  return NextResponse.json({ plan: planData });
}
```

### `app/(app)/new-assessment/page.tsx`

**Antes:**

```typescript
const { plan, loading } = usePlan(profile?.id); // ❌ profile.plan desatualizado

const maxQuestions = plan?.questions_month || 30;
const allowedTypes = plan?.max_question_types || 1;
```

**Depois:**

```typescript
const { plan, isLoading: planLoading } = usePlan(); // ✅ da subscription
const { config: planConfig, isLoading: planConfigLoading } = usePlanConfig(plan?.id);

const loading = profileLoading || planLoading || planConfigLoading || usageLoading;

const maxQuestions = (planConfig?.questions_month || 30) - monthlyUsage;
const allowedTypes = planConfig?.max_question_types || 1;
```

### `app/(app)/dashboard/page.tsx`

**Antes:**

```typescript
const { plan, loading } = usePlan(profile?.id); // ❌

const monthlyLimit = plan?.questions_month ?? 30;
```

**Depois:**

```typescript
const { plan, isLoading: planLoading } = usePlan(); // ✅
const { config: planConfig, isLoading: planConfigLoading } = usePlanConfig(plan?.id);

const loading = profileLoading || planLoading || planConfigLoading || usageLoading;

const monthlyLimit = planConfig?.questions_month ?? 30;
```

---

## 🧪 Validação

### Antes da Correção

```bash
# Usuário com plano Essentials ativo
GET /api/stripe/subscription
{
  "plan": "essentials",
  "productId": "prod_xxx_essentials"
}

# Mas a página mostrava:
"Plano Starter"
"Limite: 30 questões/mês"
```

### Após a Correção

```bash
# Mesma subscription
GET /api/stripe/subscription
{
  "plan": "essentials",
  "productId": "prod_xxx_essentials"
}

# Página agora mostra corretamente:
"Plano Essentials"
"Limite: 100 questões/mês"
"IA Avançada"
```

---

## 📊 Fluxo de Dados Completo

```
┌─────────────────────┐
│  Stripe Dashboard   │
│  Subscription       │
│  productId: xxx     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Redis Cache        │
│  subscription.      │
│  productId          │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  useSubscription()  │
│  React Query        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  usePlan()          │
│  Busca plan_id      │
│  via productId      │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  usePlanConfig()    │
│  Busca limites      │
│  e features         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Componente UI      │
│  Mostra dados       │
│  corretos           │
└─────────────────────┘
```

---

## 🎯 Benefícios

### 1. Sincronização Automática com Stripe

Quando um usuário:

- Faz upgrade no Stripe → Plano atualiza automaticamente
- Faz downgrade → Plano atualiza automaticamente
- Cancela assinatura → Status reflete corretamente
- Reativa assinatura → Plano retorna

### 2. Cache Inteligente

```typescript
useSubscription()     // 4 horas de cache
  ↓
usePlan()            // 4 horas de cache
  ↓
usePlanConfig()      // 4 horas de cache
```

**Performance:** Após primeiro carregamento, dados vêm do cache (instantâneo).

### 3. Type Safety

```typescript
const { plan } = usePlan();
//     ^? plan: PlanData | null

const { config } = usePlanConfig(plan?.id);
//      ^? config: PlanConfig | undefined

// TypeScript garante que você use os tipos corretos
```

### 4. Fallback Robusto

Se algo der errado:

- API retorna "starter" como fallback
- Limites padrão aplicados (30 questões/mês)
- Aplicação continua funcionando

---

## 🔍 Debugging

### Ver Plano Atual

```typescript
const { plan } = usePlan();
console.log('Current plan:', plan);

// Output:
{
  id: 'essentials',
  name: 'Essentials',
  status: 'active',
  productId: 'prod_xxx_essentials',
  isFree: false,
  isActive: true
}
```

### Ver Configuração do Plano

```typescript
const { config } = usePlanConfig('essentials');
console.log('Plan config:', config);

// Output:
{
  id: 'essentials',
  questions_month: 100,
  doc_type: ['text', 'docx', 'pdf', 'link'],
  docs_size: 30,
  max_question_types: 3
}
```

### Verificar Subscription

```bash
# API endpoint
curl http://localhost:8800/api/stripe/subscription

# Response:
{
  "subscription": {
    "plan": "essentials",
    "productId": "prod_xxx_essentials",
    "status": "active",
    "currentPeriodEnd": 1234567890
  }
}
```

---

## 🚨 Troubleshooting

### Problema: Plano ainda aparece como "Starter"

**Soluções:**

1. **Limpar cache do navegador:**

   ```bash
   Ctrl+Shift+R (hard refresh)
   ```

2. **Invalidar cache do React Query:**

   ```typescript
   import { useInvalidateSubscription } from '@/hooks/use-subscription';

   const invalidate = useInvalidateSubscription();
   invalidate(); // Força refetch
   ```

3. **Verificar subscription no Stripe:**
   - Ir para Stripe Dashboard
   - Verificar se subscription está ativa
   - Verificar se `product_id` está correto

### Problema: Config do plano não carrega

**Verificar:**

1. **Endpoint funcionando:**

   ```bash
   curl http://localhost:8800/api/plans/essentials
   ```

2. **Plan ID existe na tabela:**

   ```sql
   SELECT * FROM plans WHERE id = 'essentials';
   ```

3. **stripe_product_id configurado:**
   ```sql
   SELECT id, stripe_product_id FROM plans;
   ```

---

## 📚 Referências

- [React Query - Dependent Queries](https://tanstack.com/query/latest/docs/react/guides/dependent-queries)
- [Stripe - Subscriptions](https://stripe.com/docs/api/subscriptions)
- [Next.js - Dynamic API Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

---

## ✅ Checklist de Validação

- [x] usePlan() busca plano da subscription
- [x] usePlanConfig() busca configuração do plano
- [x] Endpoint /api/plans/[id] criado
- [x] new-assessment/page.tsx atualizado
- [x] dashboard/page.tsx atualizado
- [x] Plano correto mostrado na UI
- [x] Limites corretos aplicados
- [x] Cache funcionando corretamente
- [x] Fallback para starter funciona
- [x] TypeScript sem erros
- [x] Commit realizado
- [x] Documentação criada
