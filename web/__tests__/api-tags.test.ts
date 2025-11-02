import { GET } from "@/app/api/tags/route";
import { supabase } from "@/lib/supabaseClient";

jest.mock("@/lib/supabaseClient");

describe("GET /api/tags", () => {
  const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({
      data: [
        { id: 1, name: "Italian", description: "Italian cuisine" },
        { id: 2, name: "Quick", description: "Quick meals" },
      ],
      error: null,
      count: 15,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  it("returns tags with pagination", async () => {
    const request = new Request("http://localhost:3000/api/tags?page=1&limit=20");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 15,
      totalPages: 1,
    });
  });

  it("filters tags by query", async () => {
    const request = new Request("http://localhost:3000/api/tags?query=ital");
    await GET(request);

    expect(mockSupabaseChain.ilike).toHaveBeenCalledWith("name", "%ital%");
  });

  it("does not filter when query is empty", async () => {
    const request = new Request("http://localhost:3000/api/tags?query=");
    await GET(request);

    expect(mockSupabaseChain.ilike).not.toHaveBeenCalled();
  });

  it("handles page parameter", async () => {
    const request = new Request("http://localhost:3000/api/tags?page=2&limit=10");
    await GET(request);

    expect(mockSupabaseChain.range).toHaveBeenCalledWith(10, 19);
  });

  it("uses default page and limit", async () => {
    const request = new Request("http://localhost:3000/api/tags");
    await GET(request);

    expect(mockSupabaseChain.range).toHaveBeenCalledWith(0, 19);
  });

  it("returns error when database query fails", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
      count: null,
    });

    const request = new Request("http://localhost:3000/api/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
  });

  it("returns empty array when no tags found", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: null,
      error: null,
      count: 0,
    });

    const request = new Request("http://localhost:3000/api/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it("calculates total pages correctly", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 23,
    });

    const request = new Request("http://localhost:3000/api/tags?limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.totalPages).toBe(3);
  });

  it("handles count null gracefully", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: [],
      error: null,
      count: null,
    });

    const request = new Request("http://localhost:3000/api/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.total).toBe(0);
    expect(data.pagination.totalPages).toBe(0);
  });

  it("orders by id ascending", async () => {
    const request = new Request("http://localhost:3000/api/tags");
    await GET(request);

    expect(mockSupabaseChain.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("queries RecipeTag table", async () => {
    const request = new Request("http://localhost:3000/api/tags");
    await GET(request);

    expect(supabase.from).toHaveBeenCalledWith("RecipeTag");
  });
});