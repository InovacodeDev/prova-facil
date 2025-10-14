/**
 * useProfile Hook with Realtime Support
 *
 * Fetches user profile data with automatic realtime updates from Supabase.
 * Uses React Query for caching and Supabase Realtime for live updates.
 *
 * Features:
 * - Automatic realtime updates when profile changes
 * - React Query caching (1 hour staleTime)
 * - Optimistic updates support
 * - Type-safe profile data
 * - Automatic subscription cache invalidation on Stripe field changes
 *
 * Synchronization:
 * When Stripe-related fields (stripe_customer_id, stripe_subscription_id) change
 * in the profile, this hook automatically invalidates the subscription cache to
 * ensure that subscription data stays in sync with the profile.
 *
 * @example
 * ```tsx
 * function ProfileDisplay() {
 *   const { profile, isLoading, error } = useProfile();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorMessage />;
 *
 *   return <div>Welcome, {profile.full_name}!</div>;
 * }
 * ```
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  email_verified: boolean;
  email_verified_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string; // Direct FK to plans.id - always present, defaults to 'starter'
  academic_level_id: number | null;
  allowed_cookies: string[];
  selected_question_types: string[];
  question_types_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

/**
 * Fetches profile data from Supabase
 */
async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();

  if (error) {
    console.error('[useProfile] Error fetching profile:', error);
    throw error;
  }

  return data;
}

/**
 * Hook to fetch user profile with realtime updates
 *
 * @returns Profile data with loading and error states
 */
export function useProfile() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: ONE_HOUR_IN_MS,
    gcTime: 2 * ONE_HOUR_IN_MS,
  });

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
    staleTime: ONE_HOUR_IN_MS,
    gcTime: 2 * ONE_HOUR_IN_MS,
  });

  // Setup Realtime subscription
  useEffect(() => {
    if (!user?.id || !profile?.id) return;

    console.log('[useProfile] Setting up Realtime subscription for profile:', profile.id);

    // Subscribe to changes on the specific profile
    const channel = supabase
      .channel(`profile:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('[useProfile] Realtime update received:', payload);

          if (payload.eventType === 'UPDATE' && payload.new) {
            const oldProfile = payload.old as Profile;
            const newProfile = payload.new as Profile;

            // Update the profile cache with new data
            queryClient.setQueryData(['profile', user.id], newProfile);

            // Check if Stripe-related fields or plan_id changed
            const stripeFieldsChanged =
              oldProfile.stripe_customer_id !== newProfile.stripe_customer_id ||
              oldProfile.stripe_subscription_id !== newProfile.stripe_subscription_id;

            const planChanged = oldProfile.plan_id !== newProfile.plan_id;

            if (stripeFieldsChanged) {
              console.log('[useProfile] Stripe fields changed, invalidating subscription cache');
              // Invalidate subscription cache to force refetch
              queryClient.invalidateQueries({ queryKey: ['subscription'] });
              // Also invalidate plan cache since it depends on subscription
              queryClient.invalidateQueries({ queryKey: ['plan-id'] });
            }

            if (planChanged) {
              console.log('[useProfile] Plan changed from', oldProfile.plan_id, 'to', newProfile.plan_id);
              // Invalidate plan cache to reflect new plan
              queryClient.invalidateQueries({ queryKey: ['plan-id'] });
            }
          } else if (payload.eventType === 'DELETE') {
            // Invalidate cache if profile is deleted
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            queryClient.invalidateQueries({ queryKey: ['plan-id'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('[useProfile] Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[useProfile] Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.id, supabase, queryClient]);

  return {
    profile,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to update profile data with optimistic updates
 *
 * @example
 * ```tsx
 * function UpdateProfileForm() {
 *   const { updateProfile, isUpdating } = useUpdateProfile();
 *
 *   const handleSubmit = async (data) => {
 *     await updateProfile(data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useUpdateProfile() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const updateProfile = async (userId: string, updates: Partial<Profile>) => {
    // Optimistic update
    queryClient.setQueryData(['profile', userId], (old: Profile | undefined) => {
      if (!old) return old;
      return { ...old, ...updates, updated_at: new Date().toISOString() };
    });

    try {
      const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', userId).select().single();

      if (error) throw error;

      // Update cache with server response
      queryClient.setQueryData(['profile', userId], data);

      return data;
    } catch (error) {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      throw error;
    }
  };

  return { updateProfile };
}

/**
 * Invalidate profile cache manually
 * Useful when you know the profile has changed and want to force a refetch
 */
export function invalidateProfileCache(userId: string) {
  const queryClient = useQueryClient();
  queryClient.invalidateQueries({ queryKey: ['profile', userId] });
}
