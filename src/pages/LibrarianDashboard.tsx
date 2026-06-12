import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AddNewBookDialog } from "@/components/dialogs/AddNewBookDialog";
import { EditBookDialog } from "@/components/dialogs/EditBookDialog";
import { DeleteConfirmationDialog } from "@/components/dialogs/DeleteConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import { getBooks, getIssuedBooks, getFines, issueBook, returnBook, payFine, updateIssuedBookStatus, approveRequest, deleteBook } from "@/lib/services/library";
import { queryKeys, invalidateQueriesForMutation } from "@/lib/query-utils";

export default function LibrarianDashboard() {
  const { theme } = useTheme();
  const location = useLocation();
  const queryClient = useQueryClient();
  const tab = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'requests';
  }, [location.search]);

  // Fetch Pending Requests (status = 'requested')
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: queryKeys.requests.all,
    queryFn: () => getIssuedBooks(),
    select: (data) => data.filter(r => r.status === 'requested')
  });

  const [inventorySearch, setInventorySearch] = React.useState("");

  // Fetch Inventory
  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: queryKeys.books.all,
    queryFn: () => getBooks(),
  });

  const filteredInventory = React.useMemo(() => {
    return inventory.filter((book) => 
      book.title.toLowerCase().includes(inventorySearch.toLowerCase()) || 
      book.author.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (book.isbn && book.isbn.includes(inventorySearch))
    );
  }, [inventory, inventorySearch]);

  // Fetch Active Loans
  const { data: loans = [], isLoading: loadingLoans } = useQuery({
    queryKey: queryKeys.loans.all,
    queryFn: () => getIssuedBooks(),
    select: (data) => data.filter(r => r.status === 'issued')
  });

  // Fetch Fines
  const { data: fines = [], isLoading: loadingFines } = useQuery({
    queryKey: queryKeys.fines.all,
    queryFn: () => getFines(),
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      if (status === 'issued') {
        const req = (requests as any).find((r: any) => r.id === id);
        if (req) {
          return approveRequest(id, req.book_id, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString());
        }
      }
      return updateIssuedBookStatus(id, status);
    },
    onSuccess: () => {
      invalidateQueriesForMutation(queryClient, 'library');
      toast.success("Request updated");
    }
  });

  const returnBookMutation = useMutation({
    mutationFn: async (id: string) => {
      return returnBook(id);
    },
    onSuccess: () => {
      invalidateQueriesForMutation(queryClient, 'book');
      toast.success("Book marked as returned");
    }
  });

  const payFineMutation = useMutation({
    mutationFn: async (id: string) => {
      return payFine(id);
    },
    onSuccess: () => {
      invalidateQueriesForMutation(queryClient, 'book');
      toast.success("Fine marked as paid");
    }
  });

  const LoadingState = () => (
    <div className="flex justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className={theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}>
            Librarian Dashboard
          </span>
        </h1>
        <p className="text-muted-foreground mb-6">Manage book requests, inventory, and library operations</p>
      </div>

      {tab === 'requests' && (
        <Card>
          <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
          <CardContent>
            {loadingRequests ? <LoadingState /> : (
              <div className="space-y-4">
                {requests.length === 0 && <div className="text-muted-foreground">No pending requests.</div>}
                {requests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                    <div>
                      <span className="font-semibold">{req.profiles?.full_name || 'Student'}</span> requests <span className="font-semibold">{req.book?.title || 'Unknown Book'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'issued' })}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'denied' })}>Deny</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'inventory' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2">
            <CardTitle>Book Inventory</CardTitle>
            <AddNewBookDialog
              onCreate={() => {
                invalidateQueriesForMutation(queryClient, 'book');
              }}
            />
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or ISBN..."
                className="pl-8"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
            </div>
            {loadingInventory ? <LoadingState /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">ISBN</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Total</th>
                      <th>Available</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No books found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((book) => (
                        <tr key={book.id} className="border-b hover:bg-muted/20">
                        <td className="py-2">{book.isbn}</td>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.total_copies}</td>
                        <td>{book.available_copies}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditBookDialog 
                              book={book} 
                              onSuccess={() => invalidateQueriesForMutation(queryClient, 'book')} 
                            />
                            <DeleteConfirmationDialog
                              title="Delete Book"
                              description={`Are you sure you want to delete "${book.title}"?`}
                              onConfirm={() => deleteBook(book.id)}
                              successMessage={`✅ "${book.title}" deleted successfully!`}
                              onSuccess={() => invalidateQueriesForMutation(queryClient, 'book')}
                            />
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'loans' && (
        <Card>
          <CardHeader><CardTitle>Active Loans</CardTitle></CardHeader>
          <CardContent>
            {loadingLoans ? <LoadingState /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">Student</th>
                      <th>Book</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan: any) => (
                      <tr key={loan.id} className="border-b hover:bg-muted/20">
                        <td className="py-2">{loan.profiles?.full_name || 'Student'}</td>
                        <td>{loan.book?.title || 'Unknown Book'}</td>
                        <td>{new Date(loan.due_date).toLocaleDateString()}</td>
                        <td>
                          <Button size="sm" onClick={() => returnBookMutation.mutate(loan.id)}>Return</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'fines' && (
        <Card>
          <CardHeader><CardTitle>Fines & Dues</CardTitle></CardHeader>
          <CardContent>
            {loadingFines ? <LoadingState /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">Student</th>
                      <th>Book</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fines.map((fine: any) => (
                      <tr key={fine.id} className="border-b hover:bg-muted/20">
                        <td className="py-2">{fine.profiles?.full_name || 'Student'}</td>
                        <td>{fine.book?.title || 'Fine'}</td>
                        <td className="text-red-500 font-bold">₹{fine.fine_amount || fine.amount}</td>
                        <td>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => payFineMutation.mutate(fine.id)}>Mark Paid</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
