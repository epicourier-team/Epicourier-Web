"use client";

import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryLocation, ShoppingItemCategory } from "@/types/data";

interface ExpirationInputProps {
  value: string;
  onChange: (date: string) => void;
  category?: ShoppingItemCategory | string;
}

/**
 * Expiration date presets based on food type
 */
const EXPIRATION_PRESETS: Record<string, number> = {
  Produce: 5, // Fresh produce: +5 days
  Dairy: 10, // Dairy: +10 days
  Meat: 3, // Meat/Poultry: +3 days
  Seafood: 3, // Seafood: +3 days
  Pantry: 90, // Pantry items: +90 days
  Frozen: 180, // Frozen: +180 days
  Bakery: 5, // Bakery: +5 days
  Beverages: 30, // Beverages: +30 days
  Snacks: 30, // Snacks: +30 days
  Condiments: 90, // Condiments: +90 days
  Other: 14, // Default: +14 days
};

/**
 * Get expiration date preset based on category
 */
function getDefaultExpiration(category?: string): string {
  const days = EXPIRATION_PRESETS[category || "Other"] || 14;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * ExpirationInput - Date picker with presets for expiration dates
 */
export function ExpirationInput({ value, onChange, category }: ExpirationInputProps) {
  const presets = [
    { label: "3 days", days: 3 },
    { label: "1 week", days: 7 },
    { label: "2 weeks", days: 14 },
    { label: "1 month", days: 30 },
    { label: "3 months", days: 90 },
  ];

  const handlePresetClick = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange(date.toISOString().split("T")[0]);
  };

  const handleSuggestClick = () => {
    onChange(getDefaultExpiration(category));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="expiration" className="flex items-center gap-2">
        <Calendar className="size-4" />
        Expiration Date
      </Label>
      <div className="flex gap-2">
        <Input
          id="expiration"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleSuggestClick}>
          Suggest
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlePresetClick(preset.days)}
          >
            +{preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface LocationSelectorProps {
  value: InventoryLocation;
  onChange: (location: InventoryLocation) => void;
}

/**
 * LocationSelector - Storage location picker for inventory items
 */
export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const locations: { value: InventoryLocation; label: string; emoji: string }[] = [
    { value: "pantry", label: "Pantry", emoji: "🏠" },
    { value: "fridge", label: "Fridge", emoji: "❄️" },
    { value: "freezer", label: "Freezer", emoji: "🧊" },
    { value: "other", label: "Other", emoji: "📦" },
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="location" className="flex items-center gap-2">
        <MapPin className="size-4" />
        Storage Location
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as InventoryLocation)}>
        <SelectTrigger id="location">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc.value} value={loc.value}>
              {loc.emoji} {loc.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { getDefaultExpiration, EXPIRATION_PRESETS };
