import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Copy, CheckCircle2, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadResource } from '@/lib/services/academic';
import { useUserProfile } from '@/hooks/useUserProfile';
import { readFileAsDataUrl, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/lib/resourceFiles';

interface UploadResourceDialogProps {
  onCreate?: () => void;
}

const CATEGORIES = [
  { value: 'notes', label: 'Lecture Notes' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'papers', label: 'Exam Papers' },
  { value: 'reference', label: 'Reference Books' },
  { value: 'code', label: 'Sample Code' },
  { value: 'presentations', label: 'Presentations' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'video', label: 'Video Tutorials' },
  { value: 'other', label: 'Other' },
];

export const UploadResourceDialog: React.FC<UploadResourceDialogProps> = ({ onCreate }) => {
  const { profile } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'notes',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters';
    if (!selectedFile) newErrors.file = 'Please select a file to upload';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: '' }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    const userId = profile?.id;
    if (!userId || !selectedFile) {
      toast.error('Please sign in and select a file to upload');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileDataUrl = await readFileAsDataUrl(selectedFile);
      const result = await uploadResource({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        uploadedBy: userId,
        uploadedByName: profile.full_name || 'Anonymous',
        subject: formData.category,
        file: selectedFile,
        fileDataUrl,
      });

      const joinCode = result[0]?.joinCode || result[0]?.join_code;
      setCreatedCode(joinCode || null);
      toast.success(`Resource "${formData.title}" uploaded successfully!`);
      onCreate?.();
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      toast.error(error.message || 'Failed to upload resource. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedCode(null);
    setSelectedFile(null);
    setFormData({ title: '', category: 'notes', description: '' });
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      toast.success('Access code copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="mt-4" variant="default">
          <Upload className="h-4 w-4 mr-2" />
          Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Study Resource</DialogTitle>
          <DialogDescription>
            Share educational materials with your students. Students will need an access code to view the resource.
          </DialogDescription>
        </DialogHeader>

        {createdCode ? (
          <div className="py-6 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Resource Uploaded Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Share this access code with students so they can download the resource:
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-widest text-primary">{createdCode}</span>
              <Button variant="outline" size="sm" onClick={copyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">File: {selectedFile.name}</p>
            )}
            <Button onClick={handleClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Resource Title <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Enter resource title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  placeholder="Describe the resource content and topics covered..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload File <span className="text-destructive">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">Click to select a file</span>
                      <span className="text-xs text-muted-foreground">
                        PDF, DOC, PPT, images, etc. (max {MAX_FILE_SIZE_MB}MB)
                      </span>
                    </div>
                  </Button>
                )}
                {errors.file && <p className="text-xs text-destructive mt-1">{errors.file}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload Resource'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
