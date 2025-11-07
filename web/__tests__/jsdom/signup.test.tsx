import { signup } from "@/app/signup/actions";
import SignUp from "@/app/signup/page";
import { useToast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/utils";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

// ---- Mocks ----
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));
jest.mock("@/app/signup/actions", () => ({
  signup: jest.fn(),
}));
jest.mock("@/lib/utils", () => ({
  validatePassword: jest.fn(),
  cn: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("✅ SignUp Component (stable tests)", () => {
  const mockToast = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (validatePassword as jest.Mock).mockReturnValue({ isValid: true });
  });

  const fillValidForm = () => {
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
  };

  // -----------------------------
  it("renders all fields and button", () => {
    render(<SignUp />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows required field errors", async () => {
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
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "bademail" } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "u" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Valid123!" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Valid123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it("shows password mismatch error", async () => {
    render(<SignUp />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "tester" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "e@e.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Abc12345" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Different" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("handles invalid password from validatePassword", async () => {
    (validatePassword as jest.Mock).mockReturnValueOnce({
      isValid: false,
      error: "Weak password",
    });
    render(<SignUp />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/weak password/i)).toBeInTheDocument());
  });

  it("shows error for short password (<8)", async () => {
    render(<SignUp />);
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "u" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@a.com" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument());
  });

  it("sets email field error when signup returns existing email", async () => {
    (signup as jest.Mock).mockResolvedValueOnce({
      error: { message: "email already exists" },
    });
    render(<SignUp />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/email already exists/i)).toBeInTheDocument());
  });

  it("sets password field error when signup returns password issue", async () => {
    (signup as jest.Mock).mockResolvedValueOnce({
      error: { message: "Password too weak" },
    });
    render(<SignUp />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/Password too weak/i)).toBeInTheDocument());
  });

  it("displays generic server error", async () => {
    (signup as jest.Mock).mockResolvedValueOnce({
      error: { message: "Something went wrong" },
    });
    render(<SignUp />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument());
  });

  it("handles signup success (toast + redirect)", async () => {
    (signup as jest.Mock).mockResolvedValueOnce({ success: true });
    render(<SignUp />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/signin");
    });
  });

  it("handles thrown error (catch block)", async () => {
    (signup as jest.Mock).mockRejectedValueOnce(new Error("Network"));
    render(<SignUp />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument()
    );
  });

  it("clears field-specific errors when input changes", async () => {
    render(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await screen.findByText(/username is required/i);
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "newUser" },
    });
    expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
  });
});
