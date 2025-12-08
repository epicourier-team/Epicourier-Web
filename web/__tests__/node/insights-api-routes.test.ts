// web/__tests__/node/insights-api-routes.test.ts
/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getStats } from '@/app/api/insights/stats/route';
import { GET as getAIAnalysis } from '@/app/api/insights/ai-analysis/route';
import { POST as postMetrics } from '@/app/api/insights/metrics/route';

// Mock global fetch
global.fetch = jest.fn();

describe('API Routes - /api/insights/stats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.BACKEND_URL = 'http://localhost:8000';
    });

    it('returns 400 when user_id is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/insights/stats');
        const response = await getStats(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('user_id is required');
    });

    it('successfully fetches stats from backend', async () => {
        const mockBackendResponse = {
            completion_rate: 85.0,
            total_meals: 20,
            completed_meals: 17,
            avg_green_score: 7.8,
            weight_trend: [],
            meal_type_distribution: [],
            weekly_adherence: []
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockBackendResponse
        });

        const request = new NextRequest('http://localhost:3000/api/insights/stats?user_id=test-uuid&period=30d');
        const response = await getStats(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockBackendResponse);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/insights/stats?'),
            expect.any(Object)
        );
    });

    it('handles backend error gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error'
        });

        const request = new NextRequest('http://localhost:3000/api/insights/stats?user_id=test-uuid');
        const response = await getStats(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch stats');
    });

    it('properly encodes query parameters', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({})
        });

        const request = new NextRequest('http://localhost:3000/api/insights/stats?user_id=test%20uuid&period=7d');
        await getStats(request);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('user_id=test+uuid'),
            expect.any(Object)
        );
    });
});

describe('API Routes - /api/insights/ai-analysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.BACKEND_URL = 'http://localhost:8000';
    });

    it('returns 400 when user_id is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/insights/ai-analysis');
        const response = await getAIAnalysis(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('user_id is required');
    });

    it('successfully fetches AI analysis from backend', async () => {
        const mockAIResponse = {
            summary: 'Great progress!',
            recommendations: ['Eat more protein'],
            achievements: ['Completed 17 meals'],
            areas_for_improvement: ['Increase water intake']
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockAIResponse
        });

        const request = new NextRequest('http://localhost:3000/api/insights/ai-analysis?user_id=test-uuid');
        const response = await getAIAnalysis(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockAIResponse);
    });

    it('handles fetch errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const request = new NextRequest('http://localhost:3000/api/insights/ai-analysis?user_id=test-uuid');
        const response = await getAIAnalysis(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
    });
});

describe('API Routes - /api/insights/metrics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.BACKEND_URL = 'http://localhost:8000';
    });

    it('successfully posts metrics to backend', async () => {
        const mockResponse = {
            message: 'Metrics logged successfully',
            data: [{ id: 1 }]
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const request = new NextRequest('http://localhost:3000/api/insights/metrics', {
            method: 'POST',
            body: JSON.stringify({
                user_id: 'test-uuid',
                weight_kg: 75.5,
                height_cm: 175.0
            })
        });

        const response = await postMetrics(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8000/insights/metrics',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
        );
    });

    it('handles backend error when posting metrics', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: async () => 'User not found'
        });

        const request = new NextRequest('http://localhost:3000/api/insights/metrics', {
            method: 'POST',
            body: JSON.stringify({
                user_id: 'invalid-uuid',
                weight_kg: 75.5
            })
        });

        const response = await postMetrics(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Failed to log metrics');
    });

    it('handles network errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

        const request = new NextRequest('http://localhost:3000/api/insights/metrics', {
            method: 'POST',
            body: JSON.stringify({
                user_id: 'test-uuid',
                weight_kg: 75.5
            })
        });

        const response = await postMetrics(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
    });
});
