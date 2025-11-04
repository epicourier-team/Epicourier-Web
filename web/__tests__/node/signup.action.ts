
/**
 * @jest-environment node
 */
import { signup } from "@/app/signup/actions";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

describe("signup server action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns signup error when signUp fails", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: { message: "fail" } }) },
    });

    const result = await signup({ email: "a@test.com", password: "pw" });

    expect(result).toEqual({ error: { message: "fail" } });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns insert error when DB insert fails", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null }) },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: { message: "db fail" } }),
      }),
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toEqual({ error: { message: "db fail" } });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /signin when signup succeeds", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null }) },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/signin");
  });
});