/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { RecipeRecommendationModal } from "@/components/inventory/RecipeRecommendationModal";
import type { InventoryRecommendResponse } from "@/types/data";

// Mock data
const mockRecommendations: InventoryRecommendResponse = {
  recommendations: [
    {
      recipe_id: 1,
      recipe_name: "Chocolate Gateau",
      match_score: 85,
      ingredients_available: ["Eggs", "Butter", "Sugar", "Flour"],
      ingredients_missing: ["Chocolate"],
      expiring_ingredients_used: ["Eggs"],
      reason: "Uses expiring eggs and most pantry staples you have.",
    },
    {
      recipe_id: 2,
      recipe_name: "Simple Omelette",
      match_score: 95,
      ingredients_available: ["Eggs", "Butter", "Salt"],
      ingredients_missing: [],
      expiring_ingredients_used: ["Eggs", "Butter"],
      reason: "Quick breakfast using your expiring eggs.",
    },
  ],
  shopping_suggestions: ["Chocolate", "Heavy Cream", "Vanilla Extract"],
  overall_reasoning:
    "These recipes prioritize your expiring eggs and butter while making use of your pantry staples.",
};

// Helper function to find and click recipe card
const clickRecipeCard = (recipeName: string) => {
  const recipeButtons = screen.getAllByRole("button");
  const button = recipeButtons.find((btn) => btn.textContent?.includes(recipeName));
  if (button) {
    fireEvent.click(button);
  }
  return button;
};

describe("RecipeRecommendationModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    recommendations: null,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading spinner when isLoading is true", () => {
      render(<RecipeRecommendationModal {...defaultProps} isLoading={true} />);

      expect(screen.getByText(/analyzing your inventory/i)).toBeInTheDocument();
    });

    it("should not display recommendations while loading", () => {
      render(
        <RecipeRecommendationModal
          {...defaultProps}
          isLoading={true}
          recommendations={mockRecommendations}
        />
      );

      expect(screen.queryByText("Chocolate Gateau")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when recommendations is null", () => {
      render(<RecipeRecommendationModal {...defaultProps} />);

      expect(screen.getByText(/no recommendations yet/i)).toBeInTheDocument();
    });
  });

  describe("With Recommendations", () => {
    it("should display overall reasoning", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      expect(screen.getByText(/prioritize your expiring eggs/i)).toBeInTheDocument();
    });

    it("should display all recipe names", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      expect(screen.getByText("Chocolate Gateau")).toBeInTheDocument();
      expect(screen.getByText("Simple Omelette")).toBeInTheDocument();
    });

    it("should display match scores", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      expect(screen.getByText(/85%/)).toBeInTheDocument();
      expect(screen.getByText(/95%/)).toBeInTheDocument();
    });

    it("should display recipe reasons", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      expect(screen.getByText(/uses expiring eggs/i)).toBeInTheDocument();
      expect(screen.getByText(/quick breakfast/i)).toBeInTheDocument();
    });

    it("should display shopping suggestions", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      expect(screen.getByText("Chocolate")).toBeInTheDocument();
      expect(screen.getByText("Heavy Cream")).toBeInTheDocument();
      expect(screen.getByText("Vanilla Extract")).toBeInTheDocument();
    });
  });

  describe("Recipe Card Expansion", () => {
    it("should render expandable recipe cards", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      const chocolateGateauButton = clickRecipeCard("Chocolate Gateau");
      expect(chocolateGateauButton).toBeDefined();
    });

    it("should toggle expansion and show details when clicking recipe card", async () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      await act(async () => {
        clickRecipeCard("Chocolate Gateau");
      });

      await waitFor(() => {
        const youHaveElements = screen.getAllByText(/You Have/i);
        expect(youHaveElements.length).toBeGreaterThan(0);
      });
    });

    it("should show expiring ingredients badge before expansion", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      // The expiring ingredients warning is shown in card header
      expect(screen.getByText(/Uses 1 expiring ingredient/i)).toBeInTheDocument();
    });

    it("should show missing ingredients section when expanded", async () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      await act(async () => {
        clickRecipeCard("Chocolate Gateau");
      });

      await waitFor(() => {
        expect(screen.getByText(/Missing/i)).toBeInTheDocument();
      });
    });

    it("should show View Recipe link when expanded", async () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      await act(async () => {
        clickRecipeCard("Chocolate Gateau");
      });

      await waitFor(() => {
        expect(screen.getByText("View Recipe")).toBeInTheDocument();
      });
    });

    it("should show Add Missing button when expanded with missing ingredients", async () => {
      const onAddToShoppingList = jest.fn();

      render(
        <RecipeRecommendationModal
          {...defaultProps}
          recommendations={mockRecommendations}
          onAddToShoppingList={onAddToShoppingList}
        />
      );

      await act(async () => {
        clickRecipeCard("Chocolate Gateau");
      });

      await waitFor(() => {
        expect(screen.getByText(/Add 1 Missing to List/i)).toBeInTheDocument();
      });
    });

    it("should call onAddToShoppingList when Add Missing button is clicked", async () => {
      const onAddToShoppingList = jest.fn();

      render(
        <RecipeRecommendationModal
          {...defaultProps}
          recommendations={mockRecommendations}
          onAddToShoppingList={onAddToShoppingList}
        />
      );

      await act(async () => {
        clickRecipeCard("Chocolate Gateau");
      });

      await waitFor(() => {
        const addButton = screen.getByText(/Add 1 Missing to List/i);
        fireEvent.click(addButton);
      });

      expect(onAddToShoppingList).toHaveBeenCalledWith(["Chocolate"]);
    });
  });

  describe("Match Score Colors", () => {
    it("should show Great Match for score >= 70", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      const greatBadges = screen.getAllByText(/Great Match/i);
      expect(greatBadges.length).toBeGreaterThan(0);
    });

    it("should show Good Match for score 40-69", () => {
      const goodMatchRecommendations: InventoryRecommendResponse = {
        recommendations: [
          {
            recipe_id: 50,
            recipe_name: "Good Match Recipe",
            match_score: 55,
            ingredients_available: ["Some"],
            ingredients_missing: ["Others"],
            expiring_ingredients_used: [],
            reason: "Decent match.",
          },
        ],
        shopping_suggestions: [],
        overall_reasoning: "Good option.",
      };

      render(
        <RecipeRecommendationModal {...defaultProps} recommendations={goodMatchRecommendations} />
      );

      const goodMatchTexts = screen.getAllByText(/Good Match/i);
      expect(goodMatchTexts.length).toBeGreaterThan(0);
    });

    it("should show Needs Shopping for score < 40", () => {
      const lowScoreRecommendations: InventoryRecommendResponse = {
        recommendations: [
          {
            recipe_id: 3,
            recipe_name: "Complex Dish",
            match_score: 30,
            ingredients_available: ["Salt"],
            ingredients_missing: ["Everything else"],
            expiring_ingredients_used: [],
            reason: "Only salt available",
          },
        ],
        shopping_suggestions: [],
        overall_reasoning: "Limited options",
      };

      render(
        <RecipeRecommendationModal {...defaultProps} recommendations={lowScoreRecommendations} />
      );

      const needsShoppingTexts = screen.getAllByText(/Needs Shopping/i);
      expect(needsShoppingTexts.length).toBeGreaterThan(0);
    });
  });

  describe("Close Button", () => {
    it("should call onClose when close button is clicked", () => {
      const onClose = jest.fn();
      render(
        <RecipeRecommendationModal
          {...defaultProps}
          onClose={onClose}
          recommendations={mockRecommendations}
        />
      );

      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Shopping Suggestions", () => {
    it("should display Add All button", () => {
      const onAddToShoppingList = jest.fn();
      render(
        <RecipeRecommendationModal
          {...defaultProps}
          recommendations={mockRecommendations}
          onAddToShoppingList={onAddToShoppingList}
        />
      );

      expect(screen.getByText("Add All")).toBeInTheDocument();
    });

    it("should call onAddToShoppingList with all suggestions when Add All clicked", () => {
      const onAddToShoppingList = jest.fn();
      render(
        <RecipeRecommendationModal
          {...defaultProps}
          recommendations={mockRecommendations}
          onAddToShoppingList={onAddToShoppingList}
        />
      );

      const addAllButton = screen.getByText("Add All");
      fireEvent.click(addAllButton);

      expect(onAddToShoppingList).toHaveBeenCalledWith([
        "Chocolate",
        "Heavy Cream",
        "Vanilla Extract",
      ]);
    });

    it("should call onAddToShoppingList when individual suggestion clicked", () => {
      const onAddToShoppingList = jest.fn();
      render(
        <RecipeRecommendationModal
          {...defaultProps}
          recommendations={mockRecommendations}
          onAddToShoppingList={onAddToShoppingList}
        />
      );

      const chocolateBadge = screen.getByText("Chocolate");
      fireEvent.click(chocolateBadge);

      expect(onAddToShoppingList).toHaveBeenCalledWith(["Chocolate"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle recipe with no expiring ingredients", async () => {
      const noExpiringRecommendations: InventoryRecommendResponse = {
        recommendations: [
          {
            recipe_id: 10,
            recipe_name: "Pantry Pasta",
            match_score: 70,
            ingredients_available: ["Pasta", "Olive Oil", "Garlic"],
            ingredients_missing: ["Parmesan"],
            expiring_ingredients_used: [],
            reason: "Uses pantry staples.",
          },
        ],
        shopping_suggestions: [],
        overall_reasoning: "Good pantry meal.",
      };

      render(
        <RecipeRecommendationModal {...defaultProps} recommendations={noExpiringRecommendations} />
      );

      // Should NOT show expiring ingredient warning
      expect(screen.queryByText(/expiring ingredient/i)).not.toBeInTheDocument();
    });

    it("should handle recipe with no available ingredients", async () => {
      const noAvailable: InventoryRecommendResponse = {
        recommendations: [
          {
            recipe_id: 30,
            recipe_name: "New Recipe",
            match_score: 20,
            ingredients_available: [],
            ingredients_missing: ["Chicken", "Spices"],
            expiring_ingredients_used: [],
            reason: "Try something new!",
          },
        ],
        shopping_suggestions: [],
        overall_reasoning: "Expand your cooking!",
      };

      render(<RecipeRecommendationModal {...defaultProps} recommendations={noAvailable} />);

      await act(async () => {
        clickRecipeCard("New Recipe");
      });

      await waitFor(() => {
        // Should NOT show "You Have" section when no available ingredients
        expect(screen.queryByText(/You Have \(/i)).not.toBeInTheDocument();
      });
    });

    it("should hide shopping suggestions when empty", () => {
      const noSuggestions: InventoryRecommendResponse = {
        recommendations: [
          {
            recipe_id: 40,
            recipe_name: "Simple Recipe",
            match_score: 90,
            ingredients_available: ["All"],
            ingredients_missing: [],
            expiring_ingredients_used: [],
            reason: "Complete!",
          },
        ],
        shopping_suggestions: [],
        overall_reasoning: "All set!",
      };

      render(<RecipeRecommendationModal {...defaultProps} recommendations={noSuggestions} />);

      expect(screen.queryByText("Shopping Suggestions")).not.toBeInTheDocument();
    });

    it("should handle recipe with no missing ingredients - hide Missing section", async () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      await act(async () => {
        clickRecipeCard("Simple Omelette");
      });

      // Omelette has no missing ingredients
      await waitFor(() => {
        // Should show "You Have" but NOT "Add Missing" button
        expect(screen.queryByText(/Add \d+ Missing to List/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Progress Bar", () => {
    it("should display ingredient coverage text", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      const coverageTexts = screen.getAllByText(/Ingredient coverage/i);
      expect(coverageTexts.length).toBeGreaterThan(0);
    });

    it("should show correct count of available ingredients", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      // Chocolate Gateau: 4 available out of 5 total
      expect(screen.getByText(/4 of 5/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have dialog role", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have proper heading", () => {
      render(<RecipeRecommendationModal {...defaultProps} recommendations={mockRecommendations} />);

      expect(screen.getByText("AI Recipe Recommendations")).toBeInTheDocument();
    });
  });
});
