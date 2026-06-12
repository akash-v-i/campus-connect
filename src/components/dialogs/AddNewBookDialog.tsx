import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookPlus } from 'lucide-react';
import { toast } from 'sonner';
import { addBook } from '@/lib/services/library';

interface AddNewBookDialogProps {
  onCreate?: (book: {
    title: string;
    author: string;
    isbn: string;
    category: string;
    copies: number;
    description: string;
  }) => void;
}

export const AddNewBookDialog: React.FC<AddNewBookDialogProps> = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Programming',
    copies: '1',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await addBook({
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        copies: parseInt(formData.copies),
        description: formData.description,
      });

      toast.success(`✅ Book "${formData.title}" added successfully!`);

      onCreate?.({
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        copies: parseInt(formData.copies),
        description: formData.description,
      });

      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: 'Programming',
        copies: '1',
        description: '',
      });
      setErrors({});
      setOpen(false);
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('❌ Failed to add book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4" variant="default">
          <BookPlus className="h-4 w-4 mr-2" />
          Add New Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📚 Add New Book</DialogTitle>
          <DialogDescription>
            Fill in the book details to add it to the library inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Book Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Enter book title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Author <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Enter author name"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className={errors.author ? 'border-destructive' : ''}
            />
            {errors.author && <p className="text-xs text-destructive mt-1">{errors.author}</p>}
          </div>

          {/* ISBN and Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                ISBN <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="ISBN-10 or ISBN-13"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
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

          {/* Total Copies */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Total Copies <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min="1"
              placeholder="Number of copies"
              value={formData.copies}
              onChange={(e) => setFormData({ ...formData, copies: e.target.value })}
              className={errors.copies ? 'border-destructive' : ''}
            />
            {errors.copies && <p className="text-xs text-destructive mt-1">{errors.copies}</p>}
          </div>

          {/* Description */}
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

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? '⏳ Adding...' : '✅ Add Book'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
