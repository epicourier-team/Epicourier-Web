"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ShoppingListWithStats } from "@/types/data";
import { useState, useEffect, useCallback } from "react";
import { Plus, ShoppingCart, Loader2, Check } from "lucide-react";

interface Ingredient {
  id: number;
  ingredientId: number;
  name: string;
  unit?: string;
  quantity?: number;
}

interface AddToShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  recipeName: string;
}

export default function AddToShoppingListModal({
  isOpen,
  onClose,
  ingredients,
  recipeName,
}: AddToShoppingListModalProps) {
  const { toast } = useToast();
  const [shoppingLists, setShoppingLists] = useState<ShoppingListWithStats[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [createNew, setCreateNew] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing shopping lists
  const fetchShoppingLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shopping-lists");
      if (res.ok) {
        const data = await res.json();
        // Filter out archived lists
        const activeLists = data.filter((list: ShoppingListWithStats) => !list.is_archived);
        setShoppingLists(activeLists);
        if (activeLists.length > 0 && !selectedListId) {
          setSelectedListId(activeLists[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch shopping lists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedListId]);

  useEffect(() => {
    if (isOpen) {
      fetchShoppingLists();
      // Select all ingredients by default
      setSelectedIngredients(new Set(ingredients.map((i) => i.id)));
    }
  }, [isOpen, ingredients, fetchShoppingLists]);

  const toggleIngredient = (id: number) => {
    setSelectedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIngredients(new Set(ingredients.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedIngredients(new Set());
  };

  const handleSubmit = async () => {
    if (selectedIngredients.size === 0) {
      toast({
        title: "No ingredients selected",
        description: "Please select at least one ingredient to add.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let targetListId = selectedListId;

      // Create new list if needed
      if (createNew || shoppingLists.length === 0) {
        const listName = newListName.trim() || `Shopping for ${recipeName}`;
        const createRes = await fetch("/api/shopping-lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: listName,
            description: `Ingredients from ${recipeName}`,
          }),
        });

        if (!createRes.ok) {
          throw new Error("Failed to create shopping list");
        }

        const newList = await createRes.json();
        targetListId = newList.id;
      }

      // Add selected ingredients to the list
      const selectedItems = ingredients.filter((i) => selectedIngredients.has(i.id));
      const addPromises = selectedItems.map((ingredient) =>
        fetch(`/api/shopping-lists/${targetListId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_name: ingredient.name,
            ingredient_id: ingredient.ingredientId,
            quantity: ingredient.quantity || 1,
            unit: ingredient.unit || null,
            category: "Other",
          }),
        })
      );

      await Promise.all(addPromises);

      toast({
        title: "✅ Added to shopping list",
        description: `${selectedItems.length} ingredient${selectedItems.length > 1 ? "s" : ""} added successfully.`,
      });

      onClose();
    } catch (error) {
      console.error("Failed to add items:", error);
      toast({
        title: "Error",
        description: "Failed to add ingredients to shopping list.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brutalism-card brutalism-shadow-xl max-w-md rounded-none border-2 border-black p-0">
        <DialogHeader className="border-b-2 border-black bg-emerald-300 p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <ShoppingCart className="h-5 w-5" />
            Add to Shopping List
          </DialogTitle>
          <DialogDescription className="font-medium text-gray-700">
            Add ingredients from <span className="font-bold">{recipeName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* List Selection */}
          <div className="mb-4">
            <Label className="mb-2 block font-bold">Shopping List</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading lists...
              </div>
            ) : shoppingLists.length === 0 ? (
              <div className="brutalism-border bg-gray-50 p-3 text-sm text-gray-600">
                No shopping lists yet. A new one will be created.
              </div>
            ) : (
              <>
                <Select
                  value={createNew ? "new" : selectedListId}
                  onValueChange={(val: string) => {
                    if (val === "new") {
                      setCreateNew(true);
                    } else {
                      setCreateNew(false);
                      setSelectedListId(val);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="brutalism-border w-full rounded-none">
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent className="brutalism-border rounded-none">
                    {shoppingLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list.item_count} items)
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      <span className="flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Create new list
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {createNew && (
                  <Input
                    className="brutalism-border mt-2 rounded-none"
                    placeholder={`Shopping for ${recipeName}`}
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    disabled={isSubmitting}
                  />
                )}
              </>
            )}
          </div>

          {/* Ingredients Selection */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="font-bold">
                Ingredients ({selectedIngredients.size}/{ingredients.length})
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-medium text-emerald-600 hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs font-medium text-gray-600 hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>

            <div className="brutalism-border max-h-60 overflow-y-auto bg-white">
              {ingredients.map((ingredient) => (
                <label
                  key={ingredient.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-200 p-3 last:border-b-0 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedIngredients.has(ingredient.id)}
                    onCheckedChange={() => toggleIngredient(ingredient.id)}
                    className="brutalism-border h-5 w-5 rounded-none"
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{ingredient.name}</span>
                    {ingredient.unit && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({ingredient.quantity || 1} {ingredient.unit})
                      </span>
                    )}
                  </div>
                  {selectedIngredients.has(ingredient.id) && (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t-2 border-black bg-gray-50 p-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="brutalism-border rounded-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIngredients.size === 0}
            className="brutalism-border brutalism-shadow-sm rounded-none bg-emerald-500 font-bold text-white hover:bg-emerald-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add {selectedIngredients.size} item{selectedIngredients.size !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
