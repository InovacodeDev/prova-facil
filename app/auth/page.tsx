'use client';

import { ProvaFacilLogo } from '@/assets/logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ACADEMIC_LEVELS = [
  { value: 'elementary_school', label: 'Ensino Fundamental' },
  { value: 'middle_school', label: 'Ensino Fundamental II' },
  { value: 'high_school', label: 'Ensino Médio' },
  { value: 'technical', label: 'Técnico' },
  { value: 'undergraduate', label: 'Graduação' },
  { value: 'specialization', label: 'Especialização' },
  { value: 'mba', label: 'MBA' },
  { value: 'masters', label: 'Mestrado' },
  { value: 'doctorate', label: 'Doutorado' },
  { value: 'postdoctoral', label: 'Pós-Doutorado' },
  { value: 'extension', label: 'Extensão' },
  { value: 'language_course', label: 'Curso de Idiomas' },
  { value: 'none', label: 'Outro' },
];

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academicLevels, setAcademicLevels] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAcademicLevel, setSelectedAcademicLevel] = useState<string | undefined>(undefined);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    // Verificar se veio erro da confirmação
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');

    if (errorParam === 'confirmation_failed') {
      setError('Falha ao confirmar email. Por favor, tente fazer login ou solicite um novo email de confirmação.');
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', '/auth');
    }

    fetchAcademicLevels();
  }, []);

  const fetchAcademicLevels = async () => {
    const { data, error } = await supabase.from('academic_levels').select('id, name').order('name');

    if (!error && data) {
      setAcademicLevels(
        data.map((level) => ({
          id: (level.id as number).toString(),
          name: ACADEMIC_LEVELS.find((l) => l.value === level.name)?.label || level.name,
        }))
      );
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      // Verificar se o profile existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      console.log(`Fetched profile for user_id ${data.user.id}:`, existingProfile);
      // Se não existir, criar automaticamente
      if (!existingProfile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: data.user.id,
          full_name: data.user.user_metadata?.full_name || null,
          email: data.user.email!,
          academic_level_id: data.user.user_metadata?.academic_level_id
            ? parseInt(data.user.user_metadata.academic_level_id)
            : null,
          email_verified: data.user.email_confirmed_at ? true : false,
          email_verified_at: data.user.email_confirmed_at || null,
        });

        if (profileError) {
          console.error('Erro ao criar profile no login:', profileError);
          setError('Erro ao criar perfil. Por favor, contate o suporte.');
          setIsLoading(false);
          return;
        }
      }

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });
      router.push('/dashboard');
      router.refresh();
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (!selectedAcademicLevel) {
      setError('Por favor, selecione seu nível acadêmico');
      setIsLoading(false);
      return;
    }

    // 1. Criar conta no Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: {
          full_name: fullName,
          academic_level_id: selectedAcademicLevel,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (!signUpData.user) {
      setError('Erro ao criar conta');
      setIsLoading(false);
      return;
    }

    // 2. Criar profile automaticamente com plan=starter e renew_status=none
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: signUpData.user.id,
      full_name: fullName,
      email: email,
      academic_level_id: parseInt(selectedAcademicLevel),
      email_verified: false, // Será atualizado após confirmação
    });

    if (profileError) {
      console.error('Erro ao criar profile:', profileError);
      // Não bloqueamos aqui, pois tentaremos criar o profile no login se necessário
    }

    // 3. Criar customer no Stripe e subscription do plano Starter (gratuito)
    try {
      const response = await fetch('/api/stripe/create-starter-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: signUpData.user.id,
          email: email,
          fullName: fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Erro ao criar subscription Starter:', data);
        // Não bloqueamos o cadastro, mas logamos o erro
        toast({
          title: 'Aviso',
          description:
            'Sua conta foi criada, mas houve um problema ao configurar o plano inicial. Entre em contato com o suporte.',
          variant: 'destructive',
          duration: 8000,
        });
      } else {
        console.log('Starter subscription criada com sucesso:', data);
      }
    } catch (error) {
      console.error('Erro ao criar subscription Starter:', error);
      // Não bloqueamos o cadastro, mas logamos o erro
    }

    // 4. Se o email já está confirmado (ex: domínios permitidos), redirecionar
    if (signUpData.session) {
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já está logado e será redirecionado. Seu plano Starter foi ativado!',
      });
      router.push('/dashboard');
      router.refresh();
      setIsLoading(false);
      return;
    }

    // 5. Caso contrário, solicitar confirmação de email
    toast({
      title: 'Conta criada com sucesso!',
      description:
        'Enviamos um email de confirmação. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.',
      duration: 10000,
    });

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <ProvaFacilLogo className="h-8" />
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
            <CardDescription>Entre na sua conta ou crie uma nova para começar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Sign In Form */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Seu nome"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-academic-level">Nível Acadêmico</Label>
                    <Select value={selectedAcademicLevel} onValueChange={setSelectedAcademicLevel} disabled={isLoading}>
                      <SelectTrigger id="signup-academic-level">
                        <SelectValue placeholder="Selecione seu nível acadêmico" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
