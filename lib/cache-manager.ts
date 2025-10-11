/**
 * Cache Service - Sistema de cache com localStorage e TTL
 *
 * Diferentes estratégias de cache:
 * - Subscription: Reseta às 6h AM do dia seguinte
 * - Dados sensíveis (payment): 10 minutos
 * - Produtos Stripe: 1 dia (6h AM do dia seguinte)
 * - Profile: 10 minutos
 */

export type CacheStrategy = 'subscription' | 'sensitive' | 'daily' | 'profile';

interface CacheData<T> {
  data: T;
  timestamp: number;
  strategy: CacheStrategy;
}

/**
 * Calcula o próximo reset às 6h AM
 */
function getNext6AM(): number {
  const now = new Date();
  const next6AM = new Date(now);

  // Define para 6h AM
  next6AM.setHours(6, 0, 0, 0);

  // Se já passou das 6h hoje, vai para 6h de amanhã
  if (now >= next6AM) {
    next6AM.setDate(next6AM.getDate() + 1);
  }

  return next6AM.getTime();
}

/**
 * Verifica se o cache é válido baseado na estratégia
 */
function isCacheValid(cachedData: CacheData<any>): boolean {
  const now = Date.now();
  const { timestamp, strategy } = cachedData;

  switch (strategy) {
    case 'subscription':
    case 'daily': {
      // Verifica se ainda não passou das 6h AM do dia seguinte
      const next6AM = getNext6AM();
      return timestamp < next6AM && now < next6AM;
    }

    case 'sensitive':
    case 'profile': {
      // 10 minutos
      const TEN_MINUTES = 10 * 60 * 1000;
      return now - timestamp < TEN_MINUTES;
    }

    default:
      return false;
  }
}

/**
 * Salva dados no cache com estratégia específica
 */
export function setCache<T>(key: string, data: T, strategy: CacheStrategy): void {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      strategy,
    };

    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Erro ao salvar cache (${key}):`, error);
  }
}

/**
 * Busca dados do cache
 */
export function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const cacheData: CacheData<T> = JSON.parse(cached);

    // Verifica se o cache é válido
    if (!isCacheValid(cacheData)) {
      // Cache expirado, remove
      localStorage.removeItem(key);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error(`Erro ao buscar cache (${key}):`, error);
    return null;
  }
}

/**
 * Remove item do cache
 */
export function removeCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover cache (${key}):`, error);
  }
}

/**
 * Limpa todo o cache
 */
export function clearAllCache(): void {
  try {
    // Remove apenas as chaves de cache da aplicação
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(
      (key) => key.startsWith('cache-') || key.includes('-cache') || key === 'stripe-products-cache'
    );

    cacheKeys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
}

/**
 * Chaves de cache padronizadas
 */
export const CACHE_KEYS = {
  SUBSCRIPTION: 'cache-subscription',
  STRIPE_PRODUCTS: 'stripe-products-cache',
  PAYMENT_HISTORY: 'cache-payment-history',
  PROFILE: 'cache-profile',
  USER_PREFERENCES: 'cache-user-preferences',
} as const;
