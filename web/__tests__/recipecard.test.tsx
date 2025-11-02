import RecipeCard from "@/components/ui/recipecard";
import { Recipe } from "@/types/data";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const mockRecipe: Recipe = {
  id: 1,
  name: "Spaghetti Carbonara",
  description: "A classic Italian pasta dish with eggs, cheese, and pancetta",
  image_url: "https://www.themealdb.com/images/media/meals/carbonara.jpg",
  min_prep_time: 30,
  green_score: 75,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

describe("RecipeCard", () => {
  it("renders recipe name", () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText("Spaghetti Carbonara")).toBeInTheDocument();
  });

  it("renders recipe description", () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(
      screen.getByText(/A classic Italian pasta dish with eggs, cheese, and pancetta/i)
    ).toBeInTheDocument();
  });

  it("renders recipe image when image_url exists", () => {
    render(<RecipeCard recipe={mockRecipe} />);
    const image = screen.getByAltText("Spaghetti Carbonara");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", expect.stringContaining("carbonara.jpg"));
  });

  it("does not render image when image_url is null", () => {
    const recipeWithoutImage = { ...mockRecipe, image_url: null };
    render(<RecipeCard recipe={recipeWithoutImage} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders link to recipe detail page", () => {
    render(<RecipeCard recipe={mockRecipe} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/recipes/1");
  });

  it("handles null recipe name gracefully", () => {
    const recipeWithNullName = { ...mockRecipe, name: null };
    render(<RecipeCard recipe={recipeWithNullName} />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  it("truncates long descriptions with line-clamp", () => {
    const longDescription =
      "A very long description that should be truncated. ".repeat(10);
    const recipeWithLongDesc = { ...mockRecipe, description: longDescription };
    render(<RecipeCard recipe={recipeWithLongDesc} />);

    const description = screen.getByText(longDescription);
    expect(description).toHaveClass("line-clamp-2");
  });

  it("uses alt text 'recipe' when name is null", () => {
    const recipeWithNullName = { ...mockRecipe, name: null };
    render(<RecipeCard recipe={recipeWithNullName} />);
    const image = screen.getByAltText("recipe");
    expect(image).toBeInTheDocument();
  });

  it("applies hover effect classes", () => {
    const { container } = render(<RecipeCard recipe={mockRecipe} />);
    const link = container.querySelector("a");
    expect(link).toHaveClass("transition", "hover:shadow-lg");
  });
});