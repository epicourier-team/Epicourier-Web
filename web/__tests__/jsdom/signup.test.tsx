import SignUp from "@/app/signup/page";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("lucide-react", () => ({
  Utensils: () => <svg data-testid="icon" />,
}));

// Polyfill TextEncoder/TextDecoder for the test environment (Node/jsdom)
import { TextEncoder, TextDecoder } from "util";
if (typeof (global as any).TextEncoder === "undefined") {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof (global as any).TextDecoder === "undefined") {
  (global as any).TextDecoder = TextDecoder;
}


describe("SignUp Page", () => {
  it("renders header and button", () => {
    render(<SignUp />);
    expect(screen.getByText("Epicourier")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });

  it("updates input values", () => {
    render(<SignUp />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "user1" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "user1@test.com" } });
    expect(screen.getByLabelText(/Username/i)).toHaveValue("user1");
    expect(screen.getByLabelText(/Email/i)).toHaveValue("user1@test.com");
  });
});
