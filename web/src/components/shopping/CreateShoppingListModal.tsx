"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CreateShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
}

/**
 * Modal for creating a new shopping list
 */
export default function CreateShoppingListModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateShoppingListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      // Reset form
      setName("");
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Shopping List</DialogTitle>
            <DialogDescription>
              Create a new list to organize your grocery shopping.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Groceries"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Shopping list for this week's meal plan"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create List
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
