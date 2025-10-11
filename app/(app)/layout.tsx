'use client';

import { ReactNode } from 'react';
import { AppLayout } from '@/components/layout';

interface AppGroupLayoutProps {
  children: ReactNode;
}

/**
 * Layout compartilhado para todas as rotas autenticadas
 * Mantém o AppLayout (Header + Sidebar) persistente durante navegação
 * Evita o efeito de "piscada" do header
 */
export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
