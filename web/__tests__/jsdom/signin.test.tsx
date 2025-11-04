import { login } from "@/app/signin/actions";
import SignIn from "@/app/signin/page";
import { useToast } from "@/hooks/use-toast";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// 🔧 Mock modules
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("@/app/signin/actions", () => ({
  login: jest.fn(),
}));

describe("SignIn Page", () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it("renders form fields and button", () => {
    render(<SignIn />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation error when both fields are empty", async () => {
    render(<SignIn />);
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Validation Error",
          description: expect.stringMatching(/required/),
          variant: "destructive",
        })
      )
    );

    // Optionally check inline error under inputs
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid email format", async () => {
    render(<SignIn />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "invalidemail" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Please enter a valid email address.",
        })
      )
    );

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it("calls login() and shows success toast on valid credentials", async () => {
    (login as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SignIn />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Signed in",
        description: "Welcome back!",
      })
    );
  });

  it("shows failure toast when login throws error", async () => {
    (login as jest.Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    render(<SignIn />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sign in failed",
          description: "Invalid credentials",
          variant: "destructive",
        })
      )
    );
  });
});