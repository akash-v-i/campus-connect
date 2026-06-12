// Data preloading and initialization service for faster app startup
import { QueryClient } from '@tanstack/react-query';

/**
 * Initialize and preload critical data for instant loading
 * Call this on app startup for best performance
 */
export const initializeAppPerformance = async (queryClient: QueryClient) => {
  try {
    // Initialize localStorage if empty
    const initMenuItems = async () => {
      const existing = localStorage.getItem('canteen_menu_items');
      if (!existing) {
        const sampleItems = [
          { id: 'menu_001', name: 'Chicken Biryani', price: 120, available: true },
          { id: 'menu_002', name: 'Paneer Butter Masala', price: 100, available: true },
          { id: 'menu_003', name: 'Vegetable Fried Rice', price: 80, available: true },
        ];
        localStorage.setItem('canteen_menu_items', JSON.stringify(sampleItems));
      }
    };

    const initOrders = async () => {
      const existing = localStorage.getItem('canteen_orders');
      if (!existing) {
        localStorage.setItem('canteen_orders', JSON.stringify([]));
      }
    };

    // Run initializations in parallel
    await Promise.all([initMenuItems(), initOrders()]);

    // Prefetch menu items in background
    queryClient.prefetchQuery({
      queryKey: ['menu-items'],
      queryFn: async () => {
        const items = localStorage.getItem('canteen_menu_items');
        return items ? JSON.parse(items) : [];
      },
      staleTime: 30000,
    }).catch(() => {
      // Ignore prefetch errors
    });

    console.log('✅ App performance initialized - data preloaded and cached');
  } catch (error) {
    console.debug('Performance init error:', error);
  }
};

/**
 * Fast data loading with fallback to cached data
 */
export const fastLoadData = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  defaultValue: T
): Promise<T> => {
  try {
    // Try to get from localStorage cache first (instant)
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
      // Return cached immediately
      const promise = fetchFn().then(data => {
        localStorage.setItem(`cache_${key}`, JSON.stringify(data));
        return data;
      }).catch(() => JSON.parse(cached));

      // First return cached, then update in background
      return JSON.parse(cached) as T;
    }

    // No cache, fetch from source
    const data = await fetchFn();
    localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.debug(`Failed to load ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Clear old cached data to prevent bloat
 */
export const cleanupOldCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const data = JSON.parse(item);
            if (data.timestamp && now - data.timestamp > CACHE_EXPIRY) {
              localStorage.removeItem(key);
            }
          } catch {
            // Invalid cache, remove it
            localStorage.removeItem(key);
          }
        }
      }
    });

    console.log('✅ Cache cleanup completed');
  } catch (error) {
    console.debug('Cleanup error:', error);
  }
};

// Auto cleanup on app load
if (typeof window !== 'undefined') {
  cleanupOldCache();
}
