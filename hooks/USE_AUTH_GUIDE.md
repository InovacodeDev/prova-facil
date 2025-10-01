# Hook useAuth - Documentação

## Descrição

Hook customizado para validar autenticação do usuário e obter seu profile. Redireciona automaticamente para a página de login se o usuário não estiver autenticado.

## Instalação

O hook já está disponível em `hooks/use-auth.ts`.

## Uso Básico

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";

export default function MinhaPage() {
    const { user, profile, loading, error } = useAuth();

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!user) {
        // Será redirecionado automaticamente para /auth
        return null;
    }

    return (
        <div>
            <h1>Bem-vindo, {profile?.full_name}!</h1>
            <p>Email: {user.email}</p>
            <p>Plano: {profile?.plan}</p>
            <p>Nível Acadêmico ID: {profile?.academic_level_id}</p>
        </div>
    );
}
```

## API

### Parâmetros

```typescript
useAuth(redirectTo?: string)
```

-   `redirectTo` (opcional): Rota para redirecionar se não estiver autenticado. Padrão: `"/auth"`

### Retorno

```typescript
{
    user: User | null; // Objeto do usuário do Supabase Auth
    profile: Profile | null; // Profile do usuário (tabela profiles)
    loading: boolean; // Estado de carregamento
    error: string | null; // Mensagem de erro, se houver
}
```

### Interface Profile

```typescript
interface Profile {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    plan: string; // 'starter', 'basic', 'essentials', 'plus', 'advanced'
    renew_status: string; // 'none', 'active', 'cancelled', etc.
    academic_level_id: string | null;
    created_at: string;
    updated_at: string;
}
```

## Exemplos

### 1. Página Básica com Autenticação

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Olá, {profile?.full_name}!</p>
        </div>
    );
}
```

### 2. Redirecionamento Customizado

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";

export default function AdminPage() {
    // Redireciona para /admin-login se não estiver autenticado
    const { user, profile, loading } = useAuth("/admin-login");

    if (loading) return <div>Carregando...</div>;

    return <div>Área Administrativa</div>;
}
```

### 3. Exibir Informações do Plano

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
    const { profile, loading } = useAuth();

    if (loading) return <div>Carregando...</div>;

    const planLabels = {
        starter: "Iniciante",
        basic: "Básico",
        essentials: "Essencial",
        plus: "Plus",
        advanced: "Avançado",
    };

    return (
        <div>
            <h1>Meu Perfil</h1>
            <p>Nome: {profile?.full_name}</p>
            <p>Email: {profile?.email}</p>
            <div>
                Plano: <Badge>{planLabels[profile?.plan || "starter"]}</Badge>
            </div>
        </div>
    );
}
```

### 4. Verificar Permissões

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PremiumPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile) {
            // Verificar se o usuário tem plano premium
            if (profile.plan === "starter" || profile.plan === "basic") {
                router.push("/plan"); // Redirecionar para página de upgrade
            }
        }
    }, [loading, profile, router]);

    if (loading) return <div>Carregando...</div>;

    return <div>Conteúdo Premium</div>;
}
```

### 5. Buscar Dados Relacionados ao Usuário

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MyAssessmentsPage() {
    const { profile, loading: authLoading } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchAssessments() {
            if (!profile) return;

            const { data, error } = await supabase
                .from("assessments")
                .select("*")
                .eq("user_id", profile.id)
                .order("created_at", { ascending: false });

            if (!error) {
                setAssessments(data || []);
            }
            setLoading(false);
        }

        if (!authLoading) {
            fetchAssessments();
        }
    }, [profile, authLoading, supabase]);

    if (authLoading || loading) {
        return <div>Carregando...</div>;
    }

    return (
        <div>
            <h1>Minhas Avaliações</h1>
            {assessments.map((assessment) => (
                <div key={assessment.id}>{assessment.title}</div>
            ))}
        </div>
    );
}
```

### 6. Tratamento de Erros

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MyPage() {
    const { user, profile, loading, error } = useAuth();

    if (loading) return <div>Carregando...</div>;

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Erro ao carregar dados: {error}</AlertDescription>
            </Alert>
        );
    }

    return <div>Conteúdo da página</div>;
}
```

## Funcionalidades

### ✅ Verificação Automática de Autenticação

-   Verifica se há uma sessão ativa ao carregar a página
-   Redireciona automaticamente se não houver sessão

### ✅ Carregamento do Profile

-   Busca automaticamente o profile do usuário na tabela `profiles`
-   Retorna todos os campos do profile

### ✅ Listener de Mudanças de Estado

-   Monitora eventos de login/logout em tempo real
-   Atualiza automaticamente quando o usuário faz login/logout
-   Atualiza quando o token é renovado

### ✅ Redirecionamento Configurável

-   Permite especificar rota customizada de redirecionamento
-   Padrão: `/auth`

## Estados de Carregamento

O hook retorna `loading: true` durante:

1. Verificação inicial da sessão
2. Busca do profile do usuário

Sempre verifique o estado de `loading` antes de renderizar conteúdo protegido.

## Boas Práticas

### ✅ Sempre verificar loading

```tsx
if (loading) return <div>Carregando...</div>;
```

### ✅ Retornar null se não autenticado

```tsx
if (!user) return null; // Será redirecionado
```

### ✅ Usar profile para dados do usuário

```tsx
// ✅ Correto - usar profile
<p>{profile?.full_name}</p>

// ❌ Incorreto - user não tem full_name
<p>{user?.full_name}</p>
```

### ✅ Verificar profile antes de usar

```tsx
{
    profile && <p>Plano: {profile.plan}</p>;
}
```

## Diferença entre `user` e `profile`

-   **`user`**: Objeto do Supabase Auth (id, email, metadata)
-   **`profile`**: Dados da tabela `profiles` (full_name, plan, academic_level_id, etc.)

Use `user` para autenticação e `profile` para informações do usuário na aplicação.

## Compatibilidade

-   ✅ Next.js 15 App Router
-   ✅ React 18+
-   ✅ Supabase Auth
-   ✅ TypeScript
-   ✅ Client Components only ("use client")

## Notas Importantes

1. **Componentes Client-Side**: Este hook só funciona em Client Components (`"use client"`)
2. **Redirecionamento Automático**: Não precisa verificar autenticação manualmente
3. **Real-time Updates**: O hook atualiza automaticamente quando o estado de auth muda
4. **Cleanup**: O listener é limpo automaticamente quando o componente desmonta

## Troubleshooting

### Profile não está sendo carregado

-   Verifique se a tabela `profiles` existe
-   Verifique se há um profile para o usuário atual
-   Verifique as políticas RLS do Supabase

### Redirecionamento não funciona

-   Certifique-se de que está usando "use client" no componente
-   Verifique se o Next.js router está disponível

### Estado não atualiza após login

-   O listener `onAuthStateChange` deve atualizar automaticamente
-   Verifique o console para erros

## Exemplo Completo - Página Dashboard

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <Button onClick={handleLogout} variant="outline">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                </Button>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Bem-vindo, {profile?.full_name}!</h2>
                <div className="space-y-2">
                    <p>Email: {user?.email}</p>
                    <p>Plano: {profile?.plan}</p>
                    <p>Status: {profile?.renew_status}</p>
                </div>
            </Card>
        </div>
    );
}
```
