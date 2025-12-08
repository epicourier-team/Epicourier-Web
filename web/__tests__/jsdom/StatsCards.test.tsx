// web/__tests__/jsdom/StatsCards.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatsCards } from '@/components/dashboard/StatsCards';

describe('StatsCards Component', () => {
    const mockStats = {
        completion_rate: 85.5,
        total_meals: 20,
        completed_meals: 17,
        avg_green_score: 7.8,
    };

    it('renders all stat cards', () => {
        render(<StatsCards stats={mockStats} />);

        expect(screen.getByText('Completion Rate')).toBeInTheDocument();
        expect(screen.getByText('Current Streak')).toBeInTheDocument();
        expect(screen.getByText('Avg Green Score')).toBeInTheDocument();
        expect(screen.getByText('Total Meals')).toBeInTheDocument();
    });

    it('displays completion rate correctly', () => {
        render(<StatsCards stats={mockStats} />);

        expect(screen.getByText('85.5%')).toBeInTheDocument();
        expect(screen.getByText('17 of 20 meals completed')).toBeInTheDocument();
    });

    it('displays average green score', () => {
        render(<StatsCards stats={mockStats} />);

        expect(screen.getByText('7.8')).toBeInTheDocument();
        expect(screen.getByText('Goal: 8.0+')).toBeInTheDocument();
    });

    it('displays total meals', () => {
        render(<StatsCards stats={mockStats} />);

        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Planned in this period')).toBeInTheDocument();
    });

    it('handles zero values correctly', () => {
        const zeroStats = {
            completion_rate: 0,
            total_meals: 0,
            completed_meals: 0,
            avg_green_score: 0,
        };

        render(<StatsCards stats={zeroStats} />);

        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('0 of 0 meals completed')).toBeInTheDocument();
    });

    it('handles perfect completion rate', () => {
        const perfectStats = {
            completion_rate: 100,
            total_meals: 10,
            completed_meals: 10,
            avg_green_score: 9.5,
        };

        render(<StatsCards stats={perfectStats} />);

        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('10 of 10 meals completed')).toBeInTheDocument();
    });
});
