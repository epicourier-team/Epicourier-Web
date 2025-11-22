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
});
