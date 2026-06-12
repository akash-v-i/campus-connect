import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useComingSoonBooks } from '@/lib/coming-soon-books';
import { toast } from 'sonner';

export const ComingSoonBooksPanel: React.FC = () => {
  const { theme } = useTheme();
  const { books, loading, handleNotify, handleRemoveNotify } = useComingSoonBooks();
  const [filter, setFilter] = useState('all');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            📚 Coming Soon Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-pulse">Loading upcoming books...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysUntilArrival = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (dateStr: string) => {
    const days = daysUntilArrival(dateStr);
    if (days <= 0) return <Badge className="bg-green-600">Available Now!</Badge>;
    if (days <= 7) return <Badge className="bg-orange-600">Arriving Soon</Badge>;
    if (days <= 30) return <Badge className="bg-blue-600">Coming {days} days</Badge>;
    return <Badge variant="outline">Expected</Badge>;
  };

  return (
    <Card className={`overflow-hidden ${theme === 'cyber' ? 'border-primary/30' : ''}`}>
      <CardHeader className={theme === 'cyber' ? 'bg-primary/5' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            📚 Coming Soon Books
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 rounded border text-sm"
            >
              <option value="all">All Books</option>
              <option value="arriving-soon">Arriving Soon</option>
              <option value="notified">I'm Notified</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {books.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No upcoming books at the moment</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {books
              .filter(book => {
                if (filter === 'notified') return book.notifyMe;
                if (filter === 'arriving-soon') return daysUntilArrival(book.expectedDate) <= 7;
                return true;
              })
              .map((book) => (
                <div
                  key={book.id}
                  className={`rounded-lg border p-4 transition-all hover:shadow-lg ${
                    theme === 'cyber'
                      ? 'border-primary/20 bg-primary/5 hover:border-primary/40'
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-sm line-clamp-2">{book.title}</h3>
                      {getStatusBadge(book.expectedDate)}
                    </div>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>

                  <div className="mb-3 text-xs space-y-1">
                    <p>
                      <span className="font-semibold">Category:</span> {book.category}
                    </p>
                    <p>
                      <span className="font-semibold">Expected:</span>{' '}
                      {new Date(book.expectedDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold">ISBN:</span> {book.isbn}
                    </p>
                  </div>

                  {book.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {book.description}
                    </p>
                  )}

                  <Button
                    size="sm"
                    variant={book.notifyMe ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => {
                      if (book.notifyMe) {
                        handleRemoveNotify(book.id);
                        toast.info('🔔 Notification removed');
                      } else {
                        handleNotify(book.id);
                        toast.success('🔔 You will be notified when book arrives!');
                      }
                    }}
                  >
                    {book.notifyMe ? (
                      <>
                        <BellOff className="h-4 w-4 mr-1" />
                        Unsubscribe
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-1" />
                        Notify Me
                      </>
                    )}
                  </Button>
                </div>
              ))}
          </div>
        )}

        {books.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold mb-2">💡 Pro Tip:</p>
            <p className="text-sm text-muted-foreground">
              Click "Notify Me" to get alerts when these books become available. You can manage your subscriptions anytime.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
