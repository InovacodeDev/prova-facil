# Sistema de Navegação com Sidebar

## Visão Geral

Implementação de um novo sistema de navegação global com sidebar persistente em todas as telas autenticadas da plataforma, seguindo os princípios do Material Design 3 e mantendo conformidade com o AGENTS.md.

## Estrutura de Componentes

### 1. AppLayout (`components/layout/AppLayout.tsx`)

Componente wrapper principal que encapsula o header, sidebar e conteúdo da aplicação.

**Características:**

- Gerencia o estado da sidebar (aberta/fechada, expandida/recolhida)
- Aplica overlay em mobile quando a sidebar está aberta
- Ajusta o margin-left do conteúdo principal baseado no estado da sidebar
- Limita o conteúdo a 1264px de largura máxima

**Props:**

```typescript
interface AppLayoutProps {
  children: ReactNode;
}
```

### 2. AppHeader (`components/layout/AppHeader.tsx`)

Header global da aplicação com logo e menu do usuário.

**Características:**

- Botão de menu (sanduíche) à esquerda para controlar a sidebar
- Logo "Prova Fácil" centralizada (texto sem ícone)
- Avatar do usuário à direita com dropdown contendo:
  - Perfil
  - Alterar Senha
  - Uso da Conta
  - Faturamento (bloqueado com tooltip "Em breve")
  - Plano
  - Separador
  - Sair (com dialog de confirmação)

**Props:**

```typescript
interface AppHeaderProps {
  onMenuClick: () => void;
}
```

### 3. Sidebar (`components/layout/Sidebar.tsx`)

Sidebar de navegação com 4 modos de exibição.

**Características:**

- **Navegação:**
  - Dashboard (Home)
  - Criar Questões
  - Minhas Questões
  - Item ativo fica em destaque
- **Footer (fixo):**
  - Separador
  - Card do plano do usuário com:
    - Ícone indicando nível do plano
    - Nome do plano
    - CTA apropriado:
      - "Selecionar Plano" (para starter)
      - "Fazer Upgrade" (para basic)
      - Apenas informação (para advanced)

**Modos de Exibição:**

1. **Desktop Expandido (padrão):**

   - Largura: 256px (w-64)
   - Mostra ícones + texto
   - Card do plano completo

2. **Desktop Recolhido:**

   - Largura: 64px (w-16)
   - Mostra apenas ícones
   - Tooltips aparecem ao hover
   - Card do plano mostra apenas ícone

3. **Mobile Aberto:**

   - Overlay escuro sobre o conteúdo
   - Igual ao desktop expandido
   - Fecha ao clicar fora ou selecionar página

4. **Mobile Fechado:**
   - Completamente oculta (translate-x-full)

**Props:**

```typescript
interface SidebarProps {
  isExpanded: boolean;
  isOpen: boolean;
  onNavigate?: () => void;
}
```

**Configuração de Planos:**

```typescript
const planConfig = {
  starter: {
    icon: Sparkles,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  basic: {
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  advanced: {
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};
```

### 4. PageHeader (`components/layout/PageHeader.tsx`)

Componente para o cabeçalho de cada página com título, descrição e ações opcionais.

**Características:**

- Título em texto grande (3xl)
- Descrição opcional em texto muted
- Slot para ações à direita
- Borda inferior e espaçamento
- Responsivo (empilha em mobile)

**Props:**

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}
```

## Uso

### Aplicando o Layout em uma Página

```tsx
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function MinhaPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Título da Página"
        description="Descrição breve da funcionalidade"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        }
      />

      {/* Conteúdo da página */}
      <div className="space-y-6">{/* Seu conteúdo aqui */}</div>
    </AppLayout>
  );
}
```

## Páginas Atualizadas

As seguintes páginas foram migradas para o novo sistema:

1. **Dashboard** (`app/dashboard/page.tsx`)

   - Removido header e menu customizados
   - Aplicado AppLayout e PageHeader

2. **Criar Questões** (`app/new-assessment/page.tsx`)

   - Removido header com botão voltar
   - Aplicado AppLayout e PageHeader
   - Removido CardHeader duplicado

3. **Minhas Questões** (`app/my-assessments/page.tsx`)
   - Removido header customizado
   - Aplicado AppLayout e PageHeader
   - Filtros e ações movidos para o PageHeader

## Páginas Excluídas do Layout

O AppLayout **NÃO** deve ser aplicado em:

- Landing page (`app/page.tsx`)
- Páginas de autenticação (`app/auth/*`)
- Outras páginas públicas

## Responsividade

### Breakpoints

- **Desktop:** >= 1024px (lg)
- **Mobile:** < 1024px

### Comportamento por Tamanho de Tela

| Tela    | Sidebar              | Interação                                                  |
| ------- | -------------------- | ---------------------------------------------------------- |
| Desktop | Expandida por padrão | Clique no menu alterna entre expandida/recolhida           |
| Mobile  | Fechada por padrão   | Clique no menu abre/fecha; fecha ao navegar ou clicar fora |

## Estilização

### Classes Utilitárias Importantes

```typescript
// Sidebar
'fixed left-0 top-16 h-[calc(100vh-4rem)]'; // Posicionamento
'transition-all duration-300'; // Animações suaves
'lg:translate-x-0'; // Sempre visível em desktop

// Main Content
'min-h-[calc(100vh-4rem)]'; // Altura mínima
'max-w-[1264px]'; // Largura máxima do conteúdo
'lg:ml-64'; // Margin para sidebar expandida
'lg:ml-16'; // Margin para sidebar recolhida
```

### Cores dos Planos

Seguindo o padrão do design system:

- **Starter:** Cinza (neutro)
- **Basic:** Azul (intermediário)
- **Advanced:** Roxo (premium)

## Acessibilidade

- Todos os botões têm labels descritivos
- Tooltips para ícones quando a sidebar está recolhida
- Navegação por teclado suportada
- Contraste adequado para texto e ícones
- Dialog de confirmação para logout

## Performance

- Uso de `useIsMobile` hook para detectar tamanho de tela
- State management eficiente (evita re-renders desnecessários)
- Transições CSS otimizadas
- Carregamento lazy de dados do plano

## Type Safety

Todos os componentes são fortemente tipados com TypeScript:

- Props interfaces exportadas
- Tipos derivados do Supabase para dados do plano
- Enums para estados da sidebar

## Conformidade com AGENTS.md

✅ **Princípio da Clareza Adamantina:** Componentes com nomes descritivos e código limpo
✅ **Dogma da Modularidade Atômica:** Cada componente tem responsabilidade única
✅ **Axioma da Previsibilidade:** Comportamento consistente e esperado
✅ **Juramento da Segurança:** Validação de usuário e proteção de rotas
✅ **Mandamento da Simplicidade:** Solução direta sem over-engineering
✅ **Doutrina da Não Repetição:** Layout reutilizável em todas as páginas

## Próximos Passos

- [ ] Migrar páginas restantes (perfil, senha, uso, plano)
- [ ] Adicionar animações de entrada/saída mais sofisticadas
- [ ] Implementar sistema de breadcrumbs
- [ ] Adicionar atalhos de teclado para navegação
- [ ] Persistir estado da sidebar em localStorage

## Troubleshooting

### Sidebar não está aparecendo

- Verifique se o `AppLayout` está envolvendo o conteúdo
- Confirme que o usuário está autenticado
- Verifique o z-index e posicionamento CSS

### Conteúdo não está respeitando a largura máxima

- Certifique-se de que o conteúdo está dentro do `AppLayout`
- A classe `max-w-[1264px]` é aplicada automaticamente

### Overlay não fecha ao clicar

- Verifique se o `onClick` do overlay está chamando `setIsSidebarOpen(false)`
- Confirme que o z-index do overlay é menor que o da sidebar

## Licença

Este código faz parte do projeto Prova Fácil e segue as mesmas diretrizes de licença.
