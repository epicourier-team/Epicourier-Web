/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ShoppingListPage from "@/app/dashboard/shopping-list/page";

describe("ShoppingListPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    it("renders missing items and counts correctly from API data", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                missing_items: [
                    { name: "Rice", count: 1, uber_eats_link: "http://uber" },
                    { name: "Chicken", count: 2, uber_eats_link: "http://uber" }
                ],
                meta: { planned_meals_count: 5, date_range: {} }
            })
        });

        render(<ShoppingListPage />);

        await waitFor(() => screen.getByText("Smart Shopping List"));

        expect(screen.getByText("Rice")).toBeInTheDocument();
        expect(screen.getByText("Chicken")).toBeInTheDocument();
        expect(screen.getByText("1x")).toBeInTheDocument();
        expect(screen.getByText("2x")).toBeInTheDocument();
    });

    it("Handles special characters in link encoding", async () => {
        // Test that the frontend renders the link provided by backend
        // (Backend logic ensures URL encoding, Frontend just consumes it)
        const messyLink = "https://www.ubereats.com/search?q=Ben%20%26%20Jerry's";

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                missing_items: [
                    { name: "Ben & Jerry's", count: 1, uber_eats_link: messyLink }
                ],
                meta: { planned_meals_count: 1, date_range: {} }
            })
        });

        render(<ShoppingListPage />);
        await waitFor(() => screen.getByText("Smart Shopping List"));

        const linkButton = screen.getByRole("link", { name: /Order on Uber Eats/i });
        expect(linkButton).toHaveAttribute("href", messyLink);
    });

    it("Displays Empty State when no items missing", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                missing_items: [],
                meta: { planned_meals_count: 5, date_range: {} }
            })
        });

        render(<ShoppingListPage />);

        await waitFor(() => {
            expect(screen.getByText("You're All Set!")).toBeInTheDocument();
        });
    });

    it("Displays Error Message on API Failure", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            json: async () => ({ error: "Server Down" })
        });

        render(<ShoppingListPage />);

        await waitFor(() => {
            expect(screen.getByText("Failed to fetch shopping list")).toBeInTheDocument();
        });
    });

    it("Handles Malformed API Response gracefully", async () => {
        // Should catch fetch error
        (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Error"));

        render(<ShoppingListPage />);

        await waitFor(() => {
            expect(screen.getByText("Network Error")).toBeInTheDocument();
        });
    });
});
