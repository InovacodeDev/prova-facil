# Sincronização Realtime: Profile ↔ Subscription

## Visão Geral

O hook `useProfile` implementa sincronização automática bidirecional entre os dados de `profiles` e `subscription` usando Supabase Realtime e React Query.

## Arquitetura de Sincronização

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE REALTIME                         │
│                    profiles table                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ postgres_changes event
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                    useProfile Hook                           │
│  - Detecta mudanças em stripe_customer_id                   │
│  - Detecta mudanças em stripe_subscription_id                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Invalida caches relacionados
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                  React Query Cache                           │
│  1. queryClient.setQueryData(['profile'])                   │
│  2. queryClient.invalidateQueries(['subscription'])         │
│  3. queryClient.invalidateQueries(['plan-id'])              │
└─────────────────────────────────────────────────────────────┘
                 │
                 │ Automatic refetch
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              Componentes Atualizados                         │
│  - usePlan() recebe novos dados                             │
│  - useSubscription() recebe novos dados                     │
│  - UI atualizada automaticamente                            │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Sincronização

### 1. Webhook do Stripe Atualiza Profile

```typescript
// Exemplo: webhook do Stripe
await supabase
  .from('profiles')
  .update({
    stripe_subscription_id: 'sub_NEW123',
    stripe_customer_id: 'cus_NEW456',
  })
  .eq('id', profileId);
```

### 2. Realtime Detecta a Mudança

```typescript
// useProfile hook
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'profiles',
  filter: `id=eq.${profile.id}`,
}, (payload) => {
  const oldProfile = payload.old as Profile;
  const newProfile = payload.new as Profile;

  // Detecta mudanças nos campos do Stripe
  const stripeFieldsChanged =
    oldProfile.stripe_customer_id !== newProfile.stripe_customer_id ||
    oldProfile.stripe_subscription_id !== newProfile.stripe_subscription_id;

  if (stripeFieldsChanged) {
    // Invalida caches relacionados
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['plan-id'] });
  }
})
```

### 3. React Query Refaz as Queries

Quando os caches são invalidados:

1. **useSubscription()** é acionado automaticamente

   - Busca nova subscription do Stripe
   - Atualiza UI com novos dados

2. **usePlan()** é acionado automaticamente
   - Busca novo plan_id baseado no productId
   - Atualiza limites e configurações do plano

### 4. UI Atualizada Instantaneamente

Todos os componentes que usam esses hooks são re-renderizados automaticamente:

- Dashboard: quotas e limites atualizados
- Sidebar: plano exibido corretamente
- Profile: dados sempre sincronizados
- Pricing: status da subscription correto

## Cenários de Uso

### Cenário 1: Upgrade de Plano

```typescript
// 1. Usuário faz checkout → Stripe webhook dispara
// 2. Webhook atualiza profiles.stripe_subscription_id
// 3. Realtime detecta mudança
// 4. useProfile invalida cache de subscription
// 5. useSubscription() refaz query
// 6. usePlan() recebe novo productId
// 7. UI mostra novo plano instantaneamente
```

### Cenário 2: Downgrade de Plano

```typescript
// 1. Usuário cancela assinatura → Stripe webhook
// 2. profiles.stripe_subscription_id atualizado
// 3. Realtime sincroniza
// 4. Subscription cache invalidado
// 5. UI atualizada com plano gratuito
```

### Cenário 3: Múltiplas Abas Abertas

```typescript
// Tab 1: Usuário faz upgrade
// Tab 2: Recebe update via Realtime automaticamente
// Ambas as tabs mostram dados sincronizados
```

## Campos Monitorados

Os seguintes campos do profile acionam sincronização:

- **`stripe_customer_id`**: ID do cliente no Stripe
- **`stripe_subscription_id`**: ID da subscription ativa

Mudanças em outros campos (como `full_name`, `email`, etc.) NÃO acionam invalidação da subscription, pois não afetam o plano.

## Performance

### Cache Strategy

- **Profile Cache**: 1 hora (60 min)
- **Subscription Cache**: 4 horas (240 min)
- **Plan Cache**: 4 horas (240 min)

### Invalidação Inteligente

A invalidação só ocorre quando campos do Stripe mudam:

```typescript
// ✅ Aciona sincronização
profile.stripe_subscription_id = 'sub_NEW';

// ❌ NÃO aciona sincronização
profile.full_name = 'Novo Nome';
profile.email = 'novo@email.com';
```

## Logs de Debug

Para troubleshooting, os seguintes logs são emitidos:

```typescript
// Conexão estabelecida
'[useProfile] Setting up Realtime subscription for profile: {id}';

// Update recebido
'[useProfile] Realtime update received: {payload}';

// Sincronização acionada
'[useProfile] Stripe fields changed, invalidating subscription cache';

// Status da subscription
'[useProfile] Realtime subscription status: {status}';

// Cleanup
'[useProfile] Cleaning up Realtime subscription';
```

## Requisitos

### Supabase

1. ✅ Realtime habilitado na tabela `profiles`
2. ✅ RLS policies configuradas corretamente
3. ✅ Webhook do Stripe atualiza `profiles` table

### Frontend

1. ✅ `@tanstack/react-query` instalado
2. ✅ `useProfile` hook importado
3. ✅ `useSubscription` e `usePlan` usando React Query

## Benefícios

1. **Sincronização Automática**: Zero código manual
2. **Performance Otimizada**: Só invalida quando necessário
3. **Multi-Tab Support**: Funciona entre abas/dispositivos
4. **Type-Safe**: TypeScript garante integridade
5. **Debugging Fácil**: Logs detalhados

## Troubleshooting

### Problema: Subscription não atualiza

**Verificar:**

1. Realtime está ativado no Supabase?
2. Webhook do Stripe está atualizando `profiles`?
3. Logs no console mostram update recebido?

### Problema: Performance lenta

**Verificar:**

1. Cache time configurado corretamente?
2. Múltiplas subscriptions Realtime ativas?
3. Network tab mostra queries duplicadas?

### Problema: Dados desincronizados

**Verificar:**

1. `stripe_subscription_id` no profile está correto?
2. Cache foi invalidado corretamente?
3. React Query DevTools mostra query status?

## Exemplo Completo

```tsx
// Componente que usa sincronização automática
function DashboardPage() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { plan, isLoading: planLoading } = usePlan(profile?.id);

  // Quando webhook atualiza profiles.stripe_subscription_id:
  // 1. useProfile recebe update via Realtime
  // 2. Invalida cache de subscription automaticamente
  // 3. usePlan refaz query com novo productId
  // 4. UI atualizada sem refresh manual

  return (
    <div>
      <h1>Seu Plano: {plan?.name}</h1>
      <p>Questões: {plan?.monthlyQuestionLimit}</p>
    </div>
  );
}
```

## Conclusão

A sincronização Realtime garante que profile e subscription estejam sempre consistentes, proporcionando uma experiência fluida e em tempo real para o usuário, sem necessidade de refreshes manuais ou polling.
