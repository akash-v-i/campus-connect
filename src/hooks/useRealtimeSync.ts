import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateQueriesForMutation } from '../lib/query-utils';

/**
 * Hook to enable real-time synchronization across the application.
 * Listens for local storage changes and invalidates corresponding React Query caches.
 */
export function useRealtimeSync(userId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        // LocalStorage Sync (Cross-tab synchronization for offline data)
        const handleStorageChange = (e: StorageEvent) => {
            // If a relevant key in localStorage changes, invalidate queries
            const relevantKeys = [
                'books',
                'canteen_menu_items',
                'canteen_orders',
                'study_materials',
                'assignments',
                'study_groups',
                'forums'
            ];

            if (e.key && relevantKeys.includes(e.key)) {
                console.log(`LocalStorage: Change detected in ${e.key}`);
                if (e.key === 'books') invalidateQueriesForMutation(queryClient, 'library');
                if (e.key.startsWith('canteen')) invalidateQueriesForMutation(queryClient, 'canteen');
                if (['study_materials', 'assignments', 'study_groups', 'forums'].includes(e.key)) {
                    invalidateQueriesForMutation(queryClient, 'academic');
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [queryClient, userId]);
}

