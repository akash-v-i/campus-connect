import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ibjogvitqfvfvgwqarxp.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imliam9ndml0cWZ2ZnZnd3FhcnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzM0MTIsImV4cCI6MjA4MjI0OTQxMn0.iYMSL8X31hFSbXZbGbQxBkCrBKObXdkGIiv5t913wSo';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table names
export const TABLES = {
  BOOKS: 'books',
  ISSUED_BOOKS: 'issued_books',
  FINES: 'fines',
  MENU_ITEMS: 'menu_items',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  FACILITIES: 'facilities',
  FACILITY_BOOKINGS: 'facility_bookings',
  CAMPUS_EVENTS: 'campus_events',
  EVENT_REGISTRATIONS: 'event_registrations',
  PROFILES: 'profiles',
  STUDY_MATERIALS: 'study_materials',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  STUDY_GROUPS: 'study_groups',
  NOTIFICATIONS: 'notifications',
  CAMPUS_SERVICES: 'campus_services',
  ANNOUNCEMENTS: 'announcements',
  FORUMS: 'forums',
  FORUM_POSTS: 'forum_posts',
  STUDY_GROUP_MEMBERS: 'study_group_members',
} as const;

// Helper function to handle Supabase errors - logs and throws
export function handleSupabaseError(error: any): never {
  console.error('Supabase error stack:', error);

  // Custom check for "Failed to fetch" which is almost always a network/CORS issue
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    throw new Error('Network error: Could not reach the database. Please check your internet connection or if the database project is active.');
  }

  if (error?.message?.includes('Failed to fetch')) {
    throw new Error('Database connection failed. This might be due to an ad-blocker or the database project being paused.');
  }

  throw new Error(error?.message || 'Database operation failed');
}

// Helper to safely handle Supabase operations with fallback
export async function withFallback<T>(
  operation: Promise<T>,
  fallbackValue: T,
  storageKey?: string
): Promise<T> {
  try {
    const result = await operation;
    // On success, update localStorage if key provided
    if (storageKey && result) {
      localStorage.setItem(storageKey, JSON.stringify(result));
    }
    return result;
  } catch (error) {
    console.error('Operation failed, using fallback:', error);
    // Try to get from localStorage if key provided
    if (storageKey) {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) return JSON.parse(cached) as T;
      } catch (e) {
        console.error('Failed to read fallback:', e);
      }
    }
    return fallbackValue;
  }
}

