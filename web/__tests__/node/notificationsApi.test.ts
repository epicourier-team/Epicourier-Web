/**
 * @jest-environment node
 */

import { POST, GET } from "@/app/api/notifications/subscribe/route";
import { POST as UNSUBSCRIBE_POST, DELETE } from "@/app/api/notifications/unsubscribe/route";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";

// Mock push notifications module before importing vapid-key route
jest.mock("@/lib/pushNotifications", () => ({
  getVapidPublicKey: jest.fn().mockReturnValue("test-vapid-public-key"),
  isPushConfigured: jest.fn().mockReturnValue(true),
  sendAchievementNotification: jest.fn().mockResolvedValue(undefined),
}));

// Now import the route that depends on pushNotifications
import { GET as GET_VAPID_KEY } from "@/app/api/notifications/vapid-key/route";
import { getVapidPublicKey, isPushConfigured } from "@/lib/pushNotifications";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getUserIdentity: jest.fn(),
}));

// Helper to create mock request
const createRequest = (body: unknown, method = "POST") => {
  return new Request("http://localhost:3000/api/notifications/subscribe", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

// Valid subscription data
const validSubscription = {
  subscription: {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    keys: {
      p256dh: "test-p256dh-key",
      auth: "test-auth-key",
    },
  },
};

describe("Notifications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockSupabaseClient = {
      from: jest.fn(),
      auth: { getUser: jest.fn() },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (getUserIdentity as jest.Mock).mockResolvedValue({
      authUserId: "test-user-id",
      publicUserId: 42,
    });
  });

  describe("POST /api/notifications/subscribe", () => {
    it("returns 401 when not authenticated", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await POST(createRequest(validSubscription));
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Unauthorized");
    });

    it("returns 400 for invalid JSON body", async () => {
      const invalidRequest = new Request("http://localhost:3000/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      const res = await POST(invalidRequest);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid JSON body");
    });

    it("returns 400 when subscription endpoint is missing", async () => {
      const res = await POST(createRequest({ subscription: {} }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain("missing endpoint");
    });

    it("returns 400 when keys are missing", async () => {
      const res = await POST(
        createRequest({
          subscription: {
            endpoint: "https://fcm.googleapis.com/test",
            keys: {},
          },
        })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain("missing endpoint or keys");
    });

    it("creates new subscription successfully", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      }));

      const res = await POST(createRequest(validSubscription));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain("saved successfully");
    });

    it("updates existing subscription successfully", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "existing-id" },
                error: null,
              }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }));

      const res = await POST(createRequest(validSubscription));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain("updated successfully");
    });

    it("returns 500 when insert fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          error: { message: "Database error" },
        }),
      }));

      const res = await POST(createRequest(validSubscription));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.message).toContain("Failed to save");
    });

    it("returns 500 when update fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "existing-id" },
                error: null,
              }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: "Update failed" },
          }),
        }),
      }));

      const res = await POST(createRequest(validSubscription));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.message).toContain("Failed to update");
    });
  });

  describe("GET /api/notifications/subscribe", () => {
    it("returns 401 when not authenticated", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("returns subscription status when user has subscriptions", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "sub-1" }, { id: "sub-2" }],
            error: null,
            count: 2,
          }),
        }),
      }));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.subscribed).toBe(true);
      expect(json.count).toBe(2);
    });

    it("returns subscribed false when no subscriptions", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      }));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.subscribed).toBe(false);
      expect(json.count).toBe(0);
    });

    it("returns 500 when database error occurs", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
            count: null,
          }),
        }),
      }));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toContain("Failed to check");
    });
  });

  describe("POST /api/notifications/unsubscribe", () => {
    const createUnsubRequest = (body: unknown) => {
      return new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    };

    it("returns 401 when not authenticated", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await UNSUBSCRIBE_POST(
        createUnsubRequest({ endpoint: "https://fcm.googleapis.com/test" })
      );
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it("returns 400 for invalid JSON", async () => {
      const invalidRequest = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      const res = await UNSUBSCRIBE_POST(invalidRequest);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.message).toBe("Invalid JSON body");
    });

    it("returns 400 when endpoint is missing", async () => {
      const res = await UNSUBSCRIBE_POST(createUnsubRequest({}));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.message).toContain("Missing endpoint");
    });

    it("successfully unsubscribes from specific endpoint", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }));

      const res = await UNSUBSCRIBE_POST(
        createUnsubRequest({ endpoint: "https://fcm.googleapis.com/test" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain("Successfully unsubscribed");
    });

    it("returns 500 when delete fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: "Delete failed" },
            }),
          }),
        }),
      }));

      const res = await UNSUBSCRIBE_POST(
        createUnsubRequest({ endpoint: "https://fcm.googleapis.com/test" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
    });
  });

  describe("DELETE /api/notifications/unsubscribe", () => {
    it("returns 401 when not authenticated", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await DELETE();
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it("successfully removes all subscriptions", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 3,
            error: null,
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }));

      const res = await DELETE();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.removed).toBe(3);
    });

    it("returns 500 when delete fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: "Delete all failed" },
          }),
        }),
      }));

      const res = await DELETE();
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
    });
  });

  describe("GET /api/notifications/vapid-key", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("returns VAPID public key when configured", async () => {
      (isPushConfigured as jest.Mock).mockReturnValue(true);
      (getVapidPublicKey as jest.Mock).mockReturnValue("test-vapid-public-key");

      const res = await GET_VAPID_KEY();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.publicKey).toBe("test-vapid-public-key");
      expect(json.configured).toBe(true);
    });

    it("returns 503 when VAPID key is not configured", async () => {
      (isPushConfigured as jest.Mock).mockReturnValue(false);

      const res = await GET_VAPID_KEY();
      const json = await res.json();

      expect(res.status).toBe(503);
      expect(json.error).toContain("not configured");
      expect(json.configured).toBe(false);
    });
  });
});
