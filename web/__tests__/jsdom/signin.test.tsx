import SignIn from "@/app/signin/page";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("lucide-react", () => ({
  Utensils: () => <svg data-testid="icon" />,
}));

describe("SignIn Page", () => {
  it("renders header and button", () => {
    render(<SignIn />);
    expect(screen.getByText("Epicourier")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("updates input values", () => {
    render(<SignIn />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "pw123" } });
    expect(screen.getByLabelText(/Email/i)).toHaveValue("user@test.com");
    expect(screen.getByLabelText(/Password/i)).toHaveValue("pw123");
  });
});