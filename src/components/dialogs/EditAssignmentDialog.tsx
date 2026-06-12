import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateAssignment } from '@/lib/services/academic';
import { useUserProfile } from '@/hooks/useUserProfile';

interface EditAssignmentDialogProps {
  assignment: any;
  onSuccess?: () => void;
}

export const EditAssignmentDialog: React.FC<EditAssignmentDialogProps> = ({ assignment, onSuccess }) => {
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: assignment.title,
    subject: assignment.subject || 'Computer Science',
    description: assignment.description || '',
    dueDate: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '',
    maxScore: assignment.max_marks?.toString() || '100',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        title: assignment.title,
        subject: assignment.subject || 'Computer Science',
        description: assignment.description || '',
        dueDate: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '',
        maxScore: assignment.max_marks?.toString() || '100',
      });
      setErrors({});
    }
  }, [assignment, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (parseInt(formData.maxScore) <= 0) newErrors.maxScore = 'Max score must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('❌ Please fix the errors below');
      return;
    }

    if (!profile?.id) {
      toast.error('❌ Please sign in to update assignments');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAssignment(assignment.id, {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        dueDate: new Date(formData.dueDate),
        maxScore: parseInt(formData.maxScore),
      });

      toast.success(`📝 Assignment "${formData.title}" updated successfully!`);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('❌ Failed to update assignment. Please try again.');
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
          <DialogTitle>📝 Edit Assignment</DialogTitle>
          <DialogDescription>
            Update details for this assignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Assignment Title *</label>
              <Input
                placeholder="Enter assignment title"
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
              <label className="block text-sm font-medium mb-2">Subject *</label>
              <Input
                placeholder="e.g. Data Structures"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              placeholder="Enter detailed assignment description..."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Due Date *</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData({ ...formData, dueDate: e.target.value });
                  if (errors.dueDate) setErrors({ ...errors, dueDate: '' });
                }}
                className={errors.dueDate ? 'border-destructive' : ''}
              />
              {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Score *</label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={formData.maxScore}
                onChange={(e) => {
                  setFormData({ ...formData, maxScore: e.target.value });
                  if (errors.maxScore) setErrors({ ...errors, maxScore: '' });
                }}
                className={errors.maxScore ? 'border-destructive' : ''}
              />
              {errors.maxScore && <p className="text-xs text-destructive mt-1">{errors.maxScore}</p>}
            </div>
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
