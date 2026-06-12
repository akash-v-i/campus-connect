import { supabase, TABLES } from '@/lib/supabase';

export async function addBook(data: {
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: number;
  description: string;
}) {
  try {
    // Try Supabase first
    const { data: result, error } = await supabase
      .from(TABLES.BOOKS)
      .insert([
        {
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          category: data.category,
          total_copies: data.copies,
          available_copies: data.copies,
          description: data.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase error:', error.message);
      // Fallback to localStorage
      return fallbackAddBook(data);
    }
    
    return result || [{ id: 'online-' + Date.now(), ...data }];
  } catch (error) {
    console.error('Error adding book:', error);
    // Fallback to localStorage on network error
    return fallbackAddBook(data);
  }
}

function fallbackAddBook(data: any) {
  const book = {
    id: 'local-' + Date.now(),
    title: data.title,
    author: data.author,
    isbn: data.isbn,
    category: data.category,
    total_copies: data.copies,
    available_copies: data.copies,
    description: data.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Store in localStorage
  const books = JSON.parse(localStorage.getItem('books') || '[]');
  books.push(book);
  localStorage.setItem('books', JSON.stringify(books));

  console.log('Book saved to localStorage (offline):', book);
  return [book];
}
