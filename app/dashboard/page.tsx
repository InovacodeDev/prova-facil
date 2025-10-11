'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, Copy, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardSkeleton } from '@/components/ui/loading';
import { useProfile, usePlan, useMonthlyUsage } from '@/hooks/use-cache';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { logClientError } from '@/lib/client-error-logger';
import { Sidebar } from '@/components/Sidebar';
import { PageHeader } from '@/components/PageHeader';
import { AppLayout } from '@/components/layout';

interface QuestionStats {
  total: number;
  bySubject: Record<string, { count: number; name: string }>;
  byType: Record<string, number>;
  totalCopies: number;
  uniqueQuestionsCopied: number;
  mostCopiedQuestion?: {
    id: string;
    question: string;
    copyCount: number;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [stats, setStats] = useState<QuestionStats>({
    total: 0,
    bySubject: {},
    byType: {},
    totalCopies: 0,
    uniqueQuestionsCopied: 0,
  });

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Use cache hooks for profile, plan, and usage
  const { profile, loading: profileLoading } = useProfile();
  const { plan, loading: planLoading } = usePlan(profile?.plan);
  const { usage, loading: usageLoading } = useMonthlyUsage(profile?.id);

  // Combined loading state
  const loading = profileLoading || planLoading || usageLoading;

  // Derived values from cache (memoized to prevent unnecessary re-renders)
  const monthlyUsage = useMemo(() => usage ?? 0, [usage]);
  const monthlyLimit = useMemo(() => plan?.questions_month ?? 30, [plan?.questions_month]);
  const planName = useMemo(
    () => (plan?.id ? plan.id.charAt(0).toUpperCase() + plan.id.slice(1) : 'Starter'),
    [plan?.id]
  );

  // Cache configuration for stats
  const CACHE_KEY = 'dashboard_stats_cache';
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

  // Memoized fetchStats to prevent infinite loops
  const fetchStats = useCallback(async () => {
    if (!profile?.id) return;

    try {
      // Buscar todas as questões com copy_count e informações de cópia
      const { data: questionsData, error } = await supabase
        .from('questions')
        .select(
          `
                    id,
                    question,
                    type,
                    copy_count,
                    created_at,
                    assessments!inner (
                        id,
                        title,
                        user_id,
                        subject
                    )
                `
        )
        .eq('assessments.user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = questionsData?.length || 0;
      const totalCopies = questionsData?.reduce((sum: number, q: any) => sum + (q.copy_count || 0), 0) || 0;
      const uniqueQuestionsCopied = questionsData?.filter((q: any) => (q.copy_count || 0) > 0).length || 0;

      const mostCopied = questionsData?.reduce((max: any, q: any) => {
        return (q.copy_count || 0) > (max?.copy_count || 0) ? q : max;
      }, null);

      const mostCopiedQuestion =
        mostCopied && mostCopied.copy_count > 0
          ? {
              id: mostCopied.id,
              question: mostCopied.question,
              copyCount: mostCopied.copy_count,
            }
          : undefined;

      const bySubject: Record<string, { count: number; name: string }> = {};
      questionsData?.forEach((q: any) => {
        const subject = q.assessments?.subject;
        if (subject && typeof subject === 'string') {
          if (!bySubject[subject]) {
            bySubject[subject] = { count: 0, name: subject };
          }
          bySubject[subject].count++;
        }
      });

      const byType: Record<string, number> = {};
      questionsData?.forEach((q: any) => {
        const type = q.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      const newStats = {
        total,
        bySubject,
        byType,
        totalCopies,
        uniqueQuestionsCopied,
        mostCopiedQuestion,
      };

      // Use functional setState to avoid unnecessary updates
      setStats((prev) => {
        const prevJson = JSON.stringify(prev);
        const nextJson = JSON.stringify(newStats);
        if (prevJson === nextJson) return prev;
        return newStats;
      });

      // Salvar no cache de forma segura
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: newStats,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn('Não foi possível salvar cache:', e);
      }
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      logClientError(error, { component: 'Dashboard', action: 'fetchStats' });
    }
  }, [profile?.id, supabase]);

  const fetchStatsWithCache = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
          setStats((prev) => {
            const prevJson = JSON.stringify(prev);
            const nextJson = JSON.stringify(data);
            if (prevJson === nextJson) return prev;
            return data;
          });
          return;
        }
      }
      await fetchStats();
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
      logClientError(error, { component: 'Dashboard', action: 'fetchStatsWithCache' });
      await fetchStats();
    }
  }, [profile?.id, fetchStats]);

  useEffect(() => {
    // Verificar se veio da confirmação de email
    const searchParams = new URLSearchParams(window.location.search);
    const confirmed = searchParams.get('confirmed');

    if (confirmed === 'true') {
      toast({
        title: 'Email confirmado com sucesso!',
        description: 'Bem-vindo à plataforma Prova Fácil. Agora você pode começar a criar suas avaliações.',
        duration: 8000,
      });
      window.history.replaceState({}, '', '/dashboard');
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser((prev) => {
        const newUser = session?.user ?? null;
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });

      if (!session) {
        router.push('/auth');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser((prev) => {
        const newUser = session?.user ?? null;
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });
      if (!session) {
        router.push('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase, toast]);

  // Fetch stats when profile loads
  useEffect(() => {
    if (profile?.id) {
      fetchStatsWithCache();
    }
  }, [profile?.id, fetchStatsWithCache]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Dashboard" description="Acompanhe suas estatísticas e o desempenho das suas questões" />

      {/* Stats Grid - Cards maiores em 2 colunas */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Total de Questões */}
        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Total de Questões</CardTitle>
              <CardDescription className="mt-1">Questões criadas na plataforma</CardDescription>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stats.total}</div>
            <p className="text-sm text-muted-foreground mb-4">
              {stats.total === 1 ? 'questão criada' : 'questões criadas'}
            </p>
            {/* Mini progress bar */}
            <div className="h-3 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${Math.min((stats.total / 100) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.total < 100 ? `${100 - stats.total} para próxima meta` : 'Meta atingida!'}
            </p>
          </CardContent>
        </Card>

        {/* Questões por Matéria */}
        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Por Matéria</CardTitle>
              <CardDescription className="mt-1">Distribuição por disciplina</CardDescription>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PieChart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {Object.entries(stats.bySubject).length > 0 ? (
                (() => {
                  const entries = Object.entries(stats.bySubject)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 4);
                  const total = entries.reduce((sum, [, data]) => sum + data.count, 0);
                  const colors = ['bg-green-600', 'bg-green-500', 'bg-green-400', 'bg-green-300'];
                  return entries.map(([id, data], index) => {
                    const percentage = Math.round((data.count / total) * 100);
                    return (
                      <div key={id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate flex-1">{data.name}</span>
                          <span className="font-bold ml-3 text-green-600 dark:text-green-400">
                            {data.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-3 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[index]} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma questão ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Questões */}
        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Por Tipo</CardTitle>
              <CardDescription className="mt-1">Tipos de questões criadas</CardDescription>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {Object.entries(stats.byType).length > 0 ? (
                (() => {
                  const entries = Object.entries(stats.byType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4);
                  const maxCount = Math.max(...entries.map(([, count]) => count));
                  const typeLabels: Record<string, string> = {
                    multiple_choice: 'Múltipla Escolha',
                    true_false: 'V ou F',
                    open: 'Dissertativa',
                    sum: 'Somatória',
                    fill_in_the_blank: 'Preencher Lacunas',
                    matching_columns: 'Relacionar Colunas',
                    problem_solving: 'Resolução de Problemas',
                    essay: 'Redação',
                    project_based: 'Projeto',
                    gamified: 'Gamificada',
                    summative: 'Avaliativa',
                  };
                  const colors = ['bg-purple-600', 'bg-purple-500', 'bg-purple-400', 'bg-purple-300'];
                  return entries.map(([type, count], index) => {
                    const percentage = Math.round((count / maxCount) * 100);
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate flex-1">
                            {typeLabels[type] || type}
                          </span>
                          <span className="font-bold ml-3 text-purple-600 dark:text-purple-400">{count}</span>
                        </div>
                        <div className="h-3 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[index]} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma questão ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Cópias */}
        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Engajamento</CardTitle>
              <CardDescription className="mt-1">Questões mais utilizadas</CardDescription>
            </div>
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Copy className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Cópias</p>
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.totalCopies}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Questões Copiadas</p>
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.uniqueQuestionsCopied}</p>
                </div>
              </div>

              {stats.total > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Taxa de reuso</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {Math.round((stats.uniqueQuestionsCopied / stats.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-500"
                      style={{
                        width: `${(stats.uniqueQuestionsCopied / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {stats.mostCopiedQuestion && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Questão mais copiada:</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {stats.mostCopiedQuestion.question.substring(0, 80)}...
                  </p>
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                    {stats.mostCopiedQuestion.copyCount} cópias
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uso Mensal Card - Full width */}
      <Card className="transition-all hover:shadow-lg border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold">Uso Mensal</CardTitle>
            <CardDescription className="mt-1">Acompanhe seu consumo de questões neste mês</CardDescription>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{monthlyUsage}</div>
                <p className="text-sm text-muted-foreground mt-1">de {monthlyLimit} questões</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">
                  {Math.round((monthlyUsage / monthlyLimit) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">utilizado</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-4 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                style={{
                  width: `${Math.min((monthlyUsage / monthlyLimit) * 100, 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground">
                {monthlyLimit - monthlyUsage > 0
                  ? `${monthlyLimit - monthlyUsage} questões restantes`
                  : 'Limite atingido'}
              </span>
              <span className="font-medium text-foreground">Plano {planName}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
