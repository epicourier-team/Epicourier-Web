/**
 * @jest-environment node
 */

import { GET } from "@/app/api/shopping-list/route";
import { createClient } from "@/utils/supabase/server";

// Mock Supabase
jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

// Mocks
const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
        auth: { getUser: mockAuthGetUser },
        from: mockFrom,
    });

    // Default: Valid User
    mockAuthGetUser.mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
    });
});

describe("GET /api/shopping-list", () => {

    // --- Authentication ---
    it("returns 401 if unauthorized (no session)", async () => {
        mockAuthGetUser.mockResolvedValue({ data: { user: null } });
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("returns 404 if user profile missing in public table", async () => {
        (mockFrom as jest.Mock).mockImplementation((table) => {
            if (table === "User") return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: "Not found" } }) }) }) };
            return { select: jest.fn() };
        });

        const res = await GET();
        expect(res.status).toBe(404);
    });


    // --- Success Scenarios ---
    it("Calculates missing items correctly (Standard Flow)", async () => {
        // Setup Mocks
        setupSuccessMocks({
            calendarEvents: [{ recipe_id: 100 }, { recipe_id: 101 }],
            recipeIngredients: [
                { ingredient_id: 1, Ingredient: { name: "Rice" } },
                { ingredient_id: 2, Ingredient: { name: "Chicken" } },
                { ingredient_id: 3, Ingredient: { name: "Salt" } }
            ],
            pantryItems: [
                { id: 1, name: "Salt", quantity: "1kg" },
                { id: 2, name: "Pepper", quantity: "10g" }
            ]
        });

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(200);
        // Expect Rice and Chicken. Salt is in pantry.
        expect(json.missing_items).toHaveLength(2);

        const names = json.missing_items.map((i: any) => i.name.toLowerCase());
        expect(names).toContain("rice");
        expect(names).toContain("chicken");
        expect(names).not.toContain("salt");
    });

    it("Handles Duplicate Ingredients (Grouping)", async () => {
        // Two meals both needing "Onion"
        setupSuccessMocks({
            calendarEvents: [{ recipe_id: 1 }, { recipe_id: 2 }],
            recipeIngredients: [
                { ingredient_id: 1, Ingredient: { name: "Onion" } },
                { ingredient_id: 1, Ingredient: { name: "Onion" } } // Duplicate in query result
            ],
            pantryItems: [] // Empty pantry
        });

        const res = await GET();
        const json = await res.json();

        expect(json.missing_items).toHaveLength(1);
        expect(json.missing_items[0].name).toMatch(/onion/i);
        expect(json.missing_items[0].count).toBe(2);
    });

    it("Handles Empty Calendar (No Meals)", async () => {
        setupSuccessMocks({
            calendarEvents: [],
            recipeIngredients: [],
            pantryItems: []
        });

        const res = await GET();
        const json = await res.json();

        expect(json.missing_items).toEqual([]);
        expect(json.message).toMatch(/No meals planned/i);
    });

    it("Handles Fully Stocked Pantry (No Missing Items)", async () => {
        setupSuccessMocks({
            calendarEvents: [{ recipe_id: 1 }],
            recipeIngredients: [{ ingredient_id: 1, Ingredient: { name: "Garlic" } }],
            pantryItems: [{ id: 1, name: "Garlic", quantity: "5 bulbs" }]
        });

        const res = await GET();
        const json = await res.json();

        // Response should be successful but empty list
        expect(res.status).toBe(200);
        expect(json.missing_items).toEqual([]);
    });

    // --- Error Handling ---
    it("returns 500 if Calendar DB Fetch Fails", async () => {
        (mockFrom as jest.Mock).mockImplementation((table) => {
            if (table === "User") return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) }) };
            if (table === "Calendar") return { select: () => ({ eq: () => ({ gte: () => ({ lte: async () => ({ data: null, error: { message: "Calendar Connection Fail" } }) }) }) }) };
            return { select: jest.fn() };
        });

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.error).toBe("Calendar Connection Fail");
    });

    it("returns 500 if Pantry DB Fetch Fails", async () => {
        // Calendar succeeds, but Pantry fails
        (mockFrom as jest.Mock).mockImplementation((table) => {
            if (table === "User") return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 1 } }) }) }) };
            if (table === "Calendar") return { select: () => ({ eq: () => ({ gte: () => ({ lte: async () => ({ data: [{ recipe_id: 1 }] }) }) }) }) };
            if (table === "Recipe_Ingredient_Map") return { select: () => ({ in: async () => ({ data: [{ Ingredient: { name: "Egg" } }] }) }) };

            // Pantry fail
            if (table === "PantryItem") return { select: () => ({ eq: async () => ({ data: null, error: { message: "Pantry Fail" } }) }) };

            return { select: jest.fn() };
        });

        const res = await GET();
        const json = await res.json();
        expect(res.status).toBe(500);
        expect(json.error).toContain("Pantry Fail");
    });
});


// Helper to setup complex mock chain
function setupSuccessMocks({ calendarEvents, recipeIngredients, pantryItems }: any) {
    (mockFrom as jest.Mock).mockImplementation((table: string) => {
        if (table === "User") {
            return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) }) };
        }
        if (table === "Calendar") {
            return { select: () => ({ eq: () => ({ gte: () => ({ lte: async () => ({ data: calendarEvents, error: null }) }) }) }) };
        }
        if (table === "Recipe_Ingredient_Map") {
            return { select: () => ({ in: async () => ({ data: recipeIngredients, error: null }) }) };
        }
        if (table === "PantryItem") {
            return { select: () => ({ eq: async () => ({ data: pantryItems, error: null }) }) };
        }
        return { select: jest.fn() };
    });
}
