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
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal for creating a new shopping list
 *
 * Features:
 * - Name input (required)
 * - Description input (optional)
 * - Form validation
 * - Loading state during creation
 */
export default function CreateListModal({ isOpen, onClose, onSuccess }: CreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "⚠️ Name Required",
        description: "Please enter a list name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "⚠️ Authentication Required",
          description: "Please sign in to create a shopping list",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("shopping_lists").insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        is_archived: false,
      });

      if (error) {
        console.error("Error creating shopping list:", error);
        toast({
          title: "❌ Error",
          description: "Failed to create shopping list",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Success",
        description: "Shopping list created!",
      });

      setName("");
      setDescription("");
      onSuccess();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-4 border-black bg-amber-50 p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b-4 border-black bg-yellow-300 p-6">
            <DialogTitle className="text-xl font-black uppercase">Create Shopping List</DialogTitle>
            <DialogDescription className="text-sm font-bold text-gray-800">
              Start a new shopping list for your groceries
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div>
              <label htmlFor="list-name" className="mb-2 block text-sm font-bold">
                List Name <span className="text-red-600">*</span>
              </label>
              <input
                id="list-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekly Groceries"
                className="brutalism-input w-full px-3 py-2"
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="list-description" className="mb-2 block text-sm font-bold">
                Description (Optional)
              </label>
              <textarea
                id="list-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this shopping list..."
                className="brutalism-input w-full px-3 py-2"
                rows={3}
                disabled={loading}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter className="border-t-4 border-black bg-gray-50 p-4">
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="brutalism-button-neutral flex-1 px-4 py-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="brutalism-button-primary flex-1 px-4 py-2 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create List"}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
