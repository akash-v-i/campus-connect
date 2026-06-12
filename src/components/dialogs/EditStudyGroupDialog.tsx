import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateStudyGroup } from '@/lib/services/academic';

interface EditStudyGroupDialogProps {
  group: any;
  onSuccess?: () => void;
}

export const EditStudyGroupDialog: React.FC<EditStudyGroupDialogProps> = ({ group, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name,
    subject: group.subject || '',
    description: group.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        name: group.name,
        subject: group.subject || '',
        description: group.description || '',
      });
      setErrors({});
    }
  }, [group, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Group name is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';

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
      await updateStudyGroup(group.id, {
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
      });

      toast.success(`👥 Study group "${formData.name}" updated successfully!`);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating study group:', error);
      toast.error('❌ Failed to update study group. Please try again.');
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
          <DialogTitle>👥 Edit Study Group</DialogTitle>
          <DialogDescription>
            Update details for this study group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Group Name *</label>
              <Input
                placeholder="Enter group name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject *</label>
              <Input
                placeholder="e.g. Computer Science"
                value={formData.subject}
                onChange={(e) => {
                  setFormData({ ...formData, subject: e.target.value });
                  if (errors.subject) setErrors({ ...errors, subject: '' });
                }}
                className={errors.subject ? 'border-destructive' : ''}
              />
              {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Describe the purpose of this study group..."
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
