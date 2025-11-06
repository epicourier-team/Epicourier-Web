/**
 * @jest-environment node
 */
import { logout } from "@/app/dashboard/action";
import { TextDecoder, TextEncoder } from "util";

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

describe("logout server action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns error when signOut fails", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signOut: jest.fn().mockResolvedValue({ error: { message: "signout fail" } }) },
    });

    const result = await logout();

    expect(result).toEqual({ error: { message: "signout fail" } });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates and returns success when signOut succeeds", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
    });

    const result = await logout();

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});