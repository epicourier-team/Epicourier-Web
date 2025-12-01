"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, ShoppingBasket, Trash2, TrendingUp, Calendar, Package } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface PantryItem {
    id: number;
    name: string;
    quantity: string;
    created_at: string;
}

// Helper function to get icon for item category
const getItemIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('rice') || lowerName.includes('pasta') || lowerName.includes('bread') || lowerName.includes('grain')) return '🌾';
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork') || lowerName.includes('meat')) return '🍖';
    if (lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('tuna')) return '🐟';
    if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt') || lowerName.includes('butter')) return '🥛';
    if (lowerName.includes('egg')) return '🥚';
    if (lowerName.includes('tomato') || lowerName.includes('carrot') || lowerName.includes('potato') || lowerName.includes('onion') || lowerName.includes('vegetable')) return '🥕';
    if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('orange') || lowerName.includes('fruit')) return '🍎';
    if (lowerName.includes('oil') || lowerName.includes('sauce') || lowerName.includes('spice')) return '🧂';
    return '📦';
};

export default function PantryPage() {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState("");
    const [newItemQuantity, setNewItemQuantity] = useState("");
    const [adding, setAdding] = useState(false);
    const { toast } = useToast();

    // Memoize supabase client to prevent recreation on every render
    const supabase = useMemo(() => createClient(), []);

    // Calculate statistics
    const totalItems = items.length;
    const recentItems = items.filter(item => {
        const itemDate = new Date(item.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
    }).length;

    const fetchItems = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false); // Fix: Set loading to false when no user
            return;
        }

        console.log("Fetching pantry items for auth user:", user.id);

        // First, get the User.id from the User table using auth_id
        const { data: userData, error: userError } = await supabase
            .from("User")
            .select("id")
            .eq("auth_id", user.id)
            .single();

        if (userError || !userData) {
            console.error("Error fetching user data:", userError);
            toast({
                title: "User Error",
                description: "Could not find user profile. Please ensure you're logged in.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }

        console.log("User database ID:", userData.id);

        // Now fetch pantry items using the User.id
        const { data, error } = await supabase
            .from("PantryItem")
            .select("*")
            .eq("user_id", userData.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching pantry items:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            toast({
                title: "Database Error",
                description: `Failed to load pantry items: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
        } else if (data) {
            console.log("Pantry items loaded:", data);
            setItems(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, []); // Empty dependency array - only run once on mount

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setAdding(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setAdding(false);
            return;
        }

        // First, get the User.id from the User table
        const { data: userData, error: userError } = await supabase
            .from("User")
            .select("id")
            .eq("auth_id", user.id)
            .single();

        if (userError || !userData) {
            console.error("Error fetching user data:", userError);
            toast({
                title: "Error",
                description: "Could not find user profile.",
                variant: "destructive",
            });
            setAdding(false);
            return;
        }

        const itemData = {
            user_id: userData.id,  // Use User.id, not auth.uid()
            name: newItemName,
            quantity: newItemQuantity,
        };

        console.log("Adding pantry item:", itemData);

        const { data, error } = await supabase
            .from("PantryItem")
            .insert(itemData)
            .select();

        if (error) {
            console.error("Error adding pantry item:", error);
            toast({
                title: "Error",
                description: `Failed to add item: ${error.message}`,
                variant: "destructive",
            });
        } else {
            console.log("Pantry item added successfully:", data);
            setNewItemName("");
            setNewItemQuantity("");
            fetchItems();
            toast({
                title: "Success",
                description: "Item added to pantry.",
            });
        }
        setAdding(false);
    };

    const handleDeleteItem = async (id: number) => {
        console.log("Deleting pantry item:", id);

        const { error } = await supabase.from("PantryItem").delete().eq("id", id);

        if (error) {
            console.error("Error deleting pantry item:", error);
            toast({
                title: "Error",
                description: `Failed to delete item: ${error.message}`,
                variant: "destructive",
            });
        } else {
            console.log("Pantry item deleted successfully");
            setItems(items.filter((item) => item.id !== id));
            toast({
                title: "Success",
                description: "Item removed.",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <ShoppingBasket className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                        My Pantry
                    </h1>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Track your ingredients to get better recipe recommendations
                </p>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:border-neutral-800 dark:from-emerald-950 dark:to-teal-950">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Items</p>
                            <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{totalItems}</p>
                        </div>
                        <Package className="h-10 w-10 text-emerald-600 opacity-50" />
                    </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 dark:border-neutral-800 dark:from-blue-950 dark:to-cyan-950">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Added This Week</p>
                            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{recentItems}</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-blue-600 opacity-50" />
                    </div>
                </div>

                <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-6 dark:border-neutral-800 dark:from-purple-950 dark:to-pink-950">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Last Updated</p>
                            <p className="text-lg font-bold text-purple-900 dark:text-purple-100 mt-1">
                                {items.length > 0 ? new Date(items[0].created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <Calendar className="h-10 w-10 text-purple-600 opacity-50" />
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
                {/* Add Item Form */}
                <div className="h-fit rounded-xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 className="mb-4 text-xl font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Item
                    </h2>
                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                Item Name
                            </label>
                            <Input
                                placeholder="e.g., Rice, Chicken, Tomatoes"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                Quantity (optional)
                            </label>
                            <Input
                                placeholder="e.g., 2 kg, 500g, 1 dozen"
                                value={newItemQuantity}
                                onChange={(e) => setNewItemQuantity(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={adding || !newItemName.trim()}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                        >
                            {adding ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add to Pantry
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Quick Add Suggestions */}
                    <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Quick Add:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Rice', 'Chicken', 'Eggs', 'Milk', 'Tomatoes', 'Onions'].map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setNewItemName(item)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-emerald-100 hover:text-emerald-700 transition-colors dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-emerald-900"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                            Your Ingredients
                        </h2>
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 py-16 text-neutral-500">
                            <ShoppingBasket className="mb-4 h-16 w-16 opacity-30" />
                            <p className="text-lg font-medium mb-1">Your pantry is empty</p>
                            <p className="text-sm">Add items to get personalized recipe recommendations</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-2xl dark:bg-neutral-800">
                                        {getItemIcon(item.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                            {item.name}
                                        </h3>
                                        {item.quantity && (
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                                                {item.quantity}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                        onClick={() => handleDeleteItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
