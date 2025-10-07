'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cacheService } from '@/lib/cache-service';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  plan: string;
  email_verified: boolean;
  email_verified_at: string | null;
  selected_question_types: string[];
  question_types_updated_at: string | null;
}

interface PlanData {
  id: string;
  questions_month: number;
  doc_type: string[];
  docs_size: number;
  max_question_types: number;
  support: string[];
}

interface UsageData {
  total_questions: number;
  subjects_breakdown: any;
}

/**
 * Hook to get user profile with caching
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          setLoading(false);
          return;
        }

        const cacheKey = `profile:${user.id}` as const;

        // Try cache first
        const cached = cacheService.get<Profile>(cacheKey);
        if (cached && !cancelled) {
          setProfile(cached);
          setLoading(false);
          return;
        }

        // Fetch from database
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select(
            'id, user_id, full_name, email, plan, email_verified, email_verified_at, selected_question_types, question_types_updated_at'
          )
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (data && !cancelled) {
          // Cache for 1 hour
          cacheService.set(cacheKey, data, 60 * 60 * 1000);
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { profile, loading, error };
}

/**
 * Hook to get plan data with caching
 */
export function usePlan(planId: string | null | undefined) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPlan() {
      if (!planId) return;

      try {
        const cacheKey = `plan:${planId}` as const;

        // Try cache first
        const cached = cacheService.get<PlanData>(cacheKey);
        if (cached && !cancelled) {
          setPlan(cached);
          setLoading(false);
          return;
        }

        // Fetch from database
        const { data, error: fetchError } = await supabase
          .from('plans')
          .select('id, questions_month, doc_type, docs_size, max_question_types, support')
          .eq('id', planId)
          .single();

        if (fetchError) throw fetchError;

        if (data && !cancelled) {
          // Cache for 1 hour
          cacheService.set(cacheKey, data, 60 * 60 * 1000);
          setPlan(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPlan();

    return () => {
      cancelled = true;
    };
  }, [planId, supabase]);

  return { plan, loading, error };
}

/**
 * Hook to get monthly usage with caching
 */
export function useMonthlyUsage(userId: string | null | undefined) {
  const [usage, setUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) {
      setUsage(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchUsage() {
      if (!userId) return;

      try {
        const now = new Date();
        const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const cacheKey = `usage:${userId}:${cycle}` as const;

        // Try cache first (shorter TTL for usage - 5 minutes)
        const cached = cacheService.get<UsageData>(cacheKey);
        if (cached && !cancelled) {
          setUsage(cached.total_questions);
          setLoading(false);
          return;
        }

        // Fetch from database
        const { data, error: fetchError } = await supabase
          .from('profile_logs_cycle')
          .select('total_questions, subjects_breakdown')
          .eq('user_id', userId)
          .eq('cycle', cycle)
          .maybeSingle();

        if (fetchError) throw fetchError;

        const usageData: UsageData = data || { total_questions: 0, subjects_breakdown: {} };

        if (!cancelled) {
          // Cache for 5 minutes (usage changes more frequently)
          cacheService.set(cacheKey, usageData, 5 * 60 * 1000);
          setUsage(usageData.total_questions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUsage();

    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  return { usage, loading, error };
}

/**
 * Invalidate user cache when profile is updated
 */
export function invalidateProfileCache(userId: string) {
  cacheService.invalidate(`profile:${userId}`);
}

/**
 * Invalidate usage cache when questions are created
 */
export function invalidateUsageCache(userId: string) {
  const now = new Date();
  const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  cacheService.invalidate(`usage:${userId}:${cycle}`);
}
