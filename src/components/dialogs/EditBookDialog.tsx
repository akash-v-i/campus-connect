import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateBook, Book } from '@/lib/services/library';

interface EditBookDialogProps {
  book: Book;
  onSuccess?: () => void;
}

export const EditBookDialog: React.FC<EditBookDialogProps> = ({ book, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn || '',
    category: book.category || 'Programming',
    copies: book.total_copies.toString(),
    description: book.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        category: book.category || 'Programming',
        copies: book.total_copies.toString(),
        description: book.description || '',
      });
      setErrors({});
    }
  }, [book, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.isbn.trim()) newErrors.isbn = 'ISBN is required';
    if (formData.isbn.length !== 10 && formData.isbn.length !== 13) {
      newErrors.isbn = 'ISBN must be 10 or 13 digits';
    }
    if (parseInt(formData.copies) < 1) newErrors.copies = 'Must be at least 1 copy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('❌ Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBook(book.id, {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        copies: parseInt(formData.copies),
        description: formData.description,
      });

      toast.success(`✅ Book "${formData.title}" updated successfully!`);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('❌ Failed to update book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📚 Edit Book</DialogTitle>
          <DialogDescription>
            Update the details for this book
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">Book Title *</label>
            <Input
              placeholder="Enter book title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Author *</label>
            <Input
              placeholder="Enter author name"
              value={formData.author}
              onChange={(e) => {
                setFormData({ ...formData, author: e.target.value });
                if (errors.author) setErrors({ ...errors, author: '' });
              }}
              className={errors.author ? 'border-destructive' : ''}
            />
            {errors.author && <p className="text-xs text-destructive mt-1">{errors.author}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">ISBN *</label>
              <Input
                placeholder="ISBN-10 or ISBN-13"
                value={formData.isbn}
                onChange={(e) => {
                  setFormData({ ...formData, isbn: e.target.value });
                  if (errors.isbn) setErrors({ ...errors, isbn: '' });
                }}
                className={errors.isbn ? 'border-destructive' : ''}
              />
              {errors.isbn && <p className="text-xs text-destructive mt-1">{errors.isbn}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Programming">Programming</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Total Copies *</label>
            <Input
              type="number"
              min="1"
              placeholder="Number of copies"
              value={formData.copies}
              onChange={(e) => {
                setFormData({ ...formData, copies: e.target.value });
                if (errors.copies) setErrors({ ...errors, copies: '' });
              }}
              className={errors.copies ? 'border-destructive' : ''}
            />
            {errors.copies && <p className="text-xs text-destructive mt-1">{errors.copies}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Enter book description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? '⏳ Saving...' : '✅ Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
