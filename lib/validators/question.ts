/**
 * Question Validators
 * Validates question types against user's plan
 */

import { createClient } from '@/lib/supabase/server';
import { logError } from '../error-logs-service';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate if user's plan allows the requested question type
 * @param userId - The user's UUID
 * @param questionType - The question type to validate
 * @returns Validation result with error message if invalid
 */
export async function validateQuestionType(userId: string, questionType: string): Promise<ValidationResult> {
  try {
    const supabase = await createClient();

    // Get user's profile and plan
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return {
        valid: false,
        error: 'Perfil de usuário não encontrado',
      };
    }

    // Get plan details
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('allowed_questions')
      .eq('id', userProfile.plan)
      .single();

    if (planError || !planData) {
      return {
        valid: false,
        error: 'Configuração de plano inválida',
      };
    }

    const allowedQuestions = planData.allowed_questions;

    if (!allowedQuestions || !Array.isArray(allowedQuestions)) {
      return {
        valid: false,
        error: 'Configuração de plano inválida',
      };
    }

    // Check if question type is allowed
    const isAllowed = allowedQuestions.some((type: string) => type === questionType);

    if (!isAllowed) {
      const planName = userProfile.plan;
      return {
        valid: false,
        error: `O tipo de questão "${questionType}" não está disponível no plano ${planName}. Faça upgrade para acessar mais tipos de questões.`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating question type:', error);

    await logError({
      message: error instanceof Error ? error.message : 'Error validating question type',
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      context: {
        function: 'validateQuestionType',
        userId,
        questionType,
      },
    });

    return {
      valid: false,
      error: 'Erro ao validar tipo de questão',
    };
  }
}

/**
 * Get all allowed question types for a user
 * @param userId - The user's UUID
 * @returns Array of allowed question types
 */
export async function getAllowedQuestionTypes(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient();

    // Get user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return [];
    }

    // Get plan details
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('allowed_questions')
      .eq('id', userProfile.plan)
      .single();

    if (planError || !planData) {
      return [];
    }

    return (planData.allowed_questions as string[]) || [];
  } catch (error) {
    console.error('Error getting allowed question types:', error);

    await logError({
      message: error instanceof Error ? error.message : 'Error getting allowed question types',
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      context: {
        function: 'getAllowedQuestionTypes',
        userId,
      },
    });

    return [];
  }
}
