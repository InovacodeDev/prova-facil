# Plan Configuration - Frontend vs Stripe

## 📋 Resumo

Features e informações de planos agora são definidas no front-end. Apenas **nome** e **preços** vêm do Stripe.

## 🎯 Arquitetura Implementada

### Do Stripe API (Dinâmico)

- ✅ **Nome do Plano** (`product.name`)
- ✅ **Preços Mensais** (`prices.monthly.unit_amount`)
- ✅ **Preços Anuais** (`prices.yearly.unit_amount`)
- ✅ **Product ID** (para linking)
- ✅ **Price IDs** (para checkout)

### Do Frontend (Estático)

- ✅ **Features** (lista de funcionalidades)
- ✅ **Descrição**
- ✅ **AI Level** ("IA Básica", "IA Premium", etc.)
- ✅ **Questions per Month** (limite de questões)
- ✅ **Max Question Types** (tipos de questões)
- ✅ **Document Types** (formatos aceitos)
- ✅ **Max Document Size** (tamanho máximo)
- ✅ **Support** (tipo de suporte)
- ✅ **Highlighted** (plano recomendado)
- ✅ **Badge** (texto customizado do badge)

## 📁 Arquivos Criados/Modificados

### 1. Configuração de Planos

**Arquivo:** `lib/plans/config.ts`

```typescript
export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  starter: {
    id: 'starter',
    displayName: 'Starter',
    description: 'Perfeito para começar a criar questões',
    aiLevel: 'IA Básica',
    questionsPerMonth: 30,
    features: [
      '30 questões/mês',
      '1 tipo de questão',
      'IA Básica (GPT-3.5)',
      // ...
    ],
    highlighted: false,
  },
  essentials: {
    // ...
    highlighted: true,
    badge: 'Mais Popular',
  },
  // ... outros planos
};
```

**Funções helpers:**

- `getPlanConfig(planId)`: Retorna configuração do plano
- `getQuestionsDisplay(count)`: Formata "300 questões" ou "Ilimitadas"
- `getQuestionTypesDisplay(count)`: Formata "5 tipos" ou "Todos os tipos"

### 2. Componente de Pricing Atualizado

**Arquivo:** `components/PricingShared.tsx`

```typescript
{
  products.map((product) => {
    // Busca config estática do frontend
    const planConfig = getPlanConfig(product.internalPlanId);

    return (
      <Card>
        {/* Nome do Stripe (ou fallback do config) */}
        <CardTitle>{product.name || planConfig.displayName}</CardTitle>

        {/* AI Level do frontend config */}
        <Badge>{planConfig.aiLevel}</Badge>

        {/* Descrição do frontend config */}
        <CardDescription>{planConfig.description}</CardDescription>

        {/* Preços do Stripe */}
        <span>{formatPrice(product)}</span>

        {/* Features do frontend config */}
        {planConfig.features.map((feature) => (
          <li>{feature}</li>
        ))}

        {/* Highlighted do frontend config */}
        {planConfig.highlighted && <Badge>{planConfig.badge}</Badge>}
      </Card>
    );
  });
}
```

## 💡 Vantagens da Abordagem

### 1. **Controle Total das Features**

- Altere features sem tocar no Stripe Dashboard
- Deploy instantâneo de mudanças
- Versionamento com Git

### 2. **Flexibilidade de Apresentação**

- Customize badges, descrições e highlights
- Adicione/remova features facilmente
- Experimente diferentes copy sem custos

### 3. **Performance**

- Stripe API retorna menos dados
- Menos parsing de metadata
- Carregamento mais rápido

### 4. **Separação de Responsabilidades**

- Stripe: billing e pagamentos
- Frontend: apresentação e UX
- Cada sistema faz o que faz melhor

### 5. **Facilidade de Manutenção**

- Um arquivo centralizado para todas as features
- TypeScript garante type-safety
- Fácil de testar e validar

## 🔄 Fluxo de Dados

```
Stripe Dashboard
    ↓
Stripe API (name + prices)
    ↓
StripeProductWithPrices (apenas IDs e preços)
    ↓
Frontend (busca config por internalPlanId)
    ↓
PLAN_CONFIGS[planId] (features, description, etc.)
    ↓
PricingShared Component (merge dos dados)
    ↓
UI renderizada (nome+preço do Stripe, resto do frontend)
```

## 🛠️ Como Adicionar/Editar Features

### Adicionar Nova Feature a um Plano

```typescript
// lib/plans/config.ts
export const PLAN_CONFIGS = {
  essentials: {
    // ... outros campos
    features: [
      '300 questões/mês',
      '5 tipos de questões',
      'IA Avançada (GPT-4 Turbo)',
      'Novo recurso aqui!', // ← Adicione aqui
      // ...
    ],
  },
};
```

### Mudar Descrição de um Plano

```typescript
basic: {
  description: 'Nova descrição mais atrativa!', // ← Mude aqui
  // ...
},
```

### Destacar um Plano Diferente

```typescript
// Remover highlight do essentials
essentials: {
  highlighted: false, // ← Era true
  // ...
},

// Adicionar highlight no plus
plus: {
  highlighted: true, // ← Era false
  badge: 'Recomendado para Times', // ← Customize o badge
  // ...
},
```

### Adicionar Novo Plano

```typescript
export const PLAN_CONFIGS = {
  // ... planos existentes

  premium: {
    // ← Novo plano
    id: 'premium',
    displayName: 'Premium',
    description: 'Para power users',
    aiLevel: 'IA Ultra',
    questionsPerMonth: 5000,
    features: [
      '5.000 questões/mês',
      'Acesso antecipado a features',
      // ...
    ],
    highlighted: false,
  },
};

// Também adicione o tipo
export type PlanId = 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced' | 'premium';
```

## 📊 Exemplo Completo de Config

```typescript
{
  id: 'plus',
  displayName: 'Plus',
  description: 'Solução completa para instituições',
  aiLevel: 'IA Premium',
  questionsPerMonth: 1000,
  maxQuestionTypes: 10,
  documentTypes: ['PDF', 'TXT', 'DOCX', 'PPTX', 'XLSX'],
  maxDocumentSize: '100 MB',
  support: 'WhatsApp + Chat',
  highlighted: false,
  features: [
    '1.000 questões/mês',
    'Todos os tipos de questões',
    'IA Premium (GPT-4 + Claude)',
    'Todos os formatos (até 100MB)',
    'Multi-usuário (até 5)',
    'Suporte WhatsApp + Chat',
    'API de integração',
    'Relatórios avançados',
    'Customização de templates',
  ],
}
```

## 🎨 Customização de UI

### Mudar Cores do Badge Highlight

```typescript
// components/PricingShared.tsx
{planConfig.highlighted && (
  <Badge className="bg-primary text-primary-foreground">
    {planConfig.badge || 'Recomendado'}
  </Badge>
)}

// Para mudar a cor, modifique a classe:
<Badge className="bg-green-500 text-white"> // ← Cor customizada
```

### Adicionar Ícones nas Features

```typescript
// lib/plans/config.ts
features: [
  '🚀 300 questões/mês', // ← Emoji no início
  '🤖 IA Avançada',
  '📊 Analytics completo',
  // ...
],
```

## 🧪 Testing

```typescript
import { getPlanConfig, PLAN_CONFIGS } from '@/lib/plans/config';

// Teste se todos os planos têm as propriedades necessárias
Object.values(PLAN_CONFIGS).forEach((plan) => {
  expect(plan.features).toBeDefined();
  expect(plan.features.length).toBeGreaterThan(0);
  expect(plan.description).toBeDefined();
  expect(plan.aiLevel).toBeDefined();
});

// Teste o helper
const config = getPlanConfig('essentials');
expect(config.id).toBe('essentials');
expect(config.highlighted).toBe(true);
```

## 🚀 Deploy

Mudanças nas configurações de planos entram em efeito **imediatamente** após deploy:

```bash
# 1. Edite as features
vim lib/plans/config.ts

# 2. Commit
git add lib/plans/config.ts
git commit -m "feat(plans): adicionar nova feature no plano plus"

# 3. Push e deploy
git push origin main

# Vercel/Deploy automático irá aplicar as mudanças
```

**Não é necessário:**

- ❌ Atualizar Stripe Dashboard
- ❌ Rodar migrações
- ❌ Limpar cache (as configs são estáticas)

## 📝 Notas Importantes

1. **Sincronização com Stripe**: Certifique-se que o `internalPlanId` no Stripe corresponde ao `id` no `PLAN_CONFIGS`

2. **Fallback**: Se um plano não for encontrado, `getPlanConfig()` retorna o config do plano `starter`

3. **Preços**: Sempre vêm do Stripe em tempo real, garantindo que preços de checkout estejam corretos

4. **Type Safety**: TypeScript garante que todas as propriedades obrigatórias estejam presentes

---

**Implementado por:** AI Agent
**Data:** 2025-10-13
**Status:** ✅ Completo e Funcional
