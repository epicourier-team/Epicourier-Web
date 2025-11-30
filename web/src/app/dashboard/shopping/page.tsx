"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingCart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateListModal from "@/components/shopping/CreateListModal";
import ShoppingListCard from "@/components/shopping/ShoppingListCard";

import type { ShoppingListWithStats } from "@/types/data";

/**
 * Shopping Lists page - manage multiple shopping lists
 *
 * Features:
 * - Display all shopping lists as cards
 * - Create new shopping list via modal
 * - Empty state with CTA
 * - Loading and error states
 */
export default function ShoppingPage() {
  const [lists, setLists] = useState<ShoppingListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchLists = async () => {
    setLoading(true);
    try {
      // Use API endpoint to get lists with stats
      const response = await fetch("/api/shopping-lists");

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "⚠️ Authentication Required",
            description: "Please sign in to view shopping lists",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to fetch shopping lists");
      }

      const data = await response.json();
      setLists(data || []);
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

  useEffect(() => {
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSuccess = () => {
    fetchLists();
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Loading shopping lists...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="brutalism-banner mb-6 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="size-8" />
            <div>
              <h1 className="brutalism-title text-2xl">Shopping Lists</h1>
              <p className="text-sm font-semibold text-gray-700">
                {lists.length} {lists.length === 1 ? "list" : "lists"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="brutalism-button-primary flex items-center gap-2 px-4 py-2"
          >
            <Plus className="size-4" />
            <span>New List</span>
          </button>
        </div>
      </div>

      {/* Shopping Lists Grid or Empty State */}
      {lists.length === 0 ? (
        <div className="brutalism-panel flex flex-col items-center justify-center p-12 text-center">
          <ShoppingCart className="mb-4 size-16 text-gray-400" />
          <h2 className="brutalism-heading mb-2 text-xl">No Shopping Lists Yet</h2>
          <p className="mb-6 text-gray-600">
            Create your first shopping list to start organizing your groceries
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="brutalism-button-primary flex items-center gap-2 px-6 py-3"
          >
            <Plus className="size-5" />
            <span>Create First List</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ShoppingListCard key={list.id} list={list} onUpdate={fetchLists} />
          ))}
        </div>
      )}

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
