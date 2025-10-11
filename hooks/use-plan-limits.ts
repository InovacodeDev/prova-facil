/**
 * Hook: usePlanLimits
 *
 * Centraliza a lógica de limites de planos.
 * Define os limites de cada plano (questões, tipos, uploads, etc).
 */

import { useMemo } from 'react';

export interface PlanLimits {
  monthlyQuestions: number;
  maxQuestionTypes: number;
  maxDocumentSizeMB: number;
  docTypes: string[];
  supportTypes: string[];
}

/**
 * Configuração de limites para cada plano
 */
const PLAN_LIMITS_CONFIG: Record<string, PlanLimits> = {
  starter: {
    monthlyQuestions: 25,
    maxQuestionTypes: 1,
    maxDocumentSizeMB: 10,
    docTypes: ['text', 'docx', 'txt'],
    supportTypes: ['email'],
  },
  basic: {
    monthlyQuestions: 50,
    maxQuestionTypes: 2,
    maxDocumentSizeMB: 20,
    docTypes: ['text', 'docx', 'txt'],
    supportTypes: ['email'],
  },
  essentials: {
    monthlyQuestions: 75,
    maxQuestionTypes: 3,
    maxDocumentSizeMB: 30,
    docTypes: ['text', 'docx', 'txt', 'pdf', 'url'],
    supportTypes: ['email', 'whatsapp'],
  },
  plus: {
    monthlyQuestions: 100,
    maxQuestionTypes: 4,
    maxDocumentSizeMB: 40,
    docTypes: ['text', 'docx', 'txt', 'pdf', 'pptx', 'url'],
    supportTypes: ['email', 'whatsapp', 'vip'],
  },
  advanced: {
    monthlyQuestions: 150,
    maxQuestionTypes: 6,
    maxDocumentSizeMB: 50,
    docTypes: ['text', 'docx', 'txt', 'pdf', 'pptx', 'url'],
    supportTypes: ['email', 'whatsapp', 'vip'],
  },
};

/**
 * Hook para obter limites de um plano específico
 */
export function usePlanLimits(planId: string = 'starter') {
  const limits = useMemo(() => {
    return PLAN_LIMITS_CONFIG[planId.toLowerCase()] || PLAN_LIMITS_CONFIG.starter;
  }, [planId]);

  return limits;
}

/**
 * Utilitário: Verifica se um plano suporta um tipo de documento
 */
export function planSupportsDocType(planId: string, docType: string): boolean {
  const limits = PLAN_LIMITS_CONFIG[planId.toLowerCase()] || PLAN_LIMITS_CONFIG.starter;
  return limits.docTypes.includes(docType.toLowerCase());
}

/**
 * Utilitário: Calcula questões restantes no mês
 */
export function getRemainingQuestions(planId: string, usedQuestions: number): number {
  const limits = PLAN_LIMITS_CONFIG[planId.toLowerCase()] || PLAN_LIMITS_CONFIG.starter;
  return Math.max(0, limits.monthlyQuestions - usedQuestions);
}

/**
 * Utilitário: Verifica se pode selecionar mais tipos de questões
 */
export function canSelectMoreQuestionTypes(planId: string, currentSelection: number): boolean {
  const limits = PLAN_LIMITS_CONFIG[planId.toLowerCase()] || PLAN_LIMITS_CONFIG.starter;
  return currentSelection < limits.maxQuestionTypes;
}

/**
 * Exporta constante para uso direto (compatibilidade)
 */
export const PLAN_LIMITS = PLAN_LIMITS_CONFIG;
