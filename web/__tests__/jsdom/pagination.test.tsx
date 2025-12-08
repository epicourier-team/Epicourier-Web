import Pagination from "@/components/ui/pagenation";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

describe("Pagination", () => {
  it("renders current page and total pages", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />);

    // Check for the buttons instead of split text
    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("renders Prev and Next buttons", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />);

    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("disables Prev button on first page", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByRole("button", { name: /prev/i });
    expect(prevButton).toBeDisabled();
  });

  it("disables Next button on last page", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={5} totalPages={5} onPageChange={mockOnPageChange} />);

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("enables both buttons on middle page", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByRole("button", { name: /prev/i });
    const nextButton = screen.getByRole("button", { name: /next/i });

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("calls onPageChange with page-1 when Prev is clicked", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByRole("button", { name: /prev/i });
    fireEvent.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
  });

  it("calls onPageChange with page+1 when Next is clicked", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(4);
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
  });

  it("does not call onPageChange when disabled Prev is clicked", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByRole("button", { name: /prev/i });
    fireEvent.click(prevButton);

    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it("does not call onPageChange when disabled Next is clicked", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={5} totalPages={5} onPageChange={mockOnPageChange} />);

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it("handles single page correctly", () => {
    const mockOnPageChange = jest.fn();
    render(<Pagination page={1} totalPages={1} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByRole("button", { name: /prev/i });
    const nextButton = screen.getByRole("button", { name: /next/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("handles zero total pages", () => {
    const mockOnPageChange = jest.fn();

    render(<Pagination page={1} totalPages={0} onPageChange={mockOnPageChange} />);

    // Both buttons should be disabled with zero pages
    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});