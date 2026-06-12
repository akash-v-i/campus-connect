import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createForumThread } from '@/lib/services/academic';
import { useUserProfile } from '@/hooks/useUserProfile';

interface ForumManagementDialogProps {
  onCreate?: () => void;
}

export const ForumManagementDialog: React.FC<ForumManagementDialogProps> = ({ onCreate }) => {
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    category: 'general',
    tags: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'general', label: 'General Discussion' },
    { value: 'academic', label: 'Academic' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'events', label: 'Events & Announcements' },
    { value: 'resources', label: 'Resources & Materials' },
    { value: 'clubs', label: 'Clubs & Activities' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.topic.trim()) newErrors.topic = 'Topic is required';
    if (formData.topic.length < 5) newErrors.topic = 'Topic must be at least 5 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    const userId = profile?.id;
    if (!userId) {
      toast.error('Please sign in to create forum threads');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createForumThread({
        topic: formData.topic,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t).join(', '),
        authorId: userId,
        authorName: profile.full_name || 'Anonymous',
      });

      const joinCode = result[0]?.joinCode || result[0]?.join_code;
      setCreatedCode(joinCode || null);
      toast.success(`Forum thread "${formData.topic}" created!`);
      onCreate?.();
    } catch (error) {
      console.error('Error creating forum thread:', error);
      toast.error('Failed to create forum thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedCode(null);
    setFormData({ topic: '', description: '', category: 'general', tags: '' });
    setErrors({});
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      toast.success('Join code copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="mt-4" variant="default">
          <MessageSquare className="h-4 w-4 mr-2" />
          Create Forum Thread
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Forum Thread</DialogTitle>
          <DialogDescription>
            Start a new discussion in the campus community forum
          </DialogDescription>
        </DialogHeader>

        {createdCode ? (
          <div className="py-6 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Forum Created Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Share this join code with students so they can access the forum:
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-widest text-primary">{createdCode}</span>
              <Button variant="outline" size="sm" onClick={copyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Topic <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Enter forum topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className={errors.topic ? 'border-destructive' : ''}
                />
                {errors.topic && <p className="text-xs text-destructive mt-1">{errors.topic}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Describe your question or topic..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  placeholder="e.g., study-tips, campus-life"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Thread'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
