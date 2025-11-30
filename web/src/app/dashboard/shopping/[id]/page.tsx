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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const handleTransferToInventory = async (
    items: TransferToInventoryRequest[]
  ) => {
    const success = await transfer(items);
    if (success) {
      fetchList(); // Refresh the list
      router.refresh(); // Refresh any server components
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
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Print shopping list
  const handlePrint = () => {
    const text = generateExportText();
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
      <div className="flex min-h-[400px] items-center justify-center">
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
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <div className="bg-card max-w-md rounded-xl border p-6 text-center">
          <p className="mb-2 font-bold text-red-600">Error</p>
          <p className="text-muted-foreground text-sm">{error || "List not found"}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/shopping")}>
              Back to Lists
            </Button>
            <Button onClick={fetchList}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const { groups, sortedCategories } = groupItemsByCategory(list.shopping_list_items);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/shopping"
            className="hover:bg-muted mt-1 rounded-lg p-2 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{list.name}</h1>
            {list.description && (
              <p className="text-muted-foreground mt-1 text-sm">{list.description}</p>
            )}
          </div>
        </div>

        {/* Export Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
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

      {/* Progress */}
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            {progress.checked} of {progress.total} items checked
          </span>
          <span className="text-sm font-bold text-emerald-600">{progress.percentage}%</span>
        </div>
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <Input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add an item..."
          disabled={isAddingItem}
          className="flex-1"
        />
        <Button type="submit" disabled={!newItemName.trim() || isAddingItem}>
          {isAddingItem ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          <span className="ml-1 hidden sm:inline">Add</span>
        </Button>
      </form>

      {/* Items List */}
      {list.shopping_list_items.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <ShoppingCart className="text-muted-foreground/50 mx-auto size-12" />
          <h3 className="mt-4 text-lg font-semibold">No items yet</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Add items to your shopping list above
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category) => (
            <div key={category} className="bg-card overflow-hidden rounded-xl border shadow-sm">
              <div className="bg-muted/50 border-b px-4 py-2">
                <h3 className="text-sm font-semibold">{category}</h3>
              </div>
              <div className="divide-y">
                {groups[category].map((item) => (
                  <div
                    key={item.id}
                    className={`hover:bg-muted/30 flex items-center gap-3 p-3 transition-colors ${
                      item.is_checked ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleToggleItem(item)}
                      className="hover:bg-muted flex-shrink-0 rounded p-1 transition-colors"
                    >
                      {item.is_checked ? (
                        <CheckSquare className="size-5 text-emerald-500" />
                      ) : (
                        <Square className="text-muted-foreground size-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-medium ${
                          item.is_checked ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {item.item_name}
                      </p>
                      {(item.quantity > 1 || item.unit) && (
                        <p className="text-muted-foreground text-xs">
                          {item.quantity} {item.unit || ""}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
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
          <Button
            variant="outline"
            onClick={async () => {
              // Check all unchecked items
              const uncheckedItems = list.shopping_list_items.filter((i) => !i.is_checked);
              for (const item of uncheckedItems) {
                await handleToggleItem(item);
              }
            }}
            className="gap-2"
          >
            <Check className="size-4" />
            Mark All Complete
          </Button>
        )}

        {/* Complete Shopping (Batch Transfer) Button */}
        {list.shopping_list_items.some((i) => i.is_checked && i.ingredient_id) && (
          <Button
            onClick={() => setIsBatchTransferOpen(true)}
            disabled={isTransferring}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Package className="size-4" />
            Complete Shopping ({getCheckedItems().length})
          </Button>
        )}
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
