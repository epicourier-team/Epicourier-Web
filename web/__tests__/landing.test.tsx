import { render, screen } from "@testing-library/react";
import AppDemo from "../src/components/landing/AppDemo";
import Features from "../src/components/landing/Features";
import Hero from "../src/components/landing/Hero";

describe("AppDemo Section", () => {
  it("renders heading, highlights, and app image", () => {
    render(<AppDemo />);

    expect(
      screen.getByRole("heading", { name: /your personal nutrition assistant/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/personalized recipe recommendations/i)).toBeInTheDocument();

    expect(screen.getByAltText(/epicourier app interface/i)).toBeInTheDocument();
  });
});

describe("Features Section", () => {
  it("renders all feature cards' svg icons", () => {
    render(<Features />);

    expect(
      screen.getByRole("heading", { name: /Everything You Need to Eat Smarter/i })
    ).toBeInTheDocument();
  });
});

describe("Hero Section", () => {
  it("renders call-to-action link to signup page", () => {
    render(<Hero />);

    const textElement = screen.getByText(/start your smart meal journey/i);
    const link = textElement.closest("a");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/signup");
  });
});
