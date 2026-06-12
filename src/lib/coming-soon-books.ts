// Coming soon books management - working implementation
import { useState, useEffect } from 'react';

export interface ComingSoonBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  expectedDate: string;
  category: string;
  description?: string;
  notifyMe: boolean;
}

// Local storage key
const COMING_SOON_KEY = 'library_coming_soon_books';
const NOTIFICATIONS_KEY = 'library_notifications';

// Sample coming soon books
const SAMPLE_BOOKS: ComingSoonBook[] = [
  {
    id: 'coming_001',
    title: 'Advanced React Patterns',
    author: 'Dan Abramov',
    isbn: '9781234567890',
    expectedDate: '2026-04-15',
    category: 'Programming',
    description: 'Master advanced React patterns and optimization techniques',
    notifyMe: false,
  },
  {
    id: 'coming_002',
    title: 'The Pragmatic Developer',
    author: 'David Hunt',
    isbn: '9780987654321',
    expectedDate: '2026-05-20',
    category: 'Programming',
    description: 'Essential skills for modern developers',
    notifyMe: false,
  },
  {
    id: 'coming_003',
    title: 'Quantum Computing Basics',
    author: 'John Smith',
    isbn: '9781111111111',
    expectedDate: '2026-06-10',
    category: 'Science',
    description: 'Introduction to quantum computing principles',
    notifyMe: false,
  }
];

/**
 * Initialize coming soon books if not exists
 */
export const initializeComingSoonBooks = () => {
  try {
    const existing = localStorage.getItem(COMING_SOON_KEY);
    if (!existing) {
      localStorage.setItem(COMING_SOON_KEY, JSON.stringify(SAMPLE_BOOKS));
      console.log('✅ Coming soon books initialized');
    }
  } catch (error) {
    console.debug('Failed to initialize coming soon books:', error);
  }
};

/**
 * Get all coming soon books
 */
export const getComingSoonBooks = (): ComingSoonBook[] => {
  try {
    initializeComingSoonBooks();
    const data = localStorage.getItem(COMING_SOON_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.debug('Failed to get coming soon books:', error);
    return [];
  }
};

/**
 * Add notification for a coming soon book
 */
export const notifyForBook = (bookId: string, email?: string) => {
  try {
    const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
    const list = notifications ? JSON.parse(notifications) : [];
    
    list.push({
      id: Math.random().toString(36).substr(2, 9),
      bookId,
      email,
      date: new Date().toISOString(),
    });
    
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
    
    // Update book notification status
    const books = getComingSoonBooks();
    const updated = books.map(b => 
      b.id === bookId ? { ...b, notifyMe: true } : b
    );
    localStorage.setItem(COMING_SOON_KEY, JSON.stringify(updated));
    
    return true;
  } catch (error) {
    console.debug('Failed to notify for book:', error);
    return false;
  }
};

/**
 * Remove notification for a coming soon book
 */
export const removeNotification = (bookId: string) => {
  try {
    const books = getComingSoonBooks();
    const updated = books.map(b => 
      b.id === bookId ? { ...b, notifyMe: false } : b
    );
    localStorage.setItem(COMING_SOON_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.debug('Failed to remove notification:', error);
    return false;
  }
};

/**
 * Add new coming soon book
 */
export const addComingSoonBook = (book: Omit<ComingSoonBook, 'id'>) => {
  try {
    const books = getComingSoonBooks();
    const newBook: ComingSoonBook = {
      ...book,
      id: 'coming_' + Math.random().toString(36).substr(2, 9),
    };
    books.push(newBook);
    localStorage.setItem(COMING_SOON_KEY, JSON.stringify(books));
    return newBook;
  } catch (error) {
    console.debug('Failed to add coming soon book:', error);
    return null;
  }
};

/**
 * Hook for coming soon books
 */
export const useComingSoonBooks = () => {
  const [books, setBooks] = useState<ComingSoonBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const data = getComingSoonBooks();
    setBooks(data);
    setLoading(false);
  }, []);

  const handleNotify = (bookId: string) => {
    notifyForBook(bookId);
    setBooks(prev => 
      prev.map(b => b.id === bookId ? { ...b, notifyMe: true } : b)
    );
  };

  const handleRemoveNotify = (bookId: string) => {
    removeNotification(bookId);
    setBooks(prev => 
      prev.map(b => b.id === bookId ? { ...b, notifyMe: false } : b)
    );
  };

  return {
    books,
    loading,
    handleNotify,
    handleRemoveNotify,
  };
};

// Initialize on module load
initializeComingSoonBooks();
