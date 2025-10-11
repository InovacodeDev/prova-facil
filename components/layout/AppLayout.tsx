/**
 * AppLayout
 *
 * Layout padrão para páginas autenticadas da aplicação.
 *
 * Estrutura:
 * - Header global fixo no topo (logo, ações contextuais, menu usuário)
 * - Sidebar fixa na lateral esquerda (navegação principal)
 * - Área de conteúdo com margin-left para compensar sidebar
 * - Conteúdo envolto em PageHeaderContainer (1264px max-width)
 *
 * Responsabilidades:
 * - Aplicar estrutura padrão em todas as páginas autenticadas
 * - Gerenciar espaçamento entre header, sidebar e conteúdo
 * - Responsividade (sidebar colapsável em mobile)
 * - Passar ações contextuais da página para o header
 * - Gerenciar estados da sidebar (expandido/recolhido/mobile overlay)
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from '@/components/Sidebar';
import { PageHeaderContainer } from './PageHeaderContainer';

interface AppLayoutProps {
  children: ReactNode;
  /**
   * Ação contextual da página (opcional)
   * Ex: { label: 'Nova Questão', icon: <Plus />, onClick: () => router.push('/new-question') }
   */
  contextAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  /**
   * Se false, não envolve children em PageHeaderContainer
   * Útil quando a página precisa de controle total sobre o layout
   */
  useContainer?: boolean;
}

/**
 * Layout wrapper padrão para páginas autenticadas
 */
export function AppLayout({ children, contextAction, useContainer = true }: AppLayoutProps) {
  // Estado da sidebar: expandida (true) ou recolhida (false) no desktop
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Estado do overlay mobile: aberto (true) ou fechado (false)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detecta se estamos em desktop (>= 1024px)
  const [isDesktop, setIsDesktop] = useState(true);

  // Media query listener para detectar mudanças de viewport
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    // Set inicial
    setIsDesktop(mediaQuery.matches);

    // Handler para mudanças
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      // Ao voltar pro desktop, fechar overlay mobile
      if (e.matches) {
        setMobileOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  /**
   * Toggle sidebar: desktop alterna expandido/recolhido, mobile abre/fecha overlay
   */
  const handleToggleSidebar = () => {
    if (isDesktop) {
      setSidebarExpanded(!sidebarExpanded);
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  /**
   * Fecha overlay mobile (quando clica fora ou em link de navegação)
   */
  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  return (
    <div className="bg-background">
      {/* Header global fixo no topo */}
      <Header
        contextAction={contextAction}
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isDesktop ? sidebarExpanded : mobileOpen}
      />

      {/* Sidebar com estados: desktop expandido/recolhido, mobile overlay */}
      <Sidebar isExpanded={sidebarExpanded} isMobileOpen={mobileOpen} onClose={handleCloseMobile} />

      {/* Área de conteúdo principal */}
      {/* Ajusta margin-left baseado no estado da sidebar */}
      <main
        className={`
          min-h-screen 
          transition-all duration-300
          ${isDesktop ? (sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20') : ''}
        `}
      >
        {/* Container interno com scroll e bordas */}
        {/* NO MOBILE: sem border-radius. NO DESKTOP: border-radius */}
        <div className="h-[calc(100vh-64px)] overflow-auto border-l border-t rounded-none lg:rounded-tl-lg">
          <div className="max-w-7xl mx-auto">
            {useContainer ? <PageHeaderContainer>{children}</PageHeaderContainer> : children}
          </div>
        </div>
      </main>
    </div>
  );
}
