/**
 * Header Global da Aplicação
 *
 * Componente fixo no topo de todas as páginas autenticadas.
 *
 * Estrutura:
 * - Logo na esquerda (clicável para dashboard)
 * - Slot para ações contextuais (ex: botão "Nova Questão")
 * - Avatar do usuário na direita com dropdown
 *
 * Responsabilidades:
 * - Navegação rápida via logo
 * - Menu do usuário (perfil, uso, faturamento, logout)
 * - Ações contextuais da página atual
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { User, Settings, CreditCard, LogOut, Lock, BarChart3, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { logClientError } from '@/lib/client-error-logger';

interface HeaderProps {
  /**
   * Ação contextual da página atual (opcional)
   * Ex: { label: 'Nova Questão', icon: <Plus />, onClick: () => router.push('/new-question') }
   */
  contextAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  /**
   * Callback para alternar sidebar (expandido/recolhido ou abrir/fechar no mobile)
   */
  onToggleSidebar?: () => void;
  /**
   * Estado da sidebar (para acessibilidade e indicadores visuais)
   */
  isSidebarOpen?: boolean;
}

/**
 * Header global com logo, ações contextuais e menu do usuário
 */
export function Header({ contextAction, onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('U');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
          // Gera iniciais do email (primeiro caractere antes do @)
          const initial = user.email.charAt(0).toUpperCase();
          setUserInitials(initial);
        }
      } catch (error) {
        logClientError(error, { component: 'Header', action: 'fetchUser' });
      }
    };

    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      logClientError(error, { component: 'Header', action: 'handleLogout' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Botão Hamburger - Toggle Sidebar (à esquerda) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Recolher sidebar' : 'Expandir sidebar'}
            className="p-2 rounded-md hover:bg-muted transition-colors mr-2"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {/* Spacer para empurrar conteúdo para direita */}
        <div className="flex-1" />

        {/* Ação contextual (se houver) */}
        {contextAction && (
          <button
            onClick={contextAction.onClick}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mr-4"
          >
            {contextAction.icon}
            <span className="ml-2 hidden sm:inline-block">{contextAction.label}</span>
          </button>
        )}

        {/* Avatar do usuário - direita */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all focus:outline-none focus:ring-primary">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Minha Conta</p>
                {userEmail && <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/change-password')} className="cursor-pointer">
              <Lock className="mr-2 h-4 w-4" />
              <span>Alterar senha</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/usage')} className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Uso da Conta</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/billing')} className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Faturamento</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/plan')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Plano</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
