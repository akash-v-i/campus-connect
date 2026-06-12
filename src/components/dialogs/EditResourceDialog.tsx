import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateResource } from '@/lib/services/academic';
import { useUserProfile } from '@/hooks/useUserProfile';

interface EditResourceDialogProps {
  resource: any;
  onSuccess?: () => void;
}

export const EditResourceDialog: React.FC<EditResourceDialogProps> = ({ resource, onSuccess }) => {
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: resource.title,
    category: resource.category || 'Lecture Notes',
    description: resource.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        title: resource.title,
        category: resource.category || 'Lecture Notes',
        description: resource.description || '',
      });
      setErrors({});
    }
  }, [resource, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('❌ Please fix the errors below');
      return;
    }

    if (!profile?.id) {
      toast.error('❌ Please sign in to update resources');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateResource(resource.id, {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        subject: formData.category,
      });

      toast.success(`📤 Resource "${formData.title}" updated successfully!`);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('❌ Failed to update resource. Please try again.');
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
          <DialogTitle>📚 Edit Study Resource</DialogTitle>
          <DialogDescription>
            Update details for this resource
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">Resource Title *</label>
            <Input
              placeholder="Enter resource title"
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
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lecture Notes">Lecture Notes</SelectItem>
                <SelectItem value="Reference Books">Reference Books</SelectItem>
                <SelectItem value="Sample Code">Sample Code</SelectItem>
                <SelectItem value="Presentations">Presentations</SelectItem>
                <SelectItem value="Assignments">Assignments</SelectItem>
                <SelectItem value="Exam Papers">Exam Papers</SelectItem>
                <SelectItem value="Video Tutorials">Video Tutorials</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Describe the resource content..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
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
