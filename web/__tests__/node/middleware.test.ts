import { middleware } from "@/middleware";
import { createServerClient } from "@supabase/ssr";
import { createServer } from "http";
import { NextRequest } from "next/server";
import request from "supertest";
import { updateSession } from "../../src/utils/supabase/middleware";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("Next.js middleware integration tests", () => {
  const makeServer = async (path: string) =>
    createServer(async (req, res) => {
      const headers = Object.fromEntries(
        Object.entries(req.headers)
          .filter(([, v]) => typeof v === "string")
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

describe("updateSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls cookies.getAll and setAll properly", async () => {
    const url = "http://localhost:3000/dashboard";
    const req = new NextRequest(url, {
      headers: new Headers({ cookie: "session=abc123" }),
    });

    const getAllSpy = jest.spyOn(req.cookies, "getAll");
    const setSpyRequest = jest.spyOn(req.cookies, "set");

    (createServerClient as jest.Mock).mockImplementation((_url, _key, options) => {
      const sampleCookies = [{ name: "token", value: "xyz", options: { path: "/" } }];

      options.cookies.getAll();
      options.cookies.setAll(sampleCookies.map((c) => ({ ...c, options: { path: "/" } })));

      return {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      };
    });

    // 4️⃣ 실행
    const response = await updateSession(req);

    // 5️⃣ 검증
    expect(getAllSpy).toHaveBeenCalled();
    expect(setSpyRequest).toHaveBeenCalledWith("token", "xyz");
    expect(createServerClient).toHaveBeenCalledTimes(1);
    expect(response).toBeDefined();
  });
});
