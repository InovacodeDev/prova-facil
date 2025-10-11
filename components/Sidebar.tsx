'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, ClipboardList, X, Crown, Zap, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useProfile } from '@/hooks/use-cache';
import { cn } from '@/lib/utils';
import { ProvaFacilLogo } from '@/assets/logo';

interface SidebarProps {
  /**
   * Desktop: sidebar expandida (true) ou recolhida apenas com ícones (false)
   */
  isExpanded?: boolean;
  /**
   * Mobile: overlay aberto (true) ou fechado (false)
   */
  isMobileOpen?: boolean;
  /**
   * Callback para fechar o overlay mobile
   */
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

const platformItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new-assessment', label: 'Criar Questões', icon: FileText },
  { href: '/my-assessments', label: 'Minhas Questões', icon: ClipboardList },
];

const planNames: Record<string, string> = {
  starter: 'Starter',
  basic: 'Basic',
  essentials: 'Essentials',
  plus: 'Plus',
  advanced: 'Advanced',
};

const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  starter: Zap,
  basic: Zap,
  essentials: Zap,
  plus: Crown,
  advanced: Crown,
};

export function Sidebar({ isExpanded = true, isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useProfile();

  // Previne scroll do body quando overlay mobile está aberto
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const currentPlan = profile?.plan || 'starter';
  const isNotPremium = currentPlan === 'starter';
  const PlanIcon = planIcons[currentPlan] || Zap;

  /**
   * Handler para navegação: fecha overlay mobile ao clicar em link
   */
  const handleNavClick = () => {
    if (isMobileOpen && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* DESKTOP SIDEBAR - sempre visível em telas >= 1024px */}
      <aside
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col',
          'bg-background pt-16 transition-all duration-300',
          isExpanded ? 'lg:w-64' : 'lg:w-20'
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {platformItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  !isExpanded && 'justify-center'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium overflow-ellipsis whitespace-nowrap transition-opacity duration-300">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Current Plan */}
        <div className="p-4 border-t">
          {isExpanded ? (
            // Expandido: Mostrar card completo
            <Card className="p-4 space-y-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <PlanIcon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Plano Ativo</p>
                    <p className="text-sm font-medium truncate">{planNames[currentPlan]}</p>
                  </div>
                </div>
                {(currentPlan === 'basic' || currentPlan === 'advanced') && (
                  <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0">
                    {planNames[currentPlan]}
                  </Badge>
                )}
              </div>

              {currentPlan !== 'advanced' && (
                <Link href="/plan">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    <span className="truncate">Fazer Upgrade</span>
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            // Recolhido: Mostrar apenas ícone centralizado
            <Link
              href="/plan"
              className="flex items-center justify-center p-3 rounded-lg hover:bg-muted transition-colors"
              title={`Plano: ${planNames[currentPlan]}`}
            >
              <PlanIcon className="h-6 w-6 text-primary" />
            </Link>
          )}
        </div>
      </aside>

      {/* MOBILE OVERLAY - apenas em telas < 1024px */}
      {isMobileOpen && (
        <>
          {/* Backdrop - fecha ao clicar fora */}
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />

          {/* Sidebar Modal */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-background z-50 lg:hidden flex flex-col">
            {/* Logo no topo */}
            <div className="h-16 flex items-center justify-center px-4 border-b">
              <ProvaFacilLogo clickable={false} className="h-8" />
            </div>

            {/* Botão fechar (X) no canto superior direito */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {platformItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg',
                      'transition-colors duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer - Current Plan */}
            <div className="p-4 border-t">
              <Card className="p-4 space-y-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlanIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Plano Ativo</p>
                    </div>
                  </div>
                  {(currentPlan === 'basic' || currentPlan === 'advanced') && (
                    <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                      {planNames[currentPlan]}
                    </Badge>
                  )}
                </div>

                {currentPlan !== 'advanced' && (
                  <Link href="/plan" onClick={handleNavClick}>
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                      size="sm"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </Link>
                )}
              </Card>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
