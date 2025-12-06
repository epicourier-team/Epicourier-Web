"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Loader2,
  ArrowLeft,
  Check,
  MoreVertical,
  Trash2,
  Square,
  CheckSquare,
  Copy,
  Printer,
  Share2,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  TransferToInventoryModal,
  BatchTransferModal,
  type ShoppingItemForTransfer,
} from "@/components/shopping/TransferFlow";
import { useTransferToInventory } from "@/hooks/useTransferToInventory";
import type { TransferToInventoryRequest } from "@/types/data";

interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_id: number | null;
  item_name: string;
  quantity: number;
  unit: string | null;
  category: string;
  is_checked: boolean;
  position: number;
  notes: string | null;
  created_at: string;
  Ingredient?: {
    id: number;
    name: string;
    unit: string | null;
  } | null;
}

interface ShoppingListWithItems {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  shopping_list_items: ShoppingListItem[];
}

/**
 * Shopping List Detail Page
 * View and manage items in a shopping list
 */
export default function ShoppingListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;
  const { toast } = useToast();

  const [list, setList] = useState<ShoppingListWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Transfer to inventory state
  const [transferModalItem, setTransferModalItem] = useState<ShoppingItemForTransfer | null>(null);
  const [isBatchTransferOpen, setIsBatchTransferOpen] = useState(false);
  const { transfer, isTransferring } = useTransferToInventory();

  // Fetch list details
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping-lists/${listId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/signin");
          return;
        }
        if (res.status === 404) {
          throw new Error("Shopping list not found");
        }
        throw new Error("Failed to fetch shopping list");
      }
      const data: ShoppingListWithItems = await res.json();
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [listId, router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Add new item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isAddingItem) return;

    setIsAddingItem(true);
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_name: newItemName.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to add item");
      }

      setNewItemName("");
      fetchList();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  // Toggle item checked state
  const handleToggleItem = async (item: ShoppingListItem) => {
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_checked: !item.is_checked }),
      });

      if (!res.ok) {
        throw new Error("Failed to update item");
      }

      // Optimistic update
      setList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          shopping_list_items: prev.shopping_list_items.map((i) =>
            i.id === item.id ? { ...i, is_checked: !i.is_checked } : i
          ),
        };
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update item",
        variant: "destructive",
      });
      fetchList(); // Revert on error
    }
  };

  // Delete item
  const handleDeleteItem = async (item: ShoppingListItem) => {
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete item");
      }

      // Optimistic update
      setList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          shopping_list_items: prev.shopping_list_items.filter((i) => i.id !== item.id),
        };
      });

      toast({
        title: "Item removed",
        description: `"${item.item_name}" has been removed.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete item",
        variant: "destructive",
      });
      fetchList(); // Revert on error
    }
  };

  // Transfer item to inventory
  const handleTransferToInventory = async (items: TransferToInventoryRequest[]) => {
    const success = await transfer(items);
    if (success) {
      // Get the IDs of transferred items
      const transferredIds = new Set(items.map((item) => item.shopping_item_id));

      // Check if all items will be processed after this transfer
      const remainingItems =
        list?.shopping_list_items.filter((item) => !transferredIds.has(item.id)) || [];

      if (remainingItems.length === 0) {
        // All items transferred - archive or delete the list
        await handleCompleteList();
      } else {
        fetchList(); // Refresh the list
        router.refresh(); // Refresh any server components
      }
    }
  };

  // Complete and archive the shopping list
  const handleCompleteList = async () => {
    try {
      const res = await fetch(`/api/shopping-lists/${listId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to complete shopping list");
      }

      toast({
        title: "🎉 Shopping Complete!",
        description: "All items have been added to your inventory. List has been removed.",
      });

      // Navigate back to shopping lists
      router.push("/dashboard/shopping");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to complete list",
        variant: "destructive",
      });
      fetchList();
    }
  };

  // Get checked items for batch transfer
  const getCheckedItems = (): ShoppingItemForTransfer[] => {
    if (!list) return [];
    return list.shopping_list_items
      .filter((item) => item.is_checked && item.ingredient_id !== null)
      .map((item) => ({
        id: item.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        ingredient_id: item.ingredient_id,
      }));
  };

  // Group items by category
  const groupItemsByCategory = (items: ShoppingListItem[]) => {
    const groups: Record<string, ShoppingListItem[]> = {};
    items.forEach((item) => {
      const category = item.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    // Sort categories alphabetically, but put "Other" last
    const sortedCategories = Object.keys(groups).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
    return { groups, sortedCategories };
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!list || list.shopping_list_items.length === 0) {
      return { checked: 0, total: 0, percentage: 0 };
    }
    const total = list.shopping_list_items.length;
    const checked = list.shopping_list_items.filter((i) => i.is_checked).length;
    return { checked, total, percentage: Math.round((checked / total) * 100) };
  };

  // Generate text for export
  const generateExportText = (includeChecked: boolean = true) => {
    if (!list) return "";

    const { groups, sortedCategories } = groupItemsByCategory(list.shopping_list_items);
    let text = `🛒 ${list.name}\n`;
    if (list.description) {
      text += `${list.description}\n`;
    }
    text += `\n`;

    for (const category of sortedCategories) {
      const items = groups[category].filter((item) => includeChecked || !item.is_checked);
      if (items.length === 0) continue;

      text += `📦 ${category}\n`;
      for (const item of items) {
        const checkbox = item.is_checked ? "✓" : "○";
        const quantity =
          item.quantity > 1 || item.unit
            ? ` (${item.quantity}${item.unit ? " " + item.unit : ""})`
            : "";
        text += `  ${checkbox} ${item.item_name}${quantity}\n`;
      }
      text += `\n`;
    }

    const progress = calculateProgress();
    text += `---\n`;
    text += `Progress: ${progress.checked}/${progress.total} items (${progress.percentage}%)\n`;

    return text;
  };

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    const text = generateExportText();
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✅ Copied!",
        description: "Shopping list copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Print shopping list
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${list?.name || "Shopping List"}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              line-height: 1.6;
            }
            h1 { margin-bottom: 5px; }
            .description { color: #666; margin-bottom: 20px; }
            .category { font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
            .item { padding: 3px 0; padding-left: 20px; }
            .checked { text-decoration: line-through; color: #999; }
            .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>🛒 ${list?.name || "Shopping List"}</h1>
          ${list?.description ? `<p class="description">${list.description}</p>` : ""}
          ${sortedCategories
            .map((category) => {
              const items = groups[category];
              return `
                <div class="category">📦 ${category}</div>
                ${items
                  .map(
                    (item) => `
                      <div class="item ${item.is_checked ? "checked" : ""}">
                        ${item.is_checked ? "✓" : "○"} ${item.item_name}
                        ${item.quantity > 1 || item.unit ? `(${item.quantity}${item.unit ? " " + item.unit : ""})` : ""}
                      </div>
                    `
                  )
                  .join("")}
              `;
            })
            .join("")}
          <div class="footer">
            Progress: ${progress.checked}/${progress.total} items (${progress.percentage}%)
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Loading shopping list...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !list) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="brutalism-panel max-w-md p-6 text-center">
          <p className="mb-2 font-bold text-red-600">Error</p>
          <p className="text-sm text-gray-600">{error || "List not found"}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => router.push("/dashboard/shopping")}
              className="brutalism-button-neutral px-4 py-2"
            >
              Back to Lists
            </button>
            <button onClick={fetchList} className="brutalism-button-primary px-4 py-2">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const { groups, sortedCategories } = groupItemsByCategory(list.shopping_list_items);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header Banner */}
        <div className="brutalism-banner p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link href="/dashboard/shopping" className="mt-1">
                <button className="brutalism-button-neutral p-2">
                  <ArrowLeft className="size-5" />
                </button>
              </Link>
              <div>
                <h1 className="brutalism-title text-2xl">{list.name}</h1>
                {list.description && (
                  <p className="mt-1 text-sm font-semibold text-gray-700">{list.description}</p>
                )}
              </div>
            </div>

            {/* Export Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="brutalism-button-secondary flex items-center gap-2 px-3 py-2">
                  <Share2 className="size-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleCopyToClipboard}>
                  <Copy className="mr-2 size-4" />
                  Copy to Clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 size-4" />
                  Print List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Panel */}
        <div className="brutalism-panel p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {progress.checked} of {progress.total} items checked
            </span>
            <span className="text-sm font-bold text-emerald-600">{progress.percentage}%</span>
          </div>
          <div className="brutalism-border h-3 overflow-hidden bg-gray-100">
            <div
              className="h-full bg-emerald-400 transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add an item..."
            disabled={isAddingItem}
            className="brutalism-input flex-1 px-3 py-2"
          />
          <button
            type="submit"
            disabled={!newItemName.trim() || isAddingItem}
            className="brutalism-button-primary flex items-center gap-1 px-4 py-2 disabled:opacity-40"
          >
            {isAddingItem ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>

        {/* Items List */}
        {list.shopping_list_items.length === 0 ? (
          <div className="brutalism-panel p-12 text-center">
            <ShoppingCart className="mx-auto size-12 text-gray-400" />
            <h3 className="brutalism-heading mt-4 text-lg">No items yet</h3>
            <p className="mt-2 text-sm text-gray-600">Add items to your shopping list above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((category) => (
              <div key={category} className="brutalism-panel overflow-hidden">
                <div className="brutalism-border border-x-0 border-t-0 bg-amber-100 px-4 py-2">
                  <h3 className="brutalism-text-bold text-sm">{category}</h3>
                </div>
                <div>
                  {groups[category].map((item) => (
                    <div
                      key={item.id}
                      className={`brutalism-border flex items-center gap-3 border-x-0 border-t-0 p-3 transition-opacity last:border-b-0 ${
                        item.is_checked ? "opacity-60" : ""
                      }`}
                    >
                      <button
                        onClick={() => handleToggleItem(item)}
                        className="shrink-0 p-1 transition-transform hover:scale-110"
                      >
                        {item.is_checked ? (
                          <CheckSquare className="size-5 text-emerald-500" />
                        ) : (
                          <Square className="size-5 text-gray-600" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-semibold ${
                            item.is_checked ? "text-gray-500 line-through" : ""
                          }`}
                        >
                          {item.item_name}
                        </p>
                        {(item.quantity > 1 || item.unit) && (
                          <p className="text-xs text-gray-600">
                            {item.quantity} {item.unit || ""}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="brutalism-button-neutral p-2">
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {item.ingredient_id && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setTransferModalItem({
                                    id: item.id,
                                    item_name: item.item_name,
                                    quantity: item.quantity,
                                    unit: item.unit,
                                    category: item.category,
                                    ingredient_id: item.ingredient_id,
                                  })
                                }
                              >
                                <Package className="mr-2 size-4" />
                                Mark as Purchased
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteItem(item)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {/* Mark All Complete Button */}
          {list.shopping_list_items.length > 0 && progress.checked < progress.total && (
            <button
              onClick={async () => {
                // Check all unchecked items
                const uncheckedItems = list.shopping_list_items.filter((i) => !i.is_checked);
                for (const item of uncheckedItems) {
                  await handleToggleItem(item);
                }
              }}
              className="brutalism-button-secondary flex items-center gap-2 px-6 py-3"
            >
              <Check className="size-4" />
              Mark All Complete
            </button>
          )}

          {/* Complete Shopping (Batch Transfer) Button */}
          {list.shopping_list_items.some((i) => i.is_checked && i.ingredient_id) && (
            <button
              onClick={() => setIsBatchTransferOpen(true)}
              disabled={isTransferring}
              className="brutalism-button-primary flex items-center gap-2 px-6 py-3 disabled:opacity-40"
            >
              <Package className="size-4" />
              Complete Shopping ({getCheckedItems().length})
            </button>
          )}
        </div>
      </div>

      {/* Transfer Modals */}
      {transferModalItem && (
        <TransferToInventoryModal
          isOpen={true}
          onClose={() => setTransferModalItem(null)}
          item={transferModalItem}
          onTransfer={handleTransferToInventory}
        />
      )}

      <BatchTransferModal
        isOpen={isBatchTransferOpen}
        onClose={() => setIsBatchTransferOpen(false)}
        items={getCheckedItems()}
        onTransfer={handleTransferToInventory}
      />
    </div>
  );
}
