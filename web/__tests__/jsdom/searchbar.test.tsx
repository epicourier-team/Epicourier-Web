import SearchBar from "@/components/ui/searchbar";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

describe("SearchBar", () => {
  it("renders input and button", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("updates input value on typing", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "pasta" } });

    expect(input.value).toBe("pasta");
  });

  it("calls onSearch when button is clicked", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i);
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "pizza" } });
    fireEvent.click(button);

    expect(mockOnSearch).toHaveBeenCalledWith("pizza");
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it("calls onSearch when Enter key is pressed", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i);

    fireEvent.change(input, { target: { value: "burger" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockOnSearch).toHaveBeenCalledWith("burger");
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it("does not call onSearch when other keys are pressed", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i);

    fireEvent.change(input, { target: { value: "salad" } });
    fireEvent.keyDown(input, { key: "a", code: "KeyA" });

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it("calls onSearch with empty string", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const button = screen.getByRole("button", { name: /search/i });
    fireEvent.click(button);

    expect(mockOnSearch).toHaveBeenCalledWith("");
  });

  it("maintains state across multiple searches", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i) as HTMLInputElement;
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "first" } });
    fireEvent.click(button);

    expect(input.value).toBe("first");

    fireEvent.change(input, { target: { value: "second" } });
    fireEvent.click(button);

    expect(input.value).toBe("second");
    expect(mockOnSearch).toHaveBeenCalledTimes(2);
  });
});
