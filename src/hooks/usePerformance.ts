// Performance optimization hook
import { useEffect } from 'react';

export interface CacheConfig {
  enableOfflineCache?: boolean;
  enableMemoryCache?: boolean;
  staleTimes?: {
    books?: number;
    orders?: number;
    events?: number;
    general?: number;
  };
  gcTimes?: {
    default?: number;
  };
}

// Default performance config
export const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = {
  enableOfflineCache: true,
  enableMemoryCache: true,
  staleTimes: {
    books: 30000, // 30 seconds for books
    orders: 10000, // 10 seconds for orders (real-time)
    events: 60000, // 1 minute for events
    general: 45000, // 45 seconds for general data
  },
  gcTimes: {
    default: 5 * 60 * 1000, // 5 minutes garbage collection
  }
};

// Memory cache for in-memory storage
class MemoryCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private gcInterval: NodeJS.Timeout | null = null;

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    return this.cache.get(key)?.data;
  }

  clear() {
    this.cache.clear();
  }

  startGC(interval: number = 5 * 60 * 1000) {
    if (this.gcInterval) clearInterval(this.gcInterval);
    this.gcInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, { timestamp }] of this.cache.entries()) {
        if (now - timestamp > interval) {
          this.cache.delete(key);
        }
      }
    }, interval);
  }

  stopGC() {
    if (this.gcInterval) clearInterval(this.gcInterval);
  }
}

export const memoryCache = new MemoryCache();

// Preload critical data
export const preloadCriticalData = async (queryClient: any) => {
  try {
    // Preload with prefetch
    await queryClient.prefetchQuery({
      queryKey: ['menu-items'],
      queryFn: async () => {
        const items = localStorage.getItem('canteen_menu_items');
        return items ? JSON.parse(items) : [];
      },
      staleTime: 30000,
    });
  } catch (error) {
    console.debug('Preload error:', error);
  }
};

// Request deduplication helper
const requestCache = new Map<string, Promise<any>>();

export const deduplicateRequest = async <T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> => {
  if (requestCache.has(key)) {
    return requestCache.get(key) as Promise<T>;
  }

  const promise = fn().finally(() => {
    requestCache.delete(key);
  });

  requestCache.set(key, promise);
  return promise;
};

// Performance monitoring
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Monitor First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.debug(`⚡ ${entry.name}: ${Math.round(entry.duration)}ms`);
          }
        });
        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (error) {
        console.debug('Performance observer error:', error);
      }
    }
  }, []);
};

// Lazy loading helper
export const useLazyLoad = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, callback]);
};

// Start garbage collection on app load
memoryCache.startGC(DEFAULT_CACHE_CONFIG.gcTimes.default);
