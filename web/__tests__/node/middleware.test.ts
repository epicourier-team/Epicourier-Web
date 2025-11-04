import { middleware } from "@/middleware";
import { createServerClient } from "@supabase/ssr";
import { createServer } from "http";
import { NextRequest } from "next/server";
import request from "supertest";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("Next.js middleware integration tests", () => {
  const makeServer = async (path: string) =>
    createServer(async (req, res) => {
      const headers = Object.fromEntries(
        Object.entries(req.headers)
          .filter(([_, v]) => typeof v === "string")
          .map(([k, v]) => [k, v as string])
      );

      const requestObj = new Request(`http://localhost${path}`, {
        method: req.method,
        headers,
      });

      const nextReq = new NextRequest(requestObj);
      const response = await middleware(nextReq);
      const body = await response.text();

      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(body);
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    (createServerClient as jest.Mock).mockImplementation(() => ({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    }));

    const server = await makeServer("/dashboard");
    const res = await request(server).get("/dashboard");

    const redirectUrl = new URL(res.headers.location);
    expect(redirectUrl.pathname).toBe("/signin");
    expect(res.status).toBe(307);
  });

  it("allows authenticated users", async () => {
    (createServerClient as jest.Mock).mockImplementation(() => ({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "abc" } } }) },
    }));

    const server = await makeServer("/dashboard");
    const res = await request(server).get("/dashboard");

    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
  });

  it("does not redirect on /signin", async () => {
    (createServerClient as jest.Mock).mockImplementation(() => ({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    }));

    const server = await makeServer("/signin");
    const res = await request(server).get("/signin");

    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
  });
});