/**
 * Stripe Hooks - Barrel Export
 *
 * Central export point for all Stripe-related React hooks.
 * Provides easy access to products, subscriptions, and plan data with automatic caching.
 *
 * @example
 * ```tsx
 * import { useProducts, useSubscription, usePlan } from '@/hooks/stripe';
 *
 * function Component() {
 *   const { data: products } = useProducts();
 *   const { data: subscription } = useSubscription();
 *   const { plan } = usePlan();
 * }
 * ```
 */

// Products hooks
export { useInvalidateProducts, usePrefetchProducts, useProducts } from './use-products';

// Subscription hooks
export {
  useInvalidateAllStripeData,
  useInvalidateSubscription,
  useSubscription,
  useUpdateSubscriptionCache
} from './use-subscription';

// Plan hooks
export { useCanAccessFeature, useHasPlan, usePlan, usePlanPeriod, type PlanData } from './use-plan';
