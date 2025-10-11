'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardSkeleton } from '@/components/ui/loading';
import { useProfile, usePlan, useMonthlyUsage } from '@/hooks/use-cache';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { logClientError } from '@/lib/client-error-logger';
import { AppLayout, PageHeader } from '@/components/layout';

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
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Bem-vindo de volta! Crie suas questões de forma rápida e inteligente."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="transition-all hover:shadow-lg hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Questões</CardTitle>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total === 1 ? 'questão criada' : 'questões criadas'}
            </p>
            {/* Mini progress bar */}
            <div className="mt-3 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min((stats.total / 100) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Questões por Matéria */}
        <Card className="md:col-span-1 transition-all hover:shadow-lg hover:scale-105 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Matéria</CardTitle>
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PieChart className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {Object.entries(stats.bySubject).length > 0 ? (
                (() => {
                  const entries = Object.entries(stats.bySubject)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 3);
                  const total = entries.reduce((sum, [, data]) => sum + data.count, 0);
                  const colors = ['bg-green-500', 'bg-green-400', 'bg-green-300'];
                  return entries.map(([id, data], index) => {
                    const percentage = Math.round((data.count / total) * 100);
                    return (
                      <div key={id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate flex-1">{data.name}</span>
                          <span className="font-semibold ml-2 text-green-600 dark:text-green-400">
                            {data.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
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
                <p className="text-xs text-muted-foreground">Nenhuma questão ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Tipos de Questões */}
        <Card className="md:col-span-1 transition-all hover:shadow-lg hover:scale-105 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {Object.entries(stats.byType).length > 0 ? (
                (() => {
                  const entries = Object.entries(stats.byType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
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
                  const colors = ['bg-purple-500', 'bg-purple-400', 'bg-purple-300'];
                  return entries.map(([type, count], index) => {
                    const percentage = Math.round((count / maxCount) * 100);
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate flex-1">{typeLabels[type] || type}</span>
                          <span className="font-semibold ml-2 text-purple-600 dark:text-purple-400">{count}</span>
                        </div>
                        <div className="h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
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
                <p className="text-xs text-muted-foreground">Nenhuma questão ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Usage and Copy Insights Row */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {/* Monthly Usage Card */}
        <Card className="transition-all hover:shadow-lg border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Uso Mensal</CardTitle>
              <CardDescription className="text-xs mt-1">Plano {planName}</CardDescription>
            </div>
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{monthlyUsage}</span>
                <span className="text-lg text-muted-foreground">/ {monthlyLimit}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {Math.round((monthlyUsage / monthlyLimit) * 100)}% usado
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    monthlyUsage / monthlyLimit > 0.9
                      ? 'bg-red-500'
                      : monthlyUsage / monthlyLimit > 0.7
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((monthlyUsage / monthlyLimit) * 100, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Restam{' '}
                  <strong className="text-orange-600 dark:text-orange-400">
                    {Math.max(0, monthlyLimit - monthlyUsage)}
                  </strong>{' '}
                  questões
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Copies Card */}
        <Card className="transition-all hover:shadow-lg border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cópias</CardTitle>
            <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.totalCopies}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalCopies === 1 ? 'cópia realizada' : 'cópias realizadas'}
            </p>
            <div className="mt-3 h-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${Math.min((stats.totalCopies / 50) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Unique Questions Copied Card */}
        <Card className="transition-all hover:shadow-lg border-l-4 border-l-pink-500 bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões Únicas Copiadas</CardTitle>
            <div className="p-2.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">{stats.uniqueQuestionsCopied}</div>
            <p className="text-xs text-muted-foreground mt-1">de {stats.total} questões criadas</p>
            {stats.total > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{Math.round((stats.uniqueQuestionsCopied / stats.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-pink-100 dark:bg-pink-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 transition-all duration-500"
                    style={{
                      width: `${(stats.uniqueQuestionsCopied / stats.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Create Question Card */}
        <Card
          className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          onClick={() => router.push('/new-assessment')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Nova Questão</CardTitle>
            <CardDescription>Faça upload de um PDF e gere questões automaticamente</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button className="w-full" variant="default">
              Começar
            </Button>
          </CardContent>
        </Card>

        {/* My Questions Card */}
        <Card
          className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
          onClick={() => router.push('/my-assessments')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">
              <FileText className="h-6 w-6 text-secondary-foreground" />
            </div>
            <CardTitle>Minhas Questões</CardTitle>
            <CardDescription>Visualize e gerencie suas questões criadas</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button className="w-full" variant="outline">
              Ver Questões ({stats.total})
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
