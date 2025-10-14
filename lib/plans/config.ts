/**
 * Plan Configuration (Frontend)
 *
 * This file defines the static plan information displayed in the UI.
 * Only name and prices come from Stripe API, everything else is defined here.
 *
 * Architecture:
 * - Name & Prices: From Stripe API (dynamic)
 * - Features, descriptions, AI level, limits: Defined here (static)
 */

export type PlanId = 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';

export interface PlanConfig {
  id: PlanId;
  displayName: string; // Fallback name if Stripe doesn't provide
  description: string;
  aiLevel: string;
  questionsPerMonth: number;
  maxQuestionTypes: number;
  documentTypes: string[];
  maxDocumentSize: string;
  support: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}

/**
 * Plan Configurations
 * Update this object to change plan features displayed in the UI
 */
export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  starter: {
    id: 'starter',
    displayName: 'Starter',
    description: 'Perfeito para começar a criar questões',
    aiLevel: 'IA Básica',
    questionsPerMonth: 30,
    maxQuestionTypes: 1,
    documentTypes: ['PDF', 'TXT'],
    maxDocumentSize: '10 MB',
    support: 'Email',
    highlighted: false,
    features: [
      'Até 25 questões/mês para suas primeiras turmas',
      '1 tipo de questão personalizável',
      'Upload de arquivos TXT e DOCX (10MB)',
      'Entrada de texto direto',
      'Suporte por email',
    ],
  },
  basic: {
    id: 'basic',
    displayName: 'Básico',
    description: 'Ideal para professores individuais',
    aiLevel: 'IA Básica',
    questionsPerMonth: 100,
    maxQuestionTypes: 3,
    documentTypes: ['PDF', 'TXT', 'DOCX'],
    maxDocumentSize: '25 MB',
    support: 'Email prioritário',
    highlighted: false,
    features: [
      'Até 50 questões/mês, ideal para aulas semanais',
      'Até 2 tipos de questões disponíveis',
      'Upload de arquivos TXT e DOCX (20MB)',
      'Entrada de texto direto',
      'Suporte prioritário com resposta em 24h',
    ],
  },
  essentials: {
    id: 'essentials',
    displayName: 'Essencial',
    description: 'Melhor custo-benefício para educadores',
    aiLevel: 'IA Avançada',
    questionsPerMonth: 300,
    maxQuestionTypes: 5,
    documentTypes: ['PDF', 'TXT', 'DOCX', 'PPTX'],
    maxDocumentSize: '50 MB',
    support: 'WhatsApp',
    highlighted: true,
    badge: 'Mais Popular',
    features: [
      'Até 75 questões/mês para diversas disciplinas',
      'Até 3 tipos de questões disponíveis',
      'Upload de PDF, DOCX, TXT e links externos (30MB)',
      'IA avançada com maior precisão contextual',
      'Suporte prioritário via email e WhatsApp',
    ],
  },
  plus: {
    id: 'plus',
    displayName: 'Plus',
    description: 'Solução completa para instituições',
    aiLevel: 'IA Avançada',
    questionsPerMonth: 1000,
    maxQuestionTypes: 10,
    documentTypes: ['PDF', 'TXT', 'DOCX', 'PPTX', 'XLSX'],
    maxDocumentSize: '100 MB',
    support: 'WhatsApp + Chat',
    highlighted: false,
    features: [
      'Até 100 questões/mês, liberdade para criar sem limites',
      'Até 4 tipos de questões disponíveis',
      'Upload de PPTX, PDF, DOCX, TXT + links (40MB)',
      'IA avançada otimizada para contextos técnicos',
      'Suporte VIP com atendimento prioritário',
    ],
  },
  advanced: {
    id: 'advanced',
    displayName: 'Avançado',
    description: 'Para grandes instituições e universidades',
    aiLevel: 'IA Premium',
    questionsPerMonth: -1, // Unlimited
    maxQuestionTypes: -1, // Unlimited
    documentTypes: ['Todos os formatos'],
    maxDocumentSize: 'Ilimitado',
    support: 'VIP 24/7',
    highlighted: false,
    features: [
      'Até 150 questões/mês com máxima qualidade',
      'Todos os 6 tipos de questões disponíveis',
      'Upload de PPTX, PDF, DOCX, TXT + links (50MB)',
      'IA Premium com precisão máxima e contexto profundo',
      'Suporte VIP dedicado com resposta imediata',
    ],
  },
};

/**
 * Gets plan configuration by ID
 * Returns starter as fallback if plan not found
 */
export function getPlanConfig(planId: string): PlanConfig {
  return PLAN_CONFIGS[planId as PlanId] || PLAN_CONFIGS.starter;
}

/**
 * Gets formatted questions per month display
 */
export function getQuestionsDisplay(count: number): string {
  if (count === -1) return 'Ilimitadas';
  return `${count} questões`;
}

/**
 * Gets formatted max question types display
 */
export function getQuestionTypesDisplay(count: number): string {
  if (count === -1) return 'Todos os tipos';
  return `${count} tipo${count > 1 ? 's' : ''}`;
}
