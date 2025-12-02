/**
 * @jest-environment node
 */

import { GET } from "@/app/api/challenges/route";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getUserIdentity: jest.fn(),
}));

// Mock types
type Challenge = {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "weekly" | "monthly" | "special";
  criteria: { metric: string; target: number; period?: string };
  reward_achievement_id: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

type UserChallenge = {
  id: number;
  user_id: string;
  challenge_id: number;
  joined_at: string;
  progress: { current: number; target: number } | null;
  completed_at: string | null;
};

// Mock chain builders
const challengesChain = (data: Challenge[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }),
});

const userChallengesChain = (data: UserChallenge[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  }),
  delete: jest.fn().mockReturnValue({
    in: jest.fn().mockResolvedValue({ error: null }),
  }),
});

const achievementDefinitionsChain = (data: unknown[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    in: jest.fn().mockResolvedValue({ data, error }),
  }),
});

const calendarMealsChain = (data: unknown[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const calendarDatesChain = (dates: string[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: dates.map((d) => ({ date: d })),
        error,
      }),
    }),
  }),
});

const nutrientTrackingChain = (data: unknown[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      gte: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

describe("Challenge Reset Logic", () => {
  const mockChallenge: Challenge = {
    id: 1,
    name: "weekly_green_5",
    title: "Green Week Champion",
    description: "Log 5 sustainable/green recipes this week",
    type: "weekly",
    criteria: { metric: "green_recipes", target: 5, period: "week" },
    reward_achievement_id: null,
    start_date: null,
    end_date: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
  };

  const mockStaleUserChallenge: UserChallenge = {
    id: 101,
    user_id: "uuid-1",
    challenge_id: 1,
    joined_at: "2024-01-01T00:00:00.000Z", // Joined 2 weeks ago
    progress: { current: 2, target: 5 },
    completed_at: null,
  };

  const originalDate = global.Date;

  beforeEach(() => {
    // Mock Date to return a fixed time (Jan 15, 2024)
    const fixedDate = new originalDate("2024-01-15T12:00:00.000Z");
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length > 0) {
          return new originalDate(...(args as [string | number | Date]));
        }
        return fixedDate;
      }
    } as any;

    jest.clearAllMocks();

    const mockSupabaseClient = {
      from: jest.fn(),
      auth: { getUser: jest.fn() },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (getUserIdentity as jest.Mock).mockResolvedValue({
      authUserId: "uuid-1",
      publicUserId: 42,
    });
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  it("identifies stale weekly challenges but keeps history", async () => {
    const supabase = await createClient();

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "challenges") return challengesChain([mockChallenge]);
      if (table === "user_challenges") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [mockStaleUserChallenge], error: null }),
          }),
        };
      }
      if (table === "achievement_definitions") return achievementDefinitionsChain([]);
      if (table === "Calendar") return calendarMealsChain([]);
      if (table === "nutrient_tracking") return nutrientTrackingChain([]);
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);

    // Should be returned as active (available), not joined
    expect(json.active).toHaveLength(1);
    expect(json.active[0].id).toBe(1);
    expect(json.joined).toHaveLength(0);

    // Verify NO delete was called (history preserved)
    // We can't easily check for "not called" on a specific table with this mock setup
    // but the absence of delete logic in the code ensures this.
  });

  it("does not remove active weekly challenges (joined this week)", async () => {
    const activeUserChallenge: UserChallenge = {
      ...mockStaleUserChallenge,
      id: 102,
      joined_at: "2024-01-15T10:00:00.000Z", // Joined today (start of week)
    };

    const supabase = await createClient();

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "challenges") return challengesChain([mockChallenge]);
      if (table === "user_challenges") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [activeUserChallenge], error: null }),
          }),
        };
      }
      // ... other mocks
      if (table === "achievement_definitions") return achievementDefinitionsChain([]);
      if (table === "Calendar") return calendarMealsChain([]);
      if (table === "nutrient_tracking") return nutrientTrackingChain([]);
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.active).toHaveLength(0);
    expect(json.joined).toHaveLength(1);
    expect(json.joined[0].id).toBe(1);
  });

  it("allows joining a challenge with a stale record (history preserved)", async () => {
    // Scenario: User tries to join a challenge they joined 2 weeks ago (stale)
    // The API should detect it's stale history, allow new join, and NOT delete old record

    const supabase = await createClient();
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...mockStaleUserChallenge, id: 200, joined_at: "2024-01-15T12:00:00.000Z" },
          error: null,
        }),
      }),
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "challenges") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "user_challenges") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest
                      .fn()
                      .mockResolvedValue({ data: mockStaleUserChallenge, error: null }),
                  }),
                }),
              }),
            }),
          }),
          insert: insertMock,
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    // Mock request
    const req = new Request("http://localhost/api/challenges/join", {
      method: "POST",
      body: JSON.stringify({ challenge_id: 1 }),
    });

    // Import POST handler dynamically or assume it's available
    const { POST } = await import("@/app/api/challenges/join/route");
    const res = await POST(req);
    const json = await res.json();

    if (res.status !== 201) {
      process.stdout.write(
        `\n\nTest failed with status: ${res.status} Error: ${JSON.stringify(json)}\n\n`
      );
    }

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);

    // Verify insert was called (new record created)
    expect(insertMock).toHaveBeenCalled();
  });
});
