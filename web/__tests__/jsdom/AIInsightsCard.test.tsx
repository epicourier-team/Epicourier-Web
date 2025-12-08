// web/__tests__/jsdom/AIInsightsCard.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';

describe('AIInsightsCard Component', () => {
    const mockInsights = {
        summary: "You're making excellent progress on your wellness journey!",
        recommendations: [
            "Increase protein intake to 1.6g per kg",
            "Add 30 minutes of cardio daily",
            "Track water intake consistently"
        ],
        achievements: [
            "Completed 85% of planned meals",
            "Maintained consistent meal timing"
        ],
        areas_for_improvement: [
            "Increase vegetable variety",
            "Reduce late-night snacking"
        ]
    };

    it('renders loading state correctly', () => {
        render(<AIInsightsCard insights={null} loading={true} />);

        expect(screen.getByText('AI Coach')).toBeInTheDocument();
        expect(screen.getByText('Analyzing your progress...')).toBeInTheDocument();
    });

    it('renders null when not loading and no insights', () => {
        const { container } = render(<AIInsightsCard insights={null} loading={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('displays AI insights summary', () => {
        render(<AIInsightsCard insights={mockInsights} loading={false} />);

        expect(screen.getByText("You're making excellent progress on your wellness journey!")).toBeInTheDocument();
    });

    it('displays all recommendations', () => {
        render(<AIInsightsCard insights={mockInsights} loading={false} />);

        expect(screen.getByText('Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Increase protein intake to 1.6g per kg')).toBeInTheDocument();
        expect(screen.getByText('Add 30 minutes of cardio daily')).toBeInTheDocument();
        expect(screen.getByText('Track water intake consistently')).toBeInTheDocument();
    });

    it('displays all achievements', () => {
        render(<AIInsightsCard insights={mockInsights} loading={false} />);

        expect(screen.getByText('Achievements')).toBeInTheDocument();
        expect(screen.getByText('Completed 85% of planned meals')).toBeInTheDocument();
        expect(screen.getByText('Maintained consistent meal timing')).toBeInTheDocument();
    });

    it('displays growth opportunities', () => {
        render(<AIInsightsCard insights={mockInsights} loading={false} />);

        expect(screen.getByText('Growth Opportunities')).toBeInTheDocument();
        expect(screen.getByText('Increase vegetable variety')).toBeInTheDocument();
        expect(screen.getByText('Reduce late-night snacking')).toBeInTheDocument();
    });

    it('handles empty arrays gracefully', () => {
        const emptyInsights = {
            summary: "Keep going!",
            recommendations: [],
            achievements: [],
            areas_for_improvement: []
        };

        render(<AIInsightsCard insights={emptyInsights} loading={false} />);

        expect(screen.getByText('Keep going!')).toBeInTheDocument();
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    it('renders with correct CSS classes for styling', () => {
        const { container } = render(<AIInsightsCard insights={mockInsights} loading={false} />);

        const card = container.querySelector('.border-purple-200');
        expect(card).toBeInTheDocument();
    });
});
