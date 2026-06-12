import { api } from '../apiClient';

const BOOKS_KEY = 'books';
const ISSUED_KEY = 'issued_books';
const FINES_KEY = 'fines';

const SAMPLE_BOOKS: Book[] = [
  { id: 'book_001', title: 'Introduction to Algorithms', author: 'Cormen et al.', isbn: '978-0262033848', category: 'Computer Science', available_copies: 3, total_copies: 5, cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200', rating: 4.8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'book_002', title: 'Clean Code', author: 'Robert Martin', isbn: '978-0132350884', category: 'Computer Science', available_copies: 2, total_copies: 4, cover_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200', rating: 4.7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'book_003', title: 'Physics for Scientists', author: 'Serway & Jewett', isbn: '978-1133947271', category: 'Physics', available_copies: 4, total_copies: 6, cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', rating: 4.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'book_004', title: 'Organic Chemistry', author: 'Paula Bruice', isbn: '978-0134042283', category: 'Chemistry', available_copies: 1, total_copies: 3, cover_image: 'https://images.unsplash.com/photo-1532012196547-552a922c4c2b?w=200', rating: 4.3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'book_005', title: 'Engineering Mathematics', author: 'K.A. Stroud', isbn: '978-0831134709', category: 'Mathematics', available_copies: 5, total_copies: 8, cover_image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200', rating: 4.6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function getLocalBooks(): Book[] {
  try {
    const stored = localStorage.getItem(BOOKS_KEY);
    if (!stored) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(SAMPLE_BOOKS));
      return [...SAMPLE_BOOKS];
    }
    return JSON.parse(stored);
  } catch {
    return [...SAMPLE_BOOKS];
  }
}

function saveLocalBooks(books: Book[]) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

function getLocalIssued(): IssuedBook[] {
  try { return JSON.parse(localStorage.getItem(ISSUED_KEY) || '[]'); } catch { return []; }
}

function saveLocalIssued(issued: IssuedBook[]) {
  localStorage.setItem(ISSUED_KEY, JSON.stringify(issued));
}

function getLocalFines(): Fine[] {
  try { return JSON.parse(localStorage.getItem(FINES_KEY) || '[]'); } catch { return []; }
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  available_copies: number;
  total_copies: number;
  cover_image?: string;
  description?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface IssuedBook {
  id: string;
  book_id: string;
  user_id: string;
  issue_date?: string;
  due_date: string;
  return_date?: string;
  status: 'requested' | 'issued' | 'returned' | 'overdue' | 'denied';
  fine_amount: number;
  created_at: string;
  updated_at: string;
  book?: Book;
}

export interface Fine {
  id: string;
  issued_book_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'paid';
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// Mapper helpers
function mapBook(b: any): Book {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    category: b.category,
    available_copies: b.availableCopies,
    total_copies: b.totalCopies,
    cover_image: b.coverUrl,
    description: b.description,
    rating: 4.5, // Seed default rating as it was mock in frontend
    created_at: b.createdAt || new Date().toISOString(),
    updated_at: b.createdAt || new Date().toISOString()
  };
}

function mapStatus(status: string): IssuedBook['status'] {
  switch (status) {
    case 'PENDING': return 'requested';
    case 'APPROVED': return 'issued';
    case 'REJECTED': return 'denied';
    case 'RETURNED': return 'returned';
    default: return 'requested';
  }
}

function mapIssuedBook(ib: any): IssuedBook {
  return {
    id: ib.id,
    book_id: ib.bookId,
    user_id: ib.userId,
    issue_date: ib.issueDate,
    due_date: ib.returnDate || new Date().toISOString(),
    return_date: ib.actualReturnDate,
    status: mapStatus(ib.status),
    fine_amount: 0, // fine is handled by fine entity separately
    created_at: ib.createdAt || new Date().toISOString(),
    updated_at: ib.createdAt || new Date().toISOString(),
    book: {
      id: ib.bookId,
      title: ib.bookTitle,
      author: 'Unknown Author',
      available_copies: 1,
      total_copies: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
}

function mapFine(f: any): Fine {
  return {
    id: f.id,
    issued_book_id: f.issuedBookId,
    user_id: f.userId,
    amount: f.amount,
    status: f.status === 'PAID' ? 'paid' : 'pending',
    paid_at: f.paidDate,
    created_at: f.createdAt || new Date().toISOString(),
    updated_at: f.createdAt || new Date().toISOString()
  };
}

// Books
export async function getBooks(filters?: { category?: string; search?: string }) {
  try {
    let path = '/books';
    const params: string[] = [];
    if (filters?.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters?.category) params.push(`category=${encodeURIComponent(filters.category)}`);
    if (params.length > 0) path += `?${params.join('&')}`;
    const response: any = await api.get(path);
    const content = response.content || response;
    const books = (Array.isArray(content) ? content : []).map(mapBook);
    if (books.length > 0) return books;
  } catch { /* fallback */ }

  let books = getLocalBooks();
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    books = books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }
  if (filters?.category) books = books.filter(b => b.category === filters.category);
  return books;
}

export async function addBook(data: {
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: number;
  description: string;
}) {
  try {
    const payload = {
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      category: data.category,
      totalCopies: data.copies,
      description: data.description,
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'
    };
    const response = await api.post('/books', payload);
    return [mapBook(response)];
  } catch {
    const book: Book = {
      id: 'book_' + Date.now(),
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      category: data.category,
      available_copies: data.copies,
      total_copies: data.copies,
      description: data.description,
      cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200',
      rating: 4.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const books = getLocalBooks();
    books.push(book);
    saveLocalBooks(books);
    return [book];
  }
}

export async function updateBook(id: string, data: Partial<{
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: number;
  description: string;
}>) {
  try {
    const payload: any = {};
    if (data.title) payload.title = data.title;
    if (data.author) payload.author = data.author;
    if (data.isbn) payload.isbn = data.isbn;
    if (data.category) payload.category = data.category;
    if (data.copies !== undefined) payload.totalCopies = data.copies;
    if (data.description) payload.description = data.description;
    const response = await api.put(`/books/${id}`, payload);
    return mapBook(response);
  } catch {
    const books = getLocalBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx < 0) throw new Error('Book not found');
    if (data.title) books[idx].title = data.title;
    if (data.author) books[idx].author = data.author;
    if (data.isbn) books[idx].isbn = data.isbn;
    if (data.category) books[idx].category = data.category;
    if (data.copies !== undefined) {
      books[idx].total_copies = data.copies;
      books[idx].available_copies = data.copies;
    }
    if (data.description) books[idx].description = data.description;
    books[idx].updated_at = new Date().toISOString();
    saveLocalBooks(books);
    return books[idx];
  }
}

export async function deleteBook(id: string) {
  try { await api.delete(`/books/${id}`); } catch {
    saveLocalBooks(getLocalBooks().filter(b => b.id !== id));
  }
}

export async function getBookById(id: string) {
  try {
    const response = await api.get(`/books/${id}`);
    return mapBook(response);
  } catch {
    const book = getLocalBooks().find(b => b.id === id);
    if (!book) throw new Error('Book not found');
    return book;
  }
}

export async function getPopularBooks(limit = 10) {
  const books = await getBooks();
  return books.slice(0, limit);
}

// Issued Books
export async function requestBook(bookId: string, userId: string) {
  try {
    const response = await api.post(`/issued-books/request?bookId=${bookId}`);
    return mapIssuedBook(response);
  } catch {
    const books = getLocalBooks();
    const book = books.find(b => b.id === bookId);
    if (!book || book.available_copies <= 0) throw new Error('Book not available');

    const issued: IssuedBook = {
      id: 'issued_' + Date.now(),
      book_id: bookId,
      user_id: userId,
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'requested',
      fine_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      book,
    };
    const allIssued = getLocalIssued();
    allIssued.push(issued);
    saveLocalIssued(allIssued);
    return issued;
  }
}

export async function getIssuedBooks(userId?: string) {
  try {
    let path = '/issued-books';
    if (userId) path += `?userId=${userId}`;
    const response: any = await api.get(path);
    const content = response.content || response;
    const issued = (Array.isArray(content) ? content : []).map(mapIssuedBook);
    if (issued.length > 0 || !userId) return issued;
  } catch { /* fallback */ }

  let issued = getLocalIssued();
  if (userId) issued = issued.filter(i => i.user_id === userId);
  return issued;
}

export async function issueBook(bookId: string, userId: string, dueDate: string) {
  try {
    const response: any = await api.post(`/issued-books/request?bookId=${bookId}`);
    const approved = await api.put(`/issued-books/${response.id}/approve`);
    return mapIssuedBook(approved);
  } catch {
    const requested = await requestBook(bookId, userId);
    return approveRequest(requested.id, bookId, dueDate);
  }
}

export async function approveRequest(issuedBookId: string, bookId: string, dueDate: string) {
  try {
    const response = await api.put(`/issued-books/${issuedBookId}/approve`);
    return mapIssuedBook(response);
  } catch {
    const issued = getLocalIssued();
    const idx = issued.findIndex(i => i.id === issuedBookId);
    if (idx >= 0) {
      issued[idx].status = 'issued';
      issued[idx].issue_date = new Date().toISOString();
      issued[idx].due_date = dueDate;
      saveLocalIssued(issued);
      const books = getLocalBooks();
      const bIdx = books.findIndex(b => b.id === bookId);
      if (bIdx >= 0) { books[bIdx].available_copies = Math.max(0, books[bIdx].available_copies - 1); saveLocalBooks(books); }
      return issued[idx];
    }
    throw new Error('Request not found');
  }
}

export async function updateIssuedBookStatus(id: string, status: string) {
  try {
    if (status === 'issued') {
      const response = await api.put(`/issued-books/${id}/approve`);
      return mapIssuedBook(response);
    } else if (status === 'returned') {
      const response = await api.post(`/issued-books/${id}/return`);
      return mapIssuedBook(response);
    } else if (status === 'denied') {
      const response = await api.put(`/issued-books/${id}/deny`, { notes: 'Request Denied' });
      return mapIssuedBook(response);
    }
    throw new Error(`Unsupported status update: ${status}`);
  } catch {
    const issued = getLocalIssued();
    const idx = issued.findIndex(i => i.id === id);
    if (idx < 0) throw new Error('Request not found');
    issued[idx].status = status as IssuedBook['status'];
    if (status === 'returned') {
      issued[idx].return_date = new Date().toISOString();
      const books = getLocalBooks();
      const bIdx = books.findIndex(b => b.id === issued[idx].book_id);
      if (bIdx >= 0) { books[bIdx].available_copies += 1; saveLocalBooks(books); }
    }
    saveLocalIssued(issued);
    return issued[idx];
  }
}

export async function returnBook(issuedBookId: string) {
  try {
    const response = await api.post(`/issued-books/${issuedBookId}/return`);
    return mapIssuedBook(response);
  } catch {
    return updateIssuedBookStatus(issuedBookId, 'returned');
  }
}

// Fines
export async function getFines(userId?: string) {
  try {
    let path = '/fines';
    if (userId) path += `?userId=${userId}`;
    const response: any = await api.get(path);
    const content = response.content || response;
    const fines = (Array.isArray(content) ? content : []).map(mapFine);
    if (fines.length > 0 || !userId) return fines;
  } catch { /* fallback */ }

  let fines = getLocalFines();
  if (userId) fines = fines.filter(f => f.user_id === userId);
  return fines;
}

export async function payFine(fineId: string) {
  try {
    const response = await api.post(`/fines/${fineId}/pay`);
    return mapFine(response);
  } catch {
    const fines = getLocalFines();
    const idx = fines.findIndex(f => f.id === fineId);
    if (idx < 0) throw new Error('Fine not found');
    fines[idx].status = 'paid';
    fines[idx].paid_at = new Date().toISOString();
    localStorage.setItem(FINES_KEY, JSON.stringify(fines));
    return fines[idx];
  }
}
