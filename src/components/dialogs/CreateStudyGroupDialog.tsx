import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createStudyGroup } from '@/lib/services/academic';
import { useUserProfile } from '@/hooks/useUserProfile';

interface CreateStudyGroupDialogProps {
  onCreate?: () => void;
}

export const CreateStudyGroupDialog: React.FC<CreateStudyGroupDialogProps> = ({ onCreate }) => {
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    maxMembers: '10',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Group name is required';
    if (formData.name.length < 3) newErrors.name = 'Group name must be at least 3 characters';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (parseInt(formData.maxMembers) < 2) newErrors.maxMembers = 'Max members must be at least 2';
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
      toast.error('Please sign in to create study groups');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStudyGroup({
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
        maxMembers: parseInt(formData.maxMembers),
        createdBy: userId,
      });

      const joinCode = result[0]?.joinCode || result[0]?.join_code;
      setCreatedCode(joinCode || null);
      toast.success(`Study group "${formData.name}" created!`);
      onCreate?.();
    } catch (error) {
      console.error('Error creating study group:', error);
      toast.error('Failed to create study group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedCode(null);
    setFormData({ name: '', subject: '', description: '', maxMembers: '10' });
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
          <Users className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
          <DialogDescription>
            Create a new study group for collaborative learning
          </DialogDescription>
        </DialogHeader>

        {createdCode ? (
          <div className="py-6 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Group Created Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Share this join code with students so they can access the group:
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
                  Group Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Enter study group name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Enter subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={errors.subject ? 'border-destructive' : ''}
                />
                {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  placeholder="Describe the group's purpose..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Group Members <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                  className={errors.maxMembers ? 'border-destructive' : ''}
                />
                {errors.maxMembers && <p className="text-xs text-destructive mt-1">{errors.maxMembers}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
