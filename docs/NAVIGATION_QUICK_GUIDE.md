# Guia Rápido: Sistema de Navegação com Sidebar

## Como Usar

### 1. Aplicar o Layout em uma Nova Página

```tsx
// app/sua-pagina/page.tsx
import { AppLayout, PageHeader } from '@/components/layout';

export default function SuaPagina() {
  return (
    <AppLayout>
      <PageHeader title="Título da Página" description="Descrição breve" />

      {/* Seu conteúdo aqui */}
      <div>{/* ... */}</div>
    </AppLayout>
  );
}
```

### 2. Adicionar Ações no PageHeader

```tsx
<PageHeader
  title="Minhas Questões"
  description="Visualize e gerencie suas questões"
  actions={
    <>
      <Select>{/* Filtros */}</Select>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Nova Questão
      </Button>
    </>
  }
/>
```

### 3. Estrutura Recomendada

```tsx
<AppLayout>
  {/* PageHeader sempre primeiro */}
  <PageHeader title="Título" description="Descrição" />

  {/* Conteúdo com espaçamento adequado */}
  <div className="space-y-6">
    <Card>{/* ... */}</Card>

    <div className="grid gap-4 md:grid-cols-2">{/* ... */}</div>
  </div>
</AppLayout>
```

## Comportamento da Sidebar

### Desktop

- **Padrão:** Expandida (mostra ícones + texto)
- **Clique no menu:** Alterna entre expandida/recolhida
- **Recolhida:** Mostra apenas ícones com tooltips

### Mobile

- **Padrão:** Fechada
- **Clique no menu:** Abre sidebar com overlay
- **Fecha ao:**
  - Clicar fora da sidebar
  - Selecionar uma página

## Componentes Disponíveis

```tsx
// Importação
import { AppLayout, PageHeader, AppHeader, Sidebar } from '@/components/layout';

// Você geralmente só usa:
import { AppLayout, PageHeader } from '@/components/layout';
```

## Páginas que NÃO devem usar AppLayout

- Landing page (`/`)
- Autenticação (`/auth`)
- Outras páginas públicas

## Dicas

1. **Largura do conteúdo:** Limitada automaticamente a 1264px
2. **Espaçamento:** Use `space-y-6` entre seções
3. **Cards:** Funcionam perfeitamente dentro do layout
4. **Responsividade:** Grid com `md:grid-cols-X` adapta automaticamente

## Exemplo Completo

```tsx
'use client';

import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExemploPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <PageHeader
        title="Minha Página"
        description="Uma breve descrição do que esta página faz"
        actions={
          <Button onClick={() => router.push('/nova-rota')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Cards com estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Estatística 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">123</p>
            </CardContent>
          </Card>
          {/* Mais cards... */}
        </div>

        {/* Conteúdo principal */}
        <Card>
          <CardContent className="pt-6">{/* Seu conteúdo aqui */}</CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
```

## Troubleshooting

**Sidebar não aparece?**

- Verifique se está usando `AppLayout`
- Confirme que o usuário está autenticado

**Conteúdo muito largo?**

- O `AppLayout` já limita a 1264px automaticamente
- Não adicione `container` ou `max-w-` adicionais

**Botão de menu não funciona?**

- Isso é gerenciado automaticamente pelo `AppLayout`
- Não precisa implementar lógica de abertura/fechamento

**Preciso customizar?**

- Evite modificar os componentes base
- Use as props disponíveis (`actions`, `className`, etc.)
- Para casos especiais, estenda via composição
