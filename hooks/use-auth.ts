import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  plan: string;
  renew_status: string;
  academic_level_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseAuthReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook customizado para validar autenticação e obter profile do usuário
 *
 * @param redirectTo - Rota para redirecionar se não estiver autenticado (padrão: "/auth")
 * @returns {UseAuthReturn} Objeto com user, profile, loading e error
 *
 * @example
 * ```tsx
 * const { user, profile, loading } = useAuth();
 *
 * if (loading) return <div>Carregando...</div>;
 * if (!user) return null; // Será redirecionado automaticamente
 *
 * return <div>Bem-vindo, {profile?.full_name}!</div>;
 * ```
 */
export function useAuth(redirectTo: string = '/auth'): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. Verificar sessão atual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        // 2. Se não houver sessão, redirecionar para login
        if (!session) {
          router.push(redirectTo);
          return;
        }

        setUser(session.user);

        // 3. Buscar profile do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        setProfile(profileData);
      } catch (err: any) {
        console.error('Erro ao verificar autenticação:', err);
        setError(err.message || 'Erro ao carregar dados do usuário');
        router.push(redirectTo);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    // 4. Listener para mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        router.push(redirectTo);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user);

        // Recarregar profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setProfile(profileData);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, redirectTo, supabase]);

  return { user, profile, loading, error };
}
