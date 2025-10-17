# Guia do Hook `usePlan()`

## 📋 Visão Geral

O hook `usePlan()` é a solução centralizada para obter informações do plano do usuário em componentes client-side. Ele combina:

- ✅ Dados da subscription do Stripe
- ✅ Mapeamento para plan ID interno
- ✅ Cache automático com React Query
- ✅ Real-time updates via Supabase
- ✅ Sincronização entre componentes

## 🎯 Quando Usar

### ✅ Use `usePlan()` quando:

- Componente é `'use client'`
- Precisa mostrar informações do plano (nome, status, etc)
- Precisa saber se o plano está ativo/cancelado
- Precisa verificar downgrades agendados
- Quer atualizações em tempo real do plano

### ❌ NÃO use quando:

- Componente é Server Component (use `getSubscriptionData()` diretamente)
- Precisa apenas de limites/features (use `usePlanConfig()` junto)
- Está em uma API route (use funções do servidor)

## 📦 Instalação / Import

```tsx
import { usePlan } from '@/hooks/use-plan';
// OU via barrel export:
import { usePlan } from '@/hooks/stripe';
```

## 🔧 Uso Básico

### Exemplo Simples

```tsx
'use client';

import { usePlan } from '@/hooks/use-plan';

export function PlanBadge() {
  const { plan, isLoading, error } = usePlan();

  if (isLoading) return <Skeleton />;
  if (error) return <div>Erro ao carregar plano</div>;
  if (!plan) return <div>Sem plano</div>;

  return (
    <Badge>
      {plan.name} {/* "Starter", "Basic", etc */}
    </Badge>
  );
}
```

### Exemplo Completo (Sidebar)

```tsx
'use client';

import { usePlan } from '@/hooks/use-plan';

export function PlanCard() {
  const { plan, isLoading, refetch } = usePlan();

  if (isLoading) {
    return <Skeleton className="h-24" />;
  }

  if (!plan) {
    return <div>Selecione um plano</div>;
  }

  return (
    <div>
      {/* Nome do plano */}
      <h3>{plan.name}</h3>

      {/* Status */}
      <Badge variant={plan.isActive ? 'success' : 'secondary'}>{plan.status}</Badge>

      {/* Cancelamento agendado */}
      {plan.cancelAtPeriodEnd && plan.currentPeriodEnd && (
        <p>Plano ativo até {new Date(plan.currentPeriodEnd * 1000).toLocaleDateString()}</p>
      )}

      {/* Downgrade/upgrade agendado */}
      {plan.scheduledNextPlan && <Badge variant="outline">Próximo: {plan.scheduledNextPlan}</Badge>}
    </div>
  );
}
```

## 📊 Interface de Retorno

```typescript
interface UsePlanReturn {
  plan: PlanData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface PlanData {
  // Identificação
  id: PlanId; // 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced'
  name: string; // "Starter", "Basic", etc

  // Status da subscription
  status: string; // 'active', 'canceled', 'past_due', 'none'
  isActive: boolean; // true se status === 'active'
  isPastDue: boolean; // true se status === 'past_due'
  isCanceled: boolean; // true se cancelado ou com cancelAtPeriodEnd
  isFree: boolean; // true se plano é 'starter' ou status 'none'

  // Datas e renovação
  currentPeriodStart: number | null; // Unix timestamp (segundos)
  currentPeriodEnd: number | null; // Unix timestamp (segundos)
  expiresAt: string | null; // ISO string da data de expiração

  // Cancelamento e mudanças agendadas
  cancelAtPeriodEnd: boolean; // true se haverá downgrade/cancelamento
  scheduledNextPlan: PlanId | null; // Próximo plano agendado (ex: 'starter' após downgrade)

  // IDs do Stripe
  productId: string | null; // Stripe Product ID
  priceId: string | null; // Stripe Price ID
}
```

## 🎨 Casos de Uso Comuns

### 1. Mostrar Badge do Plano

```tsx
const { plan } = usePlan();

<Badge variant={plan?.isActive ? 'default' : 'secondary'}>{plan?.name || 'Starter'}</Badge>;
```

### 2. Verificar se Plano Está Ativo

```tsx
const { plan } = usePlan();

if (plan?.isActive) {
  return <PremiumFeature />;
}

return <UpgradePrompt />;
```

### 3. Mostrar Aviso de Cancelamento

```tsx
const { plan } = usePlan();

{
  plan?.cancelAtPeriodEnd && plan.currentPeriodEnd && (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Seu plano será alterado para <strong>{plan.scheduledNextPlan || 'Starter'}</strong> em{' '}
        {new Date(plan.currentPeriodEnd * 1000).toLocaleDateString()}
      </AlertDescription>
    </Alert>
  );
}
```

### 4. Combinar com `usePlanConfig()` para Limites

```tsx
import { usePlan, usePlanConfig } from '@/hooks/use-plan';

function CreateQuestionsPage() {
  const { plan } = usePlan();
  const { config } = usePlanConfig(plan?.id);

  const maxQuestions = config?.questions_month ?? 25;
  const allowedTypes = config?.max_question_types ?? 1;

  return (
    <div>
      <p>Você pode criar até {maxQuestions} questões este mês</p>
      <p>Tipos permitidos: {allowedTypes}</p>
    </div>
  );
}
```

### 5. Forçar Refetch Após Atualização

```tsx
import { usePlan } from '@/hooks/use-plan';

function UpgradeButton() {
  const { refetch } = usePlan();

  const handleUpgrade = async () => {
    await upgradeToProPlan();

    // Força atualização do cache
    refetch();

    // OU dispatch evento para atualizar outros componentes
    window.dispatchEvent(new CustomEvent('subscription-updated'));
  };

  return <Button onClick={handleUpgrade}>Fazer Upgrade</Button>;
}
```

## 🔄 Real-time Updates

O hook já configura automaticamente:

### 1. **Supabase Real-time**

Escuta mudanças na tabela `profiles` do usuário logado.

```typescript
// Já configurado automaticamente no hook
supabase.channel(`profile-plan-changes-${profile.id}`).on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'profiles',
    filter: `id=eq.${profile.id}`,
  },
  () => {
    // Cache invalidado automaticamente
  }
);
```

### 2. **Custom Events**

Escuta o evento `subscription-updated` para sincronização entre componentes.

```typescript
// Em qualquer componente que altera a subscription:
window.dispatchEvent(new CustomEvent('subscription-updated'));

// O hook escuta automaticamente e refaz o fetch
```

## ⚙️ Configuração de Cache

O hook usa React Query com as seguintes configurações:

```typescript
{
  staleTime: 60 * 1000,        // 1 minuto (dados frescos)
  gcTime: 5 * 60 * 1000,       // 5 minutos em memória
  refetchOnMount: 'always',     // Sempre refaz ao montar
  refetchOnWindowFocus: true,   // Refaz ao voltar para a aba
}
```

### Por que 1 minuto?

- Planos podem mudar frequentemente (upgrade/downgrade)
- Dados frescos são críticos para limites de uso
- Real-time complementa com invalidação instantânea

## 🐛 Tratamento de Erros

### Cenários de Erro Comuns

#### 1. Usuário Não Autenticado

```tsx
const { plan, error } = usePlan();

if (error?.message.includes('Unauthorized')) {
  return <RedirectToLogin />;
}
```

#### 2. Subscription Não Encontrada

```tsx
const { plan } = usePlan();

// plan será null se não houver subscription ativa
if (!plan) {
  return <div>Você está no plano gratuito</div>;
}
```

#### 3. Erro de Rede

```tsx
const { plan, error, refetch } = usePlan();

if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        Erro ao carregar plano: {error.message}
        <Button onClick={refetch}>Tentar novamente</Button>
      </AlertDescription>
    </Alert>
  );
}
```

## 📝 Boas Práticas

### ✅ DO:

```tsx
// 1. Sempre verifique isLoading
if (isLoading) return <Skeleton />;

// 2. Sempre verifique se plan existe
if (!plan) return <FreePlanView />;

// 3. Use estados derivados
const canAccessFeature = plan?.isActive && plan?.id !== 'starter';

// 4. Combine com usePlanConfig para limites
const { config } = usePlanConfig(plan?.id);
```

### ❌ DON'T:

```tsx
// ❌ Não ignore o loading state
const { plan } = usePlan();
return <div>{plan.name}</div>; // Erro se isLoading

// ❌ Não faça fetch manual se o hook já faz
useEffect(() => {
  fetch('/api/stripe/subscription'); // Duplicado!
}, []);

// ❌ Não guarde o plano em useState local
const [localPlan, setLocalPlan] = useState(plan); // Cache conflitante

// ❌ Não use em Server Components
// app/page.tsx (Server Component)
export default function Page() {
  const { plan } = usePlan(); // ❌ ERRO!
}
```

## 🔗 Hooks Relacionados

- **`usePlanConfig(planId)`**: Busca limites e features do plano
- **`useSubscription()`**: Dados raw da subscription do Stripe
- **`useProfile()`**: Dados do perfil do usuário (usado internamente)
- **`useMonthlyUsage()`**: Uso mensal de questões

## 📚 Exemplos de Integração

### Com Limites de Uso

```tsx
import { usePlan, usePlanConfig } from '@/hooks/use-plan';
import { useMonthlyUsage } from '@/hooks/use-cache';

function UsageDisplay() {
  const { plan } = usePlan();
  const { config } = usePlanConfig(plan?.id);
  const { usage } = useMonthlyUsage(profile?.id);

  const limit = config?.questions_month ?? 25;
  const remaining = Math.max(0, limit - (usage || 0));
  const percentage = (usage / limit) * 100;

  return (
    <div>
      <Progress value={percentage} />
      <p>{remaining} questões restantes este mês</p>
    </div>
  );
}
```

### Com Proteção de Features

```tsx
function PremiumFeature() {
  const { plan, isLoading } = usePlan();

  if (isLoading) return <Skeleton />;

  if (!plan?.isActive || plan.id === 'starter') {
    return (
      <LockedFeature>
        <p>Esta funcionalidade requer um plano pago</p>
        <Button asChild>
          <Link href="/plan">Ver Planos</Link>
        </Button>
      </LockedFeature>
    );
  }

  return <ActualFeature />;
}
```

## 🎯 Migração do Código Antigo

### Antes (Lógica Duplicada)

```tsx
// ❌ ANTIGO - Cada componente fazia sua própria busca
const [plan, setPlan] = useState<PlanData | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPlan = async () => {
    const response = await fetch('/api/stripe/subscription?...');
    const { subscription } = await response.json();

    const { data: planData } = await supabase
      .from('plans')
      .select('id')
      .eq('stripe_product_id', subscription.productId)
      .single();

    setPlan({ id: planData.id, ... });
    setLoading(false);
  };

  fetchPlan();
}, []);
```

### Depois (Hook Centralizado)

```tsx
// ✅ NOVO - Uma linha
const { plan, isLoading } = usePlan();
```

## 🚀 Performance

- **Cache Shared**: Múltiplos componentes compartilham o mesmo cache
- **Deduplicação**: Múltiplas chamadas simultâneas = 1 request
- **Background Refetch**: Atualiza em segundo plano sem loading
- **Optimistic Updates**: Pode atualizar cache antes da API responder

## 📖 Referências

- **Arquivo**: `/hooks/use-plan.ts`
- **API Route**: `/app/api/stripe/subscription/route.ts`
- **Server Function**: `/lib/stripe/server.ts` → `getSubscriptionData()`
- **Cache**: Redis (4h TTL) + React Query (1min stale)

## 🤝 Contribuindo

Ao adicionar novos campos ao `PlanData`:

1. Atualize a interface `PlanData` em `use-plan.ts`
2. Atualize a função `fetchUserPlan()` para incluir o novo campo
3. Atualize esta documentação
4. Adicione testes se necessário

---

**Última atualização**: 17 de outubro de 2025
**Versão**: 2.0 (Com real-time e cache React Query)
