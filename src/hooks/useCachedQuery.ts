// Optimized query hooks with caching and fast loading
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { memoryCache, deduplicateRequest } from './usePerformance';

interface OptimizedQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  useCache?: boolean;
  cacheKey?: string;
}

/**
 * Enhanced useQuery with built-in caching and deduplication
 * Ensures faster subsequent loads and prevents duplicate requests
 */
export const useCachedQuery = <TData,>(
  queryKey: (string | undefined)[],
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData>
) => {
  const { useCache = true, cacheKey, ...queryOptions } = options || {};
  const cacheKeyStr = cacheKey || queryKey.join(':');

  return useQuery<TData>({
    queryKey: queryKey as unknown[],
    queryFn: async () => {
      if (useCache) {
        const cached = memoryCache.get(cacheKeyStr);
        if (cached) {
          console.debug(`📦 Cache hit for ${cacheKeyStr}`);
          return cached;
        }
      }

      const data = await deduplicateRequest(cacheKeyStr, queryFn);
      
      if (useCache) {
        memoryCache.set(cacheKeyStr, data);
      }

      return data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    ...queryOptions,
  });
};

/**
 * Prefetch query for better performance
 */
export const prefetchQuery = async (
  queryKey: string[],
  queryFn: () => Promise<any>,
  queryClient: any
) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 30000,
  });
};
