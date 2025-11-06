// 🧩 Mock external dependencies
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("@/app/signup/actions", () => ({
  signup: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  validatePassword: jest.fn(),
  cn: jest.fn()
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

import { signup } from "@/app/signup/actions";
import SignUp from "@/app/signup/page";
import { useToast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/utils";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

describe("SignUp Page", () => {
  const mockToast = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (validatePassword as jest.Mock).mockReturnValue({ isValid: true });
    (require("next/navigation").useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders all input fields and submit button", () => {
    render(<SignUp />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows validation error if fields are empty", async () => {
    render(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });
  });

  it("shows invalid email format error", async () => {
    render(<SignUp />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "tester" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "invalidemail" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it("shows error if passwords do not match", async () => {
    render(<SignUp />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "user123" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Mismatch123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("calls signup and shows success toast when valid form is submitted", async () => {
    (signup as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<SignUp />);
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "tester" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "tester@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith({
        username: "tester",
        email: "tester@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      });
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Success!",
        description: "Your account has been created. Please sign in.",
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/signin");
  });

  it("shows server error if signup returns an error", async () => {
    (signup as jest.Mock).mockResolvedValueOnce({ error: { message: "An unexpected error occurred" } });

    render(<SignUp />);
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "tester" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "tester@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });
});