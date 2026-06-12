import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Search,
  QrCode,
  Clock,
  DollarSign,
  Filter,
  Star,
  Download,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIssuedBooks, getPopularBooks, getFines, requestBook } from '@/lib/services/library';
import { ComingSoonBooksPanel } from '@/components/ComingSoonBooksPanel';
import { toast } from 'sonner';
import { queryKeys, invalidateQueriesForMutation } from "@/lib/query-utils";

export default function Library() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch issued books
  const { data: issuedBooks = [], isLoading: loadingIssued } = useQuery({
    queryKey: queryKeys.requests.user(user?.id || ''),
    queryFn: () => getIssuedBooks(user?.id),
    enabled: !!user?.id,
  });

  // Fetch popular books
  const { data: popularBooks = [], isLoading: loadingPopular } = useQuery({
    queryKey: queryKeys.books.all,
    queryFn: () => getPopularBooks(10),
  });

  // Fetch fines
  const { data: fines = [] } = useQuery({
    queryKey: queryKeys.fines.user(user?.id || ''),
    queryFn: () => getFines(user?.id),
    enabled: !!user?.id,
  });

  const requestMutation = useMutation({
    mutationFn: async (bookId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return requestBook(bookId, user.id);
    },
    onSuccess: () => {
      invalidateQueriesForMutation(queryClient, 'library');
      toast.success("Book requested successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to request book");
    }
  });

  const totalFine = fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0);
  const activeIssuedBooks = issuedBooks.filter(book => ['requested', 'issued', 'overdue'].includes(book.status));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className={theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}>
            Library Management
          </span>
        </h1>
        <p className="text-muted-foreground mb-6">Browse, issue, and return books with QR codes</p>

        <div className="flex gap-3 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search books, authors, ISBN..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link to="/library/issued">
          <Card className="p-6 card-hover h-full">
            <BookOpen className="h-8 w-8 text-blue-500 mb-3" />
            <p className="font-bold text-2xl mb-1">{activeIssuedBooks.filter(b => b.status !== 'requested').length}</p>
            <p className="text-sm text-muted-foreground">Books Issued</p>
          </Card>
        </Link>

        <Link to="/library/scan">
          <Card className="p-6 card-hover h-full">
            <QrCode className="h-8 w-8 text-green-500 mb-3" />
            <p className="font-bold text-lg mb-1">QR Scanner</p>
            <p className="text-sm text-muted-foreground">Return Books</p>
          </Card>
        </Link>

        <Link to="/library/fines">
          <Card className="p-6 card-hover h-full">
            <DollarSign className="h-8 w-8 text-orange-500 mb-3" />
            <p className="font-bold text-2xl mb-1">₹{totalFine}</p>
            <p className="text-sm text-muted-foreground">Due Payments</p>
          </Card>
        </Link>

        <Link to="/library/history">
          <Card className="p-6 card-hover h-full">
            <Clock className="h-8 w-8 text-purple-500 mb-3" />
            <p className="font-bold text-lg mb-1">History</p>
            <p className="text-sm text-muted-foreground">View Records</p>
          </Card>
        </Link>
      </div>

      {/* My Issued/Requested Books */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">My Books</h2>
          <Link to="/library/issued">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {loadingIssued ? (
          <div className="text-center py-8 text-muted-foreground">Loading books...</div>
        ) : activeIssuedBooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No books currently issued or requested</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeIssuedBooks.slice(0, 3).map((book) => {
              const dueDate = new Date(book.due_date);
              const isOverdue = book.status === 'overdue' || (dueDate < new Date() && book.status === 'issued');
              const fine = Number(book.fine_amount);

              return (
                <Card key={book.id} className={`p-6 ${isOverdue ? 'border-destructive' : ''}`}>
                  <div className="flex gap-4">
                    <img
                      src={book.book?.cover_image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop'}
                      alt={book.book?.title || 'Book'}
                      className="w-20 h-28 object-cover rounded-md shadow-card"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold line-clamp-2">{book.book?.title || 'Unknown Book'}</h3>
                        <Badge variant={book.status === 'requested' ? 'secondary' : (book.status === 'overdue' ? 'destructive' : 'default')}>
                          {book.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{book.book?.author || 'Unknown Author'}</p>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Due Date:</span>
                          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                            {dueDate.toLocaleDateString()}
                          </span>
                        </div>
                        {fine > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fine:</span>
                            <span className="text-destructive font-medium">₹{fine}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Popular Books */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Popular This Week</h2>
        {loadingPopular ? (
          <div className="text-center py-8 text-muted-foreground">Loading popular books...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularBooks.map((book) => (
              <Card key={book.id} className="p-6 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold line-clamp-2">{book.title}</h3>
                  {book.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{Number(book.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3">{book.author}</p>

                <div className="flex items-center justify-between">
                  <Badge variant={book.available_copies > 0 ? 'default' : 'destructive'}>
                    {book.available_copies > 0 ? `${book.available_copies} Available` : 'Not Available'}
                  </Badge>
                  <Button
                    size="sm"
                    disabled={book.available_copies === 0 || requestMutation.isPending}
                    onClick={() => requestMutation.mutate(book.id)}
                  >
                    {requestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reserve'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Books Section */}
      <div className="mt-12">
        <ComingSoonBooksPanel />
      </div>
    </div>
  );
}
