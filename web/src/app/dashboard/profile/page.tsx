"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle2, Loader2, Save, UserCircle, Utensils, AlertTriangle, ChefHat, Info } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

const COMMON_ALLERGIES = ["No Allergy", "Peanuts", "Tree Nuts", "Shellfish", "Dairy", "Eggs", "Soy", "Wheat/Gluten", "Fish"];
const DIETARY_PREFERENCES = ["Vegetarian", "Vegan", "Keto", "Paleo", "Low-Carb", "Mediterranean", "Gluten-Free", "Dairy-Free"];
const KITCHEN_EQUIPMENT = ["Air Fryer", "Blender", "Slow Cooker", "Instant Pot", "Food Processor", "Stand Mixer", "Grill", "Wok"];

export default function ProfilePage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [previousWeight, setPreviousWeight] = useState<number | null>(null);
    const [previousHeight, setPreviousHeight] = useState<number | null>(null);
    const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
    const [allergies, setAllergies] = useState<string[]>([]);
    const [kitchenEquipment, setKitchenEquipment] = useState<string[]>([]);
    const [goals, setGoals] = useState("");
    const { toast } = useToast();

    // Memoize supabase client to prevent recreation on every render
    const supabase = useMemo(() => createClient(), []);

    // Calculate profile completeness (7 sections, ~14% each)
    const completeness = Math.round(
        ((age.trim().length > 0 ? 14 : 0) +
            (height.trim().length > 0 ? 14 : 0) +
            (weight.trim().length > 0 ? 14 : 0) +
            (dietaryPreferences.length > 0 ? 15 : 0) +
            (allergies.length > 0 ? 14 : 0) +
            (kitchenEquipment.length > 0 ? 14 : 0) +
            (goals.trim().length > 0 ? 15 : 0))
    );

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                console.log("Fetching profile for user:", user.id);
                const { data, error } = await supabase
                    .from("User")
                    .select("*")
                    .eq("auth_id", user.id)
                    .single();

                if (error) {
                    console.error("Error fetching profile:", error);
                } else if (data) {
                    console.log("Profile data loaded:", data);
                    setAge(data.age?.toString() || "");
                    setHeight(data.height_cm?.toString() || "");
                    setWeight(data.weight_kg?.toString() || "");
                    setPreviousWeight(data.weight_kg || null);
                    setPreviousHeight(data.height_cm || null);
                    setDietaryPreferences(data.dietary_preferences || []);
                    setAllergies(data.allergies || []);
                    setKitchenEquipment(data.kitchen_equipment || []);
                    setGoals(data.goals || "");
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, []); // Empty dependency array - only run once on mount

    const toggleItem = (item: string, list: string[], setList: (list: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to save profile.",
                variant: "destructive",
            });
            setSaving(false);
            return;
        }

        const updates = {
            age: age.trim() ? parseInt(age) : null,
            height_cm: height.trim() ? parseFloat(height) : null,
            weight_kg: weight.trim() ? parseFloat(weight) : null,
            dietary_preferences: dietaryPreferences,
            allergies: allergies,
            kitchen_equipment: kitchenEquipment,
            goals: goals,
        };

        console.log("Saving profile updates:", updates);

        const { data, error } = await supabase
            .from("User")
            .update(updates)
            .eq("auth_id", user.id)
            .select();

        if (error) {
            console.error("Error saving profile:", error);
            toast({
                title: "Error",
                description: `Failed to update profile: ${error.message}`,
                variant: "destructive",
            });
        } else {
            // Only log to history if weight/height actually changed
            const weightChanged = updates.weight_kg !== null && updates.weight_kg !== previousWeight;
            const heightChanged = updates.height_cm !== null && updates.height_cm !== previousHeight;

            if (weightChanged || heightChanged) {
                try {
                    await fetch("/api/insights/metrics", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: user.id,
                            weight_kg: weightChanged ? updates.weight_kg : null,
                            height_cm: heightChanged ? updates.height_cm : null,
                            recorded_at: new Date().toISOString()
                        }),
                    });
                } catch (err) {
                    console.error("Failed to log metrics history", err);
                }
            }

            // Update the stored previous values for future comparisons
            if (weightChanged) setPreviousWeight(updates.weight_kg);
            if (heightChanged) setPreviousHeight(updates.height_cm);

            console.log("Profile saved successfully:", data);
            toast({
                title: "Success",
                description: "Profile updated successfully.",
            });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <UserCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                        Your Profile
                    </h1>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Personalize your experience to get better meal recommendations
                </p>
            </div>

            {/* Profile Completeness Indicator */}
            <div className="mb-6 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 dark:border-neutral-800 dark:from-emerald-950 dark:to-teal-950">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                            Profile Completeness
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">{completeness}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-3 dark:bg-neutral-700">
                    <div
                        className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${completeness}%` }}
                    />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {completeness === 100 ? "Perfect! Your profile is complete." : "Fill out all sections for the best recommendations."}
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Physical Attributes Section */}
                <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-4">
                        <UserCircle className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Physical Attributes
                        </h2>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Help us calculate your nutritional needs more accurately
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                Age (years)
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g., 25"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                min="0"
                                max="150"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                Height (cm)
                            </label>
                            <Input
                                type="number"
                                step="0.1"
                                placeholder="e.g., 175"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                min="50"
                                max="300"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                Weight (kg)
                            </label>
                            <Input
                                type="number"
                                step="0.1"
                                placeholder="e.g., 70"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                min="20"
                                max="500"
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
                {/* Dietary Preferences Section */}
                <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-4">
                        <Utensils className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Dietary Preferences
                        </h2>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Select your dietary preferences to get personalized meal suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {DIETARY_PREFERENCES.map((pref) => (
                            <button
                                key={pref}
                                type="button"
                                onClick={() => toggleItem(pref, dietaryPreferences, setDietaryPreferences)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dietaryPreferences.includes(pref)
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                    }`}
                            >
                                {pref}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Allergies Section */}
                <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Allergies & Restrictions
                        </h2>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        We'll exclude recipes containing these ingredients
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_ALLERGIES.map((allergy) => (
                            <button
                                key={allergy}
                                type="button"
                                onClick={() => toggleItem(allergy, allergies, setAllergies)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${allergies.includes(allergy)
                                    ? "bg-red-600 text-white shadow-md"
                                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                    }`}
                            >
                                {allergy}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kitchen Equipment Section */}
                <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-4">
                        <ChefHat className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Kitchen Equipment
                        </h2>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Select the equipment you have available
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {KITCHEN_EQUIPMENT.map((equipment) => (
                            <button
                                key={equipment}
                                type="button"
                                onClick={() => toggleItem(equipment, kitchenEquipment, setKitchenEquipment)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${kitchenEquipment.includes(equipment)
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                    }`}
                            >
                                {equipment}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Goals Section */}
                <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="h-5 w-5 text-purple-600" />
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Your Goals
                        </h2>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Tell us about your health and nutrition goals
                    </p>
                    <textarea
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="e.g., I want to lose 10 pounds while building muscle. I prefer high-protein meals and want to eat more vegetables..."
                    />
                </div>

                {/* Save Button */}
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Save Profile
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
