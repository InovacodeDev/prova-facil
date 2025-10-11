'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Camera, Loader2, Trash2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useProfile, invalidateProfileCache } from '@/hooks/use-cache';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { QUESTION_TYPES } from '@/lib/question-types';
import { logClientError } from '@/lib/client-error-logger';
import { getQuestionTypeHint } from '@/lib/question-type-hints';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppLayout, PageHeader } from '@/components/layout';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  plan: string;
  email_verified: boolean;
  email_verified_at: string | null;
  selected_question_types: string[];
  question_types_updated_at: string | null;
}

const PLAN_LIMITS: Record<string, { max_question_types: number }> = {
  starter: { max_question_types: 1 },
  basic: { max_question_types: 2 },
  essentials: { max_question_types: 3 },
  plus: { max_question_types: 4 },
  advanced: { max_question_types: 6 },
};

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { profile: cachedProfile, loading: profileLoading } = useProfile();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [canUpdateTypes, setCanUpdateTypes] = useState(true);
  const [nextUpdateDate, setNextUpdateDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchUserData();
  }, []);

  // Sync local state when cached profile loads
  useEffect(() => {
    if (cachedProfile) {
      setFullName(cachedProfile.full_name || '');
      setSelectedQuestionTypes(cachedProfile.selected_question_types || []);
      setEmailVerified(cachedProfile.email_verified || false);

      // Calculate next update date
      if (cachedProfile.question_types_updated_at) {
        const lastUpdate = new Date(cachedProfile.question_types_updated_at);
        const nextUpdate = new Date(lastUpdate);
        nextUpdate.setMonth(nextUpdate.getMonth() + 1);
        setNextUpdateDate(nextUpdate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }));
      }
    }
  }, [cachedProfile]);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      setUser(user);
      setEmail(user.email || '');

      // Check if user can update question types (requires profile id from cache)
      if (cachedProfile) {
        const { data: canUpdate } = await supabase.rpc('can_update_question_types', {
          user_id: cachedProfile.id,
        });

        setCanUpdateTypes(canUpdate ?? false);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados do usuário:', error);
      logClientError(error, { component: 'Profile', action: 'loadUserData' });
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do perfil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !cachedProfile) return;

    setSaving(true);
    try {
      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });
        if (emailError) throw emailError;
      }

      // Check if question types changed
      const typesChanged =
        JSON.stringify([...selectedQuestionTypes].sort()) !==
        JSON.stringify([...(cachedProfile.selected_question_types || [])].sort());

      // Prepare update object
      const updateData: any = {
        user_id: user.id,
        email,
        full_name: fullName.trim() || null,
      };

      // Only update question types if changed and allowed
      if (typesChanged) {
        if (!canUpdateTypes) {
          toast({
            title: 'Mudança não permitida',
            description: `Você só pode alterar os tipos de questões uma vez por mês. Próxima alteração disponível em: ${nextUpdateDate}`,
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        const maxTypes = PLAN_LIMITS[cachedProfile.plan]?.max_question_types || 1;
        if (selectedQuestionTypes.length > maxTypes) {
          toast({
            title: 'Limite excedido',
            description: `Seu plano permite no máximo ${maxTypes} tipos de questões.`,
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        updateData.selected_question_types = selectedQuestionTypes;
        // Timestamp will be automatically updated by trigger
      }

      // Update profile
      const { error: profileError } = await supabase.from('profiles').upsert({ ...cachedProfile, ...updateData });

      if (profileError) throw profileError;

      // Invalidate cache after update
      if (user.id) {
        await invalidateProfileCache(user.id);
      }

      toast({
        title: 'Sucesso',
        description: typesChanged
          ? 'Perfil e tipos de questões atualizados com sucesso!'
          : 'Perfil atualizado com sucesso!',
      });

      await fetchUserData();
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      logClientError(error, { component: 'Profile', action: 'handleSaveProfile' });
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQuestionType = (typeId: string) => {
    if (!cachedProfile) return;

    const maxTypes = PLAN_LIMITS[cachedProfile.plan]?.max_question_types || 1;

    if (selectedQuestionTypes.includes(typeId)) {
      // Remove type
      setSelectedQuestionTypes(selectedQuestionTypes.filter((t) => t !== typeId));
    } else {
      // Add type if within limit
      if (selectedQuestionTypes.length < maxTypes) {
        setSelectedQuestionTypes([...selectedQuestionTypes, typeId]);
      } else {
        toast({
          title: 'Limite atingido',
          description: `Seu plano ${cachedProfile.plan} permite no máximo ${maxTypes} tipos de questões. Desmarque outro tipo primeiro.`,
          variant: 'destructive',
        });
      }
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user) return;

    setSendingVerification(true);
    try {
      const response = await fetch('/api/profile/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      toast({
        title: 'Email Enviado!',
        description: 'Verifique sua caixa de entrada e clique no link de verificação.',
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de verificação:', error);
      logClientError(error, { component: 'Profile', action: 'handleSendVerificationEmail' });
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o email de verificação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      // First delete profile data
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Delete user assessments
      await supabase.from('assessments').delete().eq('user_id', user.id);

      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso.',
      });

      // Sign out
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      logClientError(error, { component: 'Profile', action: 'handleDeleteAccount' });
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a conta. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais e preferências" />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>Gerencie suas informações pessoais e configurações da conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">{getInitials(fullName || user?.email || '')}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" disabled>
                  <Camera className="h-4 w-4 mr-2" />
                  Alterar Foto
                </Button>
                <p className="text-sm text-muted-foreground mt-1">Em breve - Upload de avatar</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
                <p className="text-sm text-muted-foreground">Alterar o email pode exigir verificação</p>
              </div>

              {/* Email Verification Section */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Status de Verificação de Email
                      {emailVerified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {emailVerified
                        ? 'Seu email está verificado e ativo.'
                        : 'Recomendamos verificar seu email para garantir acesso completo à plataforma.'}
                    </p>
                  </div>
                  {emailVerified ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Verificado</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendVerificationEmail}
                      disabled={sendingVerification}
                    >
                      {sendingVerification ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Verificação'
                      )}
                    </Button>
                  )}
                </div>

                {emailVerified && cachedProfile?.email_verified_at && (
                  <p className="text-xs text-muted-foreground">
                    Verificado em:{' '}
                    {new Date(cachedProfile.email_verified_at).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Question Types Selection */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <Label className="text-base">Tipos de Questões Disponíveis</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {cachedProfile ? (
                    <>
                      Selecione até {PLAN_LIMITS[cachedProfile.plan]?.max_question_types || 1} tipos de questões para
                      usar ({selectedQuestionTypes.length}/{PLAN_LIMITS[cachedProfile.plan]?.max_question_types || 1}{' '}
                      selecionados)
                    </>
                  ) : (
                    'Carregando informações do plano...'
                  )}
                </p>
              </div>

              {!canUpdateTypes && nextUpdateDate && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Limite de Alterações Mensal</AlertTitle>
                  <AlertDescription>
                    Você só pode alterar os tipos de questões uma vez por mês. Próxima alteração disponível em:{' '}
                    <strong>{nextUpdateDate}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUESTION_TYPES.map((type) => {
                    const isSelected = selectedQuestionTypes.includes(type.id);
                    const isDisabled = !canUpdateTypes || !cachedProfile;
                    const hint = getQuestionTypeHint(type.id);

                    return (
                      <Tooltip key={type.id} delayDuration={200}>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                              isSelected ? 'bg-primary/5 border-primary' : 'border-border hover:border-primary/50'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => !isDisabled && handleToggleQuestionType(type.id)}
                          >
                            <Checkbox
                              id={type.id}
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={() => handleToggleQuestionType(type.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={type.id}
                                className={`font-medium cursor-pointer flex items-center gap-1.5 ${
                                  isDisabled ? 'cursor-not-allowed' : ''
                                }`}
                              >
                                {type.label}
                                {hint && <Info className="h-3.5 w-3.5 text-muted-foreground" />}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                          </div>
                        </TooltipTrigger>
                        {hint && (
                          <TooltipContent side="top" className="max-w-sm p-4">
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Melhores Disciplinas
                                </p>
                                <p className="text-sm">{hint.bestDisciplines}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Nível Indicado
                                </p>
                                <p className="text-sm">{hint.educationLevel}</p>
                              </div>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-300">Dica de Uso</AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-400">
                  Escolha os tipos de questões que você mais utiliza. Você poderá alterá-los novamente após 30 dias.
                  Para desbloquear mais tipos, considere fazer upgrade do seu plano.
                </AlertDescription>
              </Alert>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push('/change-password')}>
                Alterar Senha
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-border">
              <CardTitle className="text-destructive mb-2">Zona de Perigo</CardTitle>
              <CardDescription className="mb-4">
                Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
              </CardDescription>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Conta
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão da Conta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados
                      serão permanentemente removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sim, Excluir Conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
