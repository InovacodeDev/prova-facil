'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BarChart3, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { UserMenu } from '@/components/UserMenu';
import { UsageChart } from '@/components/UsageChart';
import type { UsageStats } from '@/lib/usage-tracking';
import { logClientError } from '@/lib/client-error-logger';

export default function UsagePage() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Call API to get usage stats
      const response = await fetch('/api/usage-stats');
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas de uso');
      }

      const data = await response.json();
      setUsageStats(data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      logClientError(error, { component: 'Usage', action: 'fetchUsageData' });
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas estatísticas de uso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!usageStats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Não foi possível carregar suas estatísticas.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentageUsed = usageStats.percentageUsed;
  const isNearLimit = percentageUsed >= 80;
  const isOverLimit = percentageUsed >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Cotas de Uso
          </h1>
          <p className="text-gray-600 mt-2">
            Acompanhe sua utilização mensal de questões • Período: {usageStats.currentMonth}
          </p>
        </div>

        {usageStats.totalQuestions === 0 && (
          <div className="mb-8 rounded-lg border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">
            Nenhuma questão foi gerada neste ciclo ainda. Assim que criar suas primeiras questões, o consumo aparecerá
            aqui.
          </div>
        )}

        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Questões Criadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{usageStats.totalQuestions}</div>
              <p className="text-sm text-gray-500 mt-1">neste mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Cota Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">{usageStats.totalQuota}</div>
              <p className="text-sm text-gray-500 mt-1">questões/mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Disponível</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'
                }`}
              >
                {usageStats.remainingQuota}
              </div>
              <p className="text-sm text-gray-500 mt-1">questões restantes</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Utilização da Cota</CardTitle>
            <CardDescription>Você utilizou {percentageUsed}% da sua cota mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={Math.min(percentageUsed, 100)}
              className={`h-4 ${
                isOverLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
              }`}
            />
            {isOverLimit && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Você atingiu o limite do seu plano.{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-red-600 underline"
                  onClick={() => router.push('/plan')}
                >
                  Fazer upgrade
                </Button>
              </p>
            )}
            {isNearLimit && !isOverLimit && (
              <p className="text-sm text-yellow-700 mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Você está próximo do limite. Considere{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-yellow-700 underline"
                  onClick={() => router.push('/plan')}
                >
                  fazer upgrade
                </Button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Matéria</CardTitle>
            <CardDescription>Visualize como suas questões estão distribuídas entre as matérias</CardDescription>
          </CardHeader>
          <CardContent>
            <UsageChart
              subjectBreakdown={usageStats.subjectBreakdown}
              remainingQuota={usageStats.remainingQuota}
              totalQuota={usageStats.totalQuota}
            />

            {/* Subject Breakdown Table */}
            {usageStats.subjectBreakdown.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-900 mb-4">Detalhamento</h3>
                <div className="space-y-2">
                  {usageStats.subjectBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{item.subject}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {item.count} {item.count === 1 ? 'questão' : 'questões'}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade CTA */}
        {isNearLimit && (
          <Card className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Precisa de mais questões?</CardTitle>
              <CardDescription className="text-blue-700">
                Aumente sua cota mensal fazendo upgrade do seu plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/plan')} size="lg" className="w-full sm:w-auto">
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
