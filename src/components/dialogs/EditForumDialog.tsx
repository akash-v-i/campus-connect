import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateForum } from '@/lib/services/academic';

interface EditForumDialogProps {
  forum: any;
  onSuccess?: () => void;
}

export const EditForumDialog: React.FC<EditForumDialogProps> = ({ forum, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    topic: forum.topic,
    category: forum.subject || 'General Discussion',
    description: forum.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        topic: forum.topic,
        category: forum.subject || 'General Discussion',
        description: forum.description || '',
      });
      setErrors({});
    }
  }, [forum, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.topic.trim()) newErrors.topic = 'Topic is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

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
      await updateForum(forum.id, {
        topic: formData.topic,
        category: formData.category,
        description: formData.description,
      });

      toast.success(`💬 Forum topic "${formData.topic}" updated successfully!`);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating forum:', error);
      toast.error('❌ Failed to update forum topic. Please try again.');
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
          <DialogTitle>💬 Edit Forum Topic</DialogTitle>
          <DialogDescription>
            Update details for this forum topic
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">Discussion Topic *</label>
            <Input
              placeholder="What do you want to discuss?"
              value={formData.topic}
              onChange={(e) => {
                setFormData({ ...formData, topic: e.target.value });
                if (errors.topic) setErrors({ ...errors, topic: '' });
              }}
              className={errors.topic ? 'border-destructive' : ''}
            />
            {errors.topic && <p className="text-xs text-destructive mt-1">{errors.topic}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Discussion">General Discussion</SelectItem>
                <SelectItem value="Course Questions">Course Questions</SelectItem>
                <SelectItem value="Exam Preparation">Exam Preparation</SelectItem>
                <SelectItem value="Project Help">Project Help</SelectItem>
                <SelectItem value="Career Advice">Career Advice</SelectItem>
                <SelectItem value="Announcements">Announcements</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Detailed Description *</label>
            <Textarea
              placeholder="Provide more context for your discussion..."
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
