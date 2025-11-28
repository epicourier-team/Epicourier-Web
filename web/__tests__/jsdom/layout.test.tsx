"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

  it("renders the home link", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText("EpiCourier")).toBeInTheDocument();
  });

  it("renders the user dropdown trigger", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    // User button should be present as dropdown trigger
    expect(screen.getByText("User")).toBeInTheDocument();
    const userButton = screen.getByText("User").closest("button");
    expect(userButton).toBeInTheDocument();
  });

  it("renders the SidebarTrigger", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    // Check for sidebar trigger button
    const trigger = screen.getAllByRole("button")[0]; // First button is the trigger
    expect(trigger).toBeInTheDocument();
  });

  it("renders the children content", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("logout function is available in layout", async () => {
    (logout as jest.Mock).mockResolvedValue({ success: true });
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Just verify the component renders and logout mock is set up
    expect(logout).toBeDefined();
    expect(mockPush).toBeDefined();
  });
  it("router is configured for navigation", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Verify router mock is properly set up
    expect(useRouter).toHaveBeenCalled();
    expect(mockPush).toBeDefined();
  });
  it("toast is configured for notifications", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Verify toast mock is properly set up
    expect(useToast).toHaveBeenCalled();
    expect(mockToast).toBeDefined();
  });

  describe("handleLogout callback", () => {
    it("redirects to signin on successful logout", async () => {
      const user = userEvent.setup();
      (logout as jest.Mock).mockResolvedValue({ success: true });

      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Find and click the User button to open dropdown
      const userButtons = screen.getAllByText("User");
      await user.click(userButtons[0]);

      // Wait for dropdown to open and click Log Out
      const logoutButton = await screen.findByText("Log Out");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(logout).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/signin");
      });
    });

    it("shows error toast on logout failure", async () => {
      const user = userEvent.setup();
      (logout as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: "Logout failed" },
      });

      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Find and click the User button to open dropdown
      const userButtons = screen.getAllByText("User");
      await user.click(userButtons[0]);

      // Wait for dropdown to open and click Log Out
      const logoutButton = await screen.findByText("Log Out");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(logout).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Logout failed",
          description: "Logout failed",
          variant: "destructive",
        });
      });
    });

    it("does nothing when logout returns no success and no error", async () => {
      const user = userEvent.setup();
      (logout as jest.Mock).mockResolvedValue({ success: false });

      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Find and click the User button to open dropdown
      const userButtons = screen.getAllByText("User");
      await user.click(userButtons[0]);

      // Wait for dropdown to open and click Log Out
      const logoutButton = await screen.findByText("Log Out");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(logout).toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockToast).not.toHaveBeenCalled();
      });
    });
  });
});
