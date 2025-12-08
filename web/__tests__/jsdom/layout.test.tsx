"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/app/dashboard/action";

// Mock modules
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));
jest.mock("@/app/dashboard/action", () => ({
  logout: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("DashboardLayout", () => {
  const mockPush = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it("renders the sidebar", () => {
    const { container } = render(<DashboardLayout children={<div>Content</div>} />);
    // Check that the sidebar with sticky class exists
    const sidebar = container.querySelector('.sticky');
    expect(sidebar).toBeInTheDocument();
  });

  it("renders the Log Out button", () => {
    render(<DashboardLayout children={<div>Content</div>} />);
    expect(screen.getByText("Log Out")).toBeInTheDocument();
  });

  it("renders the sidebar navigation", () => {
    render(<DashboardLayout children={<div>Content</div>} />);
    // Check for navigation links instead
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Pantry")).toBeInTheDocument();
  });

  it("renders the children content", () => {
    render(<DashboardLayout children={<div>Content</div>} />);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls logout when Log Out button is clicked", async () => {
    (logout as jest.Mock).mockResolvedValue({ success: true });
    render(<DashboardLayout children={<div>Content</div>} />);
    fireEvent.click(screen.getByText("Log Out"));
    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
  });

  it("redirects to /signin on successful logout", async () => {
    (logout as jest.Mock).mockResolvedValue({ success: true });
    render(<DashboardLayout children={<div>Content</div>} />);
    fireEvent.click(screen.getByText("Log Out"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/signin");
    });
  });

  it("shows error toast on failed logout", async () => {
    (logout as jest.Mock).mockResolvedValue({ error: { message: "Logout error" } });
    render(<DashboardLayout children={<div>Content</div>} />);
    fireEvent.click(screen.getByText("Log Out"));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Logout failed",
          description: "Logout error",
          variant: "destructive",
        })
      );
    });
  });
});