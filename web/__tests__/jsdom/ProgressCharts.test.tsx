// web/__tests__/jsdom/ProgressCharts.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressCharts } from '@/components/dashboard/ProgressCharts';

// Mock recharts to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    Legend: () => <div data-testid="legend" />,
}));

describe('ProgressCharts Component', () => {
    const mockStats = {
        weight_trend: [
            { date: '2025-01-01', weight: 75.5 },
            { date: '2025-01-08', weight: 74.8 },
            { date: '2025-01-15', weight: 74.2 }
        ],
        weekly_adherence: [
            { week: '2025-01-01', rate: 85.0, completed: 6 },
            { week: '2025-01-08', rate: 90.0, completed: 7 }
        ],
        meal_type_distribution: [
            { name: 'breakfast', value: 10 },
            { name: 'lunch', value: 12 },
            { name: 'dinner', value: 11 }
        ]
    };

    it('renders all three chart sections', () => {
        render(<ProgressCharts stats={mockStats} />);

        expect(screen.getByText('Weight Progress')).toBeInTheDocument();
        expect(screen.getByText('Meal Types')).toBeInTheDocument();
        expect(screen.getByText('Weekly Consistency')).toBeInTheDocument();
    });

    it('renders weight trend chart when data is available', () => {
        render(<ProgressCharts stats={mockStats} />);

        expect(screen.getByText('Your weight changes over time')).toBeInTheDocument();
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
    });

    it('shows empty state for weight trend when no data', () => {
        const emptyStats = {
            weight_trend: [],
            weekly_adherence: mockStats.weekly_adherence,
            meal_type_distribution: mockStats.meal_type_distribution
        };

        render(<ProgressCharts stats={emptyStats} />);
        expect(screen.getByText('No weight data recorded yet.')).toBeInTheDocument();
    });

    it('renders meal type distribution chart', () => {
        render(<ProgressCharts stats={mockStats} />);

        expect(screen.getByText('Completed meals by type')).toBeInTheDocument();
        expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    });

    it('shows empty state for meal types when no data', () => {
        const emptyStats = {
            weight_trend: mockStats.weight_trend,
            weekly_adherence: mockStats.weekly_adherence,
            meal_type_distribution: []
        };

        render(<ProgressCharts stats={emptyStats} />);
        expect(screen.getByText('No meal data yet.')).toBeInTheDocument();
    });

    it('renders weekly adherence chart', () => {
        render(<ProgressCharts stats={mockStats} />);

        expect(screen.getByText('Meal completion rate per week')).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });

    it('shows empty state for weekly adherence when no data', () => {
        const emptyStats = {
            weight_trend: mockStats.weight_trend,
            weekly_adherence: [],
            meal_type_distribution: mockStats.meal_type_distribution
        };

        render(<ProgressCharts stats={emptyStats} />);
        expect(screen.getByText('No weekly data available.')).toBeInTheDocument();
    });

    it('handles all empty data gracefully', () => {
        const emptyStats = {
            weight_trend: [],
            weekly_adherence: [],
            meal_type_distribution: []
        };

        render(<ProgressCharts stats={emptyStats} />);

        expect(screen.getByText('No weight data recorded yet.')).toBeInTheDocument();
        expect(screen.getByText('No meal data yet.')).toBeInTheDocument();
        expect(screen.getByText('No weekly data available.')).toBeInTheDocument();
    });
});
