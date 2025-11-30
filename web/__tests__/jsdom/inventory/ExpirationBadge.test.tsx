import { render, screen } from "@testing-library/react";
import ExpirationBadge from "@/components/inventory/ExpirationBadge";

describe("ExpirationBadge", () => {
  describe("status rendering", () => {
    it("displays 'Expired' for expired status", () => {
      render(<ExpirationBadge status="expired" daysUntil={-5} />);
      expect(screen.getByText("Expired")).toBeInTheDocument();
      expect(screen.getByText("🚨")).toBeInTheDocument();
    });

    it("displays 'Today' for critical status with 0 days", () => {
      render(<ExpirationBadge status="critical" daysUntil={0} />);
      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("displays 'Tomorrow' for critical status with 1 day", () => {
      render(<ExpirationBadge status="critical" daysUntil={1} />);
      expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    });

    it("displays days count for critical status with 2 days", () => {
      render(<ExpirationBadge status="critical" daysUntil={2} />);
      expect(screen.getByText("2 days")).toBeInTheDocument();
    });

    it("displays days count for warning status", () => {
      render(<ExpirationBadge status="warning" daysUntil={5} />);
      expect(screen.getByText("5 days")).toBeInTheDocument();
      expect(screen.getByText("⏰")).toBeInTheDocument();
    });

    it("displays days count for good status", () => {
      render(<ExpirationBadge status="good" daysUntil={14} />);
      expect(screen.getByText("14 days")).toBeInTheDocument();
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("displays 'Good' when good status has null daysUntil", () => {
      render(<ExpirationBadge status="good" daysUntil={null} />);
      expect(screen.getByText("Good")).toBeInTheDocument();
    });

    it("displays 'No date' for unknown status", () => {
      render(<ExpirationBadge status="unknown" daysUntil={null} />);
      expect(screen.getByText("No date")).toBeInTheDocument();
      expect(screen.getByText("–")).toBeInTheDocument();
    });
  });

  describe("showText prop", () => {
    it("shows text by default", () => {
      render(<ExpirationBadge status="expired" daysUntil={-1} />);
      expect(screen.getByText("Expired")).toBeInTheDocument();
    });

    it("hides text when showText is false", () => {
      render(<ExpirationBadge status="expired" daysUntil={-1} showText={false} />);
      expect(screen.queryByText("Expired")).not.toBeInTheDocument();
      // Emoji should still be visible
      expect(screen.getByText("🚨")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies expired styling (red)", () => {
      const { container } = render(<ExpirationBadge status="expired" daysUntil={-1} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-red-100");
      expect(badge.className).toContain("border-red-300");
      expect(badge.className).toContain("text-red-700");
    });

    it("applies critical styling (orange)", () => {
      const { container } = render(<ExpirationBadge status="critical" daysUntil={1} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-orange-100");
      expect(badge.className).toContain("border-orange-300");
      expect(badge.className).toContain("text-orange-700");
    });

    it("applies warning styling (yellow)", () => {
      const { container } = render(<ExpirationBadge status="warning" daysUntil={5} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-yellow-100");
      expect(badge.className).toContain("border-yellow-300");
      expect(badge.className).toContain("text-yellow-700");
    });

    it("applies good styling (green)", () => {
      const { container } = render(<ExpirationBadge status="good" daysUntil={14} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-green-100");
      expect(badge.className).toContain("border-green-300");
      expect(badge.className).toContain("text-green-700");
    });

    it("applies unknown styling (gray)", () => {
      const { container } = render(<ExpirationBadge status="unknown" daysUntil={null} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-gray-100");
      expect(badge.className).toContain("border-gray-300");
      expect(badge.className).toContain("text-gray-600");
    });

    it("applies custom className", () => {
      const { container } = render(
        <ExpirationBadge status="good" daysUntil={10} className="custom-class" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("custom-class");
    });

    it("has base badge styling", () => {
      const { container } = render(<ExpirationBadge status="good" daysUntil={10} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("inline-flex");
      expect(badge.className).toContain("items-center");
      expect(badge.className).toContain("rounded-md");
      expect(badge.className).toContain("border");
      expect(badge.className).toContain("text-xs");
      expect(badge.className).toContain("font-semibold");
    });
  });
});
