/**
 * Centralized query key factory and utilities for consistent cache invalidation
 */

// Query key structure for consistency across the app
export const queryKeys = {
  // Books (shared between Librarian and Students)
  books: {
    all: ['books'] as const,
    inventory: ['books', 'inventory'] as const,
    popular: ['books', 'popular'] as const,
    issued: (userId?: string) => ['books', 'issued', userId] as const,
  },

  // Study Materials/Resources (shared between Faculty and Students)
  resources: {
    all: ['resources'] as const,
    faculty: (facultyId?: string) => ['resources', 'faculty', facultyId] as const,
  },

  // Assignments (shared between Faculty and Students)
  assignments: {
    all: ['assignments'] as const,
    faculty: (facultyId?: string) => ['assignments', 'faculty', facultyId] as const,
  },

  // Study Groups (shared between Faculty and Students)
  groups: {
    all: ['study-groups'] as const,
    faculty: (facultyId?: string) => ['study-groups', 'faculty', facultyId] as const,
  },

  // Forums (shared between Faculty and Students)
  forums: {
    all: ['forums'] as const,
    faculty: (facultyId?: string) => ['forums', 'faculty', facultyId] as const,
  },

  // Canteen (shared between Canteen and Students)
  canteen: {
    menu: ['canteen', 'menu'] as const,
    orders: (userId?: string) => ['canteen', 'orders', userId] as const,
    transactions: ['canteen', 'transactions'] as const,
  },

  // Events (shared between Admin and Students)
  events: {
    all: ['campus-events'] as const,
    registered: (userId?: string) => ['campus-events', 'registered', userId] as const,
  },

  // Requests (Librarian Only)
  requests: {
    all: ['requests'] as const,
    librarian: ['requests', 'librarian'] as const,
    user: (userId: string) => ['requests', 'user', userId] as const,
  },

  // Loans (Librarian Only)
  loans: {
    all: ['loans'] as const,
    librarian: ['loans', 'librarian'] as const,
    user: (userId: string) => ['loans', 'user', userId] as const,
  },

  // Fines (Librarian Only)
  fines: {
    all: ['fines'] as const,
    librarian: ['fines', 'librarian'] as const,
    user: (userId: string) => ['fines', 'user', userId] as const,
  },

  // Campus Services/Facilities
  campus: {
    services: ['campus-services'] as const,
    facilities: ['facilities'] as const,
    bookings: (userId?: string) => ['facility-bookings', userId] as const,
    announcements: ['announcements'] as const,
  },
};

/**
 * Cache invalidation patterns for mutations
 */
export function getInvalidationPatterns(dataType: string, userId?: string) {
  const patterns = [];

  switch (dataType) {
    case 'book':
    case 'library':
    case 'request':
    case 'loan':
      // Invalidate ALL library related data
      patterns.push({ queryKey: ['books'] });
      patterns.push({ queryKey: ['requests'] });
      patterns.push({ queryKey: ['loans'] });
      patterns.push({ queryKey: ['fines'] });
      patterns.push({ queryKey: ['books', 'inventory'] });
      patterns.push({ queryKey: ['books', 'popular'] });
      break;

    case 'resource':
    case 'academic':
      // Invalidate ALL academic related data
      patterns.push({ queryKey: ['resources'] });
      patterns.push({ queryKey: ['assignments'] });
      patterns.push({ queryKey: ['study-groups'] });
      patterns.push({ queryKey: ['forums'] });
      break;

    case 'assignment':
      patterns.push({ queryKey: ['assignments'] });
      break;

    case 'group':
      patterns.push({ queryKey: ['study-groups'] });
      break;

    case 'forum':
      patterns.push({ queryKey: ['forums'] });
      break;

    case 'menu-item':
    case 'order':
    case 'canteen':
      // Invalidate ALL canteen related data
      patterns.push({ queryKey: ['canteen'] });
      break;

    case 'event':
      // Invalidate ALL event related data
      patterns.push({ queryKey: ['campus-events'] });
      break;
  }

  return patterns;
}

/**
 * Helper to invalidate queries by pattern
 */
export async function invalidateQueriesForMutation(
  queryClient: any,
  dataType: string,
  userId?: string
) {
  const patterns = getInvalidationPatterns(dataType, userId);

  for (const pattern of patterns) {
    await queryClient.invalidateQueries(pattern);
  }
}
