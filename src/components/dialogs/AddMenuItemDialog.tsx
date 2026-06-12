import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createMenuItem } from '@/lib/services/canteen';

interface AddMenuItemDialogProps {
  onSuccess?: () => void;
}

const CATEGORIES = [
  'breakfast',
  'lunch',
  'dinner',
  'snacks',
  'beverages'
];

export const AddMenuItemDialog: React.FC<AddMenuItemDialogProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'lunch' as const,
    price: '',
    description: '',
    available: true,
    veg: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.price.trim()) newErrors.price = 'Price is required';
    if (parseFloat(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.category.trim()) newErrors.category = 'Category is required';

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
      const result = await createMenuItem({
        name: formData.name,
        category: formData.category as 'breakfast' | 'lunch' | 'snacks' | 'beverages' | 'dinner',
        price: parseFloat(formData.price),
        description: formData.description,
        available: formData.available,
        veg: formData.veg,
      });

      if (!result) {
        toast.error('❌ Failed to add menu item. Please try again.');
        setIsSubmitting(false);
        return;
      }

      toast.success(`✅ "${formData.name}" added to menu!`);

      setFormData({
        name: '',
        category: 'lunch',
        price: '',
        description: '',
        available: true,
        veg: false,
      });
      setErrors({});
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error('❌ Failed to add menu item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Menu Item</DialogTitle>
          <DialogDescription>
            Add a new item to the canteen menu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <Input
              placeholder="e.g., Butter Chicken"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Category and Price Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (errors.price) setErrors({ ...errors, price: '' });
                }}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              placeholder="Item description (e.g., ingredients, preparation method)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Vegetarian and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Vegetarian */}
            <div>
              <label className="block text-sm font-medium mb-1">Vegetarian</label>
              <Select value={formData.veg ? 'yes' : 'no'} onValueChange={(value) => setFormData({ ...formData, veg: value === 'yes' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Vegetarian</SelectItem>
                  <SelectItem value="no">No - Non-Vegetarian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Available Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={formData.available ? 'available' : 'unavailable'} onValueChange={(value) => setFormData({ ...formData, available: value === 'available' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
