
export interface PantryItem {
    id: number;
    name: string;
    quantity: string | null;
}

export interface MissingItem {
    name: string;
    count: number;
    uber_eats_link: string;
}

export function normalize(text: string): string {
    // Replace punctuation with space to handle "Chicken-Breast" -> "Chicken Breast"
    // Then collapse multiple spaces to single space
    return text.toLowerCase()
        .replace(/[^\w\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function isIngredientInPantry(requiredName: string, pantryItems: PantryItem[]): boolean {
    const reqNorm = normalize(requiredName);

    // Tokenize required item (e.g., "diced tomatoes" -> ["diced", "tomatoes"])
    const reqTokens = reqNorm.split(/\s+/).filter(t => t.length > 2); // Ignore short words like "of", "in"

    return pantryItems.some(pitem => {
        const pantryNorm = normalize(pitem.name);

        // Check 1: Direct Inclusion (Robust)
        // Example: Have "Rice", need "Basmati Rice" -> match
        // Example: Have "Basmati Rice", need "Rice" -> match
        if (pantryNorm.includes(reqNorm) || reqNorm.includes(pantryNorm)) {
            return true;
        }

        return false;
    });
}
