import { GET } from "@/app/api/ingredients/route";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

jest.mock("@/lib/supabaseClient");

describe("GET /api/ingredients", () => {
  const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({
      data: [
        { id: 1, name: "Tomato", unit: "100g" },
        { id: 2, name: "Cheese", unit: "50g" },
      ],
      error: null,
      count: 25,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  it("returns ingredients with pagination", async () => {
    const request = new Request("http://localhost:3000/api/ingredients?page=1&limit=20");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 25,
      totalPages: 2,
    });
  });

  it("filters ingredients by query", async () => {
    const request = new Request("http://localhost:3000/api/ingredients?query=tom");
    await GET(request);

    expect(mockSupabaseChain.ilike).toHaveBeenCalledWith("name", "%tom%");
  });

  it("does not filter when query is empty", async () => {
    const request = new Request("http://localhost:3000/api/ingredients?query=");
    await GET(request);

    expect(mockSupabaseChain.ilike).not.toHaveBeenCalled();
  });

  it("handles page parameter", async () => {
    const request = new Request("http://localhost:3000/api/ingredients?page=3&limit=10");
    await GET(request);

    expect(mockSupabaseChain.range).toHaveBeenCalledWith(20, 29);
  });

  it("uses default page and limit", async () => {
    const request = new Request("http://localhost:3000/api/ingredients");
    await GET(request);

    expect(mockSupabaseChain.range).toHaveBeenCalledWith(0, 19);
  });

  it("returns error when database query fails", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
      count: null,
    });

    const request = new Request("http://localhost:3000/api/ingredients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
  });

  it("returns empty array when no ingredients found", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: null,
      error: null,
      count: 0,
    });

    const request = new Request("http://localhost:3000/api/ingredients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it("calculates total pages correctly", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 47,
    });

    const request = new Request("http://localhost:3000/api/ingredients?limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.totalPages).toBe(5);
  });

  it("handles count null gracefully", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: [],
      error: null,
      count: null,
    });

    const request = new Request("http://localhost:3000/api/ingredients");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.total).toBe(0);
    expect(data.pagination.totalPages).toBe(0);
  });

  it("orders by id ascending", async () => {
    const request = new Request("http://localhost:3000/api/ingredients");
    await GET(request);

    expect(mockSupabaseChain.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("trims whitespace from query", async () => {
    const request = new Request("http://localhost:3000/api/ingredients?query=  tomato  ");
    await GET(request);

    expect(mockSupabaseChain.ilike).toHaveBeenCalledWith("name", "%  tomato  %");
  });
});