"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";

import type { ShoppingList } from "@/types/data";

interface DeleteListDialogProps {
  list: ShoppingList;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Confirmation dialog for deleting a shopping list
 *
 * Features:
 * - Confirmation prompt
 * - Archive (soft delete) functionality
 * - Loading state during deletion
 * - Undo option via toast
 */
export default function DeleteListDialog({
  list,
  isOpen,
  onClose,
  onSuccess,
}: DeleteListDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleDelete = async () => {
    setLoading(true);

    try {
      // Soft delete by setting is_archived to true
      const { error } = await supabase
        .from("shopping_lists")
        .update({
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", list.id);

      if (error) {
        console.error("Error archiving shopping list:", error);
        toast({
          title: "❌ Error",
          description: "Failed to delete shopping list",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "🗑️ List Deleted",
        description: (
          <div>
            <p className="mb-2">"{list.name}" has been deleted</p>
            <button
              onClick={() => handleUndo()}
              className="brutalism-button-neutral px-3 py-1 text-xs"
            >
              Undo
            </button>
          </div>
        ),
        duration: 10000,
      });

      onClose();
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

  const handleUndo = async () => {
    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({
          is_archived: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", list.id);

      if (error) {
        console.error("Error restoring shopping list:", error);
        toast({
          title: "❌ Error",
          description: "Failed to restore shopping list",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "↩️ Restored",
        description: `"${list.name}" has been restored`,
      });

      onSuccess();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="border-4 border-black bg-amber-50 p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-md">
        <AlertDialogHeader className="border-b-4 border-black bg-red-300 p-6">
          <AlertDialogTitle className="text-xl font-black uppercase">
            Delete Shopping List?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-bold text-gray-800">
            This will archive "{list.name}". You can undo this action within 10 seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-6">
          <p className="text-sm font-semibold text-gray-700">
            Are you sure you want to delete this shopping list? All items in this list will also be
            archived.
          </p>
        </div>

        <AlertDialogFooter className="border-t-4 border-black bg-gray-50 p-4">
          <div className="flex w-full gap-3">
            <AlertDialogCancel
              disabled={loading}
              className="brutalism-button-neutral flex-1 px-4 py-2 disabled:opacity-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="brutalism-button-inverse flex-1 bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete List"}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
