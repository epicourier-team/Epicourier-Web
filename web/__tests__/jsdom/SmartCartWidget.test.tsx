/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SmartCartWidget } from "@/components/ui/SmartCartWidget";
import type { SmartCartWidgetData } from "@/types/data";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("SmartCartWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton initially", () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<SmartCartWidget />);

      // Loading skeleton should be visible
      const skeleton = screen.getByTestId("smart-cart-skeleton");
      expect(skeleton).toBeInTheDocument();
    });

    it("should display title while loading", () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<SmartCartWidget title="My Cart" />);

      expect(screen.getByText("My Cart")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message on fetch failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should display generic error for non-Error objects", async () => {
      mockFetch.mockRejectedValue("string error");

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
      });
    });
  });

  describe("Unauthorized State", () => {
    it("should show login prompt when API returns 401", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Log in to see your Smart Cart!")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no data exists", async () => {
      const emptyData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 0,
          expired: 0,
          low_stock: 0,
        },
        suggested_action: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Nothing to show yet")).toBeInTheDocument();
        expect(screen.getByText("Create a shopping list")).toBeInTheDocument();
        expect(screen.getByText("Add inventory items")).toBeInTheDocument();
      });
    });
  });

  describe("Active Shopping List Summary", () => {
    const mockDataWithList: SmartCartWidgetData = {
      active_list: {
        id: "list-1",
        name: "Weekly Groceries",
        item_count: 15,
        checked_count: 8,
        next_items: ["milk", "eggs", "bread"],
      },
      inventory_alerts: {
        expiring_soon: 0,
        expired: 0,
        low_stock: 0,
      },
      suggested_action: null,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDataWithList),
      });
    });

    it("should display shopping list name", async () => {
      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Weekly Groceries")).toBeInTheDocument();
      });
    });

    it("should display item count and progress", async () => {
      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("8/15 items")).toBeInTheDocument();
        expect(screen.getByText("53%")).toBeInTheDocument(); // Math.round(8/15 * 100)
      });
    });

    it("should display progress bar with correct percentage", async () => {
      render(<SmartCartWidget />);

      await waitFor(() => {
        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow", "53");
      });
    });

    it("should display next items", async () => {
      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Next: milk, eggs, bread")).toBeInTheDocument();
      });
    });

    it("should have link to open the list", async () => {
      render(<SmartCartWidget />);

      await waitFor(() => {
        const link = screen.getByText("Open List");
        expect(link.closest("a")).toHaveAttribute("href", "/dashboard/shopping/list-1");
      });
    });

    it("should show complete badge when all items checked", async () => {
      const completedList: SmartCartWidgetData = {
        ...mockDataWithList,
        active_list: {
          ...mockDataWithList.active_list!,
          checked_count: 15,
          next_items: [],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(completedList),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Complete")).toBeInTheDocument();
      });
    });
  });

  describe("Inventory Alerts", () => {
    it("should display expiring items count", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 3,
          expired: 0,
          low_stock: 0,
        },
        suggested_action: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("⚠️ 3 expiring")).toBeInTheDocument();
      });
    });

    it("should display expired items count", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 0,
          expired: 2,
          low_stock: 0,
        },
        suggested_action: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("2 expired")).toBeInTheDocument();
      });
    });

    it("should display low stock count", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 0,
          expired: 0,
          low_stock: 5,
        },
        suggested_action: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("📉 5 low stock")).toBeInTheDocument();
      });
    });

    it("should display all alerts when multiple exist", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 3,
          expired: 1,
          low_stock: 2,
        },
        suggested_action: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("⚠️ 3 expiring")).toBeInTheDocument();
        expect(screen.getByText("1 expired")).toBeInTheDocument();
        expect(screen.getByText("📉 2 low stock")).toBeInTheDocument();
      });
    });

    it("should show positive message when no alerts", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: {
          id: "list-1",
          name: "Test List",
          item_count: 1,
          checked_count: 0,
          next_items: ["item"],
        },
        inventory_alerts: {
          expiring_soon: 0,
          expired: 0,
          low_stock: 0,
        },
        suggested_action: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Inventory looking good!")).toBeInTheDocument();
      });
    });

    it("should have link to view inventory", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 1,
          expired: 0,
          low_stock: 0,
        },
        suggested_action: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        const link = screen.getByText("View Inventory");
        expect(link.closest("a")).toHaveAttribute("href", "/dashboard/inventory");
      });
    });
  });

  describe("Suggested Actions", () => {
    it("should display use expiring action", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 1,
          expired: 0,
          low_stock: 0,
        },
        suggested_action: {
          type: "use_expiring",
          title: "Use chicken today",
          description: "This item is expiring soon. Find recipes to use it!",
          action_label: "Find Recipes",
          action_href: "/dashboard/recipes",
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Use chicken today")).toBeInTheDocument();
        expect(screen.getByText("This item is expiring soon. Find recipes to use it!")).toBeInTheDocument();
        expect(screen.getByText("Find Recipes")).toBeInTheDocument();
      });
    });

    it("should display complete shopping action", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: {
          id: "list-1",
          name: "Weekly List",
          item_count: 10,
          checked_count: 8,
          next_items: ["item1", "item2"],
        },
        inventory_alerts: {
          expiring_soon: 0,
          expired: 0,
          low_stock: 0,
        },
        suggested_action: {
          type: "complete_shopping",
          title: "Almost done! 2 items left",
          description: "You're 80% through your shopping list.",
          action_label: "Complete List",
          action_href: "/dashboard/shopping/list-1",
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Almost done! 2 items left")).toBeInTheDocument();
        expect(screen.getByText("You're 80% through your shopping list.")).toBeInTheDocument();
        expect(screen.getByText("Complete List")).toBeInTheDocument();
      });
    });

    it("should display restock action", async () => {
      const mockData: SmartCartWidgetData = {
        active_list: null,
        inventory_alerts: {
          expiring_soon: 0,
          expired: 0,
          low_stock: 3,
        },
        suggested_action: {
          type: "restock",
          title: "3 items running low",
          description: "Add these to your shopping list.",
          action_label: "View Inventory",
          action_href: "/dashboard/inventory",
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("3 items running low")).toBeInTheDocument();
        expect(screen.getByText("Add these to your shopping list.")).toBeInTheDocument();
      });
    });
  });

  describe("Custom Props", () => {
    it("should display default title", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          active_list: null,
          inventory_alerts: { expiring_soon: 1, expired: 0, low_stock: 0 },
          suggested_action: null,
        }),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(screen.getByText("Smart Cart")).toBeInTheDocument();
      });
    });

    it("should display custom title when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          active_list: null,
          inventory_alerts: { expiring_soon: 1, expired: 0, low_stock: 0 },
          suggested_action: null,
        }),
      });

      render(<SmartCartWidget title="My Shopping" />);

      await waitFor(() => {
        expect(screen.getByText("My Shopping")).toBeInTheDocument();
      });
    });

    it("should apply custom className", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          active_list: null,
          inventory_alerts: { expiring_soon: 1, expired: 0, low_stock: 0 },
          suggested_action: null,
        }),
      });

      const { container } = render(<SmartCartWidget className="my-custom-class" />);

      await waitFor(() => {
        expect(container.firstChild).toHaveClass("my-custom-class");
      });
    });
  });

  describe("API Call", () => {
    it("should call /api/smart-cart-widget endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          active_list: null,
          inventory_alerts: { expiring_soon: 0, expired: 0, low_stock: 0 },
          suggested_action: null,
        }),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/smart-cart-widget");
      });
    });

    it("should only call API once on mount", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          active_list: null,
          inventory_alerts: { expiring_soon: 0, expired: 0, low_stock: 0 },
          suggested_action: null,
        }),
      });

      render(<SmartCartWidget />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
