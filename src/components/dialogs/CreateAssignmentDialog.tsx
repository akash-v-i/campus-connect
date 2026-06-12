import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { createAssignment } from '@/lib/services/academic';
import { useUserProfile } from '@/hooks/useUserProfile';

interface CreateAssignmentDialogProps {
  onCreate?: (assignment: {
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    difficulty: string;
  }) => void;
}

export const CreateAssignmentDialog: React.FC<CreateAssignmentDialogProps> = ({ onCreate }) => {
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Computer Science',
    description: '',
    dueDate: '',
    maxScore: '100',
    difficulty: 'Medium',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';

    const dueDate = new Date(formData.dueDate);
    if (dueDate < new Date()) newErrors.dueDate = 'Due date must be in the future';

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
      toast.error('❌ Please sign in to create assignments');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAssignment({
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        dueDate: new Date(formData.dueDate),
        maxScore: parseInt(formData.maxScore),
        createdBy: profile.id,
      });

      toast.success(`📝 Assignment "${formData.title}" created successfully!`);

      onCreate?.({
        ...formData,
        maxScore: parseInt(formData.maxScore),
      });

      setFormData({
        title: '',
        subject: 'Computer Science',
        description: '',
        dueDate: '',
        maxScore: '100',
        difficulty: 'Medium',
      });
      setErrors({});
      setOpen(false);
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('❌ Failed to create assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4" variant="default">
          <FileText className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📝 Create New Assignment</DialogTitle>
          <DialogDescription>
            Create a new assignment for your students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Assignment Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter assignment title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Subject <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Data Structures"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Enter detailed assignment description and requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>

          {/* Due Date, Max Score, and Difficulty Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Due Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={errors.dueDate ? 'border-destructive' : ''}
              />
              {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Score <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                className={errors.maxScore ? 'border-destructive' : ''}
              />
              {errors.maxScore && <p className="text-xs text-destructive mt-1">{errors.maxScore}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? '⏳ Creating...' : '✅ Create Assignment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
