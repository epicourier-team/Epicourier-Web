import { login } from "@/app/signin/actions";

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

describe("login server action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to /error when signIn fails", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithPassword: jest.fn().mockResolvedValue({ error: true }) },
    });

    await login({ email: "a@test.com", password: "pw" });

    expect(redirect).toHaveBeenCalledWith("/error");
  });

  it("redirects to /recipes when signIn succeeds", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithPassword: jest.fn().mockResolvedValue({ error: null }) },
    });

    await login({ email: "a@test.com", password: "pw" });

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/dashboard/recipes");
  });
});
