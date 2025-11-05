// 🧩 Mock external dependencies
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("@/app/signup/actions", () => ({
  signup: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  validatePassword: jest.fn(),
}));

jest.mock("@/lib/utils", () => {
  const actual = jest.requireActual("@/lib/utils");
  return {
    ...actual,
    validatePassword: jest.fn(),
  };
});

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
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

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (validatePassword as jest.Mock).mockReturnValue({ isValid: true });
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
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Validation Error",
          description: expect.stringMatching(/required/i),
          variant: "destructive",
        })
      );
    });

    // Inline validation messages appear
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
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
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Please enter a valid email address",
        })
      );
    });

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
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
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Passwords do not match",
          variant: "destructive",
        })
      );
    });

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
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
        title: "Account created",
        description: "Please sign in with your new account.",
      })
    );
  });

  it("shows failure toast if signup throws an error", async () => {
    (signup as jest.Mock).mockRejectedValueOnce(new Error("Email already exists"));

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
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Signup failed",
          description: "Email already exists",
          variant: "destructive",
        })
      );
    });
  });
});
