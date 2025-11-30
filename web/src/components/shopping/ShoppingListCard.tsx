"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit2, ShoppingBag, Calendar } from "lucide-react";
import EditListModal from "./EditListModal";
import DeleteListDialog from "./DeleteListDialog";

import type { ShoppingListWithStats } from "@/types/data";

interface ShoppingListCardProps {
  list: ShoppingListWithStats;
  onUpdate: () => void;
}

/**
 * Shopping list card component
 *
 * Features:
 * - Display list name, description, creation date
 * - Show item count (placeholder for now)
 * - Click to view details
 * - Hover effects with brutalism styling
 */
export default function ShoppingListCard({ list, onUpdate }: ShoppingListCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const createdDate = new Date(list.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleClick = () => {
    router.push(`/dashboard/shopping/${list.id}`);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onUpdate();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    onUpdate();
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`brutalism-card group flex cursor-pointer flex-col overflow-hidden transition-all ${
        isHovered ? "-translate-x-0.5 -translate-y-0.5" : ""
      }`}
    >
      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="brutalism-text-bold text-lg leading-tight">{list.name}</h3>
          </div>
        </div>

        {/* Description */}
        {list.description && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">{list.description}</p>
        )}

        {/* Spacer to push actions to bottom */}
        <div className="flex-1" />

        {/* Stats */}
        <div className="mb-3 flex items-center gap-4 text-sm font-semibold text-gray-700">
          <div className="flex items-center gap-1">
            <ShoppingBag className="size-4" />
            <span>
              {list.item_count} {list.item_count === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="size-4" />
            <span>{createdDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditModalOpen(true);
            }}
            className="brutalism-button-neutral r flex flex-1 items-center gap-1 px-3 py-2 text-sm"
          >
            <Edit2 className="size-4 text-black" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
            className="brutalism-button-neutral flex flex-1 items-center gap-1 px-3 py-2 text-sm"
          >
            <Trash2 className="size-4 text-black" />
            Delete
          </button>
        </div>
      </div>

      {/* Footer accent */}
      <div className="h-2 bg-emerald-400" />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditListModal
            list={list}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
          />
        </div>
      )}

      {/* Delete Dialog */}
      {isDeleteDialogOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <DeleteListDialog
            list={list}
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onSuccess={handleDeleteSuccess}
          />
        </div>
      )}
    </div>
  );
}
