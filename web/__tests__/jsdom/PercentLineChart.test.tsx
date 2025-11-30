/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { PercentLineChart } from "@/app/dashboard/nutrients/components/PercentLineChart";
import type { TrendPoint } from "@/app/dashboard/nutrients/types";

// Mock recharts
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({ tickFormatter }: { tickFormatter?: (v: number) => string }) => {
    const formatted = tickFormatter?.(50);
    return <div data-testid="y-axis" data-formatted={formatted} />;
  },
  CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => (
    <div data-testid="cartesian-grid" data-dasharray={strokeDasharray} />
  ),
  Tooltip: ({
    formatter,
    labelFormatter,
  }: {
    formatter?: (v: number) => string;
    labelFormatter?: (label: string, payload: unknown[]) => string;
  }) => {
    const formattedValue = formatter?.(75);
    const formattedLabel = labelFormatter?.("label", []);
    return <div data-testid="tooltip" data-value={formattedValue} data-label={formattedLabel} />;
  },
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: ({ y, label }: { y: number; label?: { value: string } }) => (
    <div data-testid="reference-line" data-y={y} data-label={label?.value} />
  ),
}));

// Mock lucide-react
jest.mock("lucide-react", () => ({
  Loader2: () => <span data-testid="loader-icon">Loading</span>,
}));

const defaultColors = {
  calories: "#f97316",
  protein: "#3b82f6",
  carbs: "#22c55e",
  fats: "#a855f7",
};

const mockData: TrendPoint[] = [
  { label: "Mon", calories: 80, protein: 90, carbs: 70, fats: 60 },
  { label: "Tue", calories: 95, protein: 85, carbs: 75, fats: 65 },
  { label: "Wed", calories: 100, protein: 100, carbs: 100, fats: 100 },
];

const defaultIcon = <span data-testid="chart-icon">📊</span>;

describe("PercentLineChart", () => {
  describe("Rendering", () => {
    it("renders with title and subtitle", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByText("Test Chart")).toBeInTheDocument();
      expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    });

    it("renders icon", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("chart-icon")).toBeInTheDocument();
    });

    it("renders with data-testid when provided", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          dataTestId="my-chart"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("my-chart")).toBeInTheDocument();
    });

    it("renders action buttons when provided", () => {
      const actions = <button data-testid="action-btn">Export</button>;

      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
          actions={actions}
        />
      );

      expect(screen.getByTestId("action-btn")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading indicator when loading is true", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={[]}
          emptyText="No data"
          colors={defaultColors}
          loading={true}
        />
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.getByText("Loading chart...")).toBeInTheDocument();
    });

    it("does not show loading indicator when loading is false", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
          loading={false}
        />
      );

      expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty text when data is empty array", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={[]}
          emptyText="No data available"
          colors={defaultColors}
        />
      );

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("shows empty text when data is null/undefined-like", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={[]}
          emptyText="Nothing to display"
          colors={defaultColors}
        />
      );

      expect(screen.getByText("Nothing to display")).toBeInTheDocument();
    });
  });

  describe("Chart with Data", () => {
    it("renders chart when data is provided", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("renders all chart components", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
      expect(screen.getByTestId("legend")).toBeInTheDocument();
      expect(screen.getByTestId("reference-line")).toBeInTheDocument();
    });

    it("renders lines for each macro", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("line-calories")).toBeInTheDocument();
      expect(screen.getByTestId("line-protein")).toBeInTheDocument();
      expect(screen.getByTestId("line-carbs")).toBeInTheDocument();
      expect(screen.getByTestId("line-fats")).toBeInTheDocument();
    });

    it("applies correct colors to lines", () => {
      const customColors = {
        calories: "#ff0000",
        protein: "#00ff00",
        carbs: "#0000ff",
        fats: "#ffff00",
      };

      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={customColors}
        />
      );

      expect(screen.getByTestId("line-calories")).toHaveAttribute("data-stroke", "#ff0000");
      expect(screen.getByTestId("line-protein")).toHaveAttribute("data-stroke", "#00ff00");
      expect(screen.getByTestId("line-carbs")).toHaveAttribute("data-stroke", "#0000ff");
      expect(screen.getByTestId("line-fats")).toHaveAttribute("data-stroke", "#ffff00");
    });

    it("renders reference line at 100%", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      const referenceLine = screen.getByTestId("reference-line");
      expect(referenceLine).toHaveAttribute("data-y", "100");
      expect(referenceLine).toHaveAttribute("data-label", "Goal");
    });
  });

  describe("Custom Label Formatter", () => {
    it("uses custom labelFormatter when provided", () => {
      const customFormatter = jest.fn().mockReturnValue("Custom Label");

      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
          labelFormatter={customFormatter}
        />
      );

      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });
  });

  describe("YAxis Formatting", () => {
    it("formats Y-axis values as percentages", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      const yAxis = screen.getByTestId("y-axis");
      expect(yAxis).toHaveAttribute("data-formatted", "50%");
    });
  });

  describe("Default Props", () => {
    it("defaults loading to false", () => {
      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={mockData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      // Chart should be visible, not loading
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles single data point", () => {
      const singlePoint: TrendPoint[] = [
        { label: "Today", calories: 75, protein: 80, carbs: 85, fats: 90 },
      ];

      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={singlePoint}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("handles zero values in data", () => {
      const zeroData: TrendPoint[] = [{ label: "Mon", calories: 0, protein: 0, carbs: 0, fats: 0 }];

      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={zeroData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("handles large data values", () => {
      const largeData: TrendPoint[] = [
        { label: "Mon", calories: 200, protein: 150, carbs: 180, fats: 220 },
      ];

      render(
        <PercentLineChart
          title="Test Chart"
          subtitle="Test Subtitle"
          icon={defaultIcon}
          data={largeData}
          emptyText="No data"
          colors={defaultColors}
        />
      );

      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });
  });
});
