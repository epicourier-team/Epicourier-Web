/**
 * @jest-environment node
 */
import { signup } from "@/app/signup/actions";
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

describe("signup server action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns error when user already exists", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: "existing" } });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });

    (createClient as jest.Mock).mockResolvedValue({
      from: jest.fn().mockReturnValue({ select }),
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toEqual({ error: { message: "An account with this email already exists" } });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns signup error when signUp fails", async () => {
    const maybeSingleCheck = jest.fn().mockResolvedValue({ data: null });
    const eqCheck = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCheck });
    const selectCheck = jest.fn().mockReturnValue({ eq: eqCheck });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: { message: "fail" } }) },
      from: jest.fn().mockReturnValue({ select: selectCheck }),
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toEqual({ error: { message: "fail" } });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns error when no user after signup", async () => {
    const maybeSingleCheck = jest.fn().mockResolvedValue({ data: null });
    const eqCheck = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCheck });
    const selectCheck = jest.fn().mockReturnValue({ eq: eqCheck });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null, data: { user: null } }) },
      from: jest.fn().mockReturnValue({ select: selectCheck }),
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toEqual({ error: { message: "Failed to create account" } });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns error when DB get fails after signup", async () => {
    const maybeSingleCheck = jest.fn().mockResolvedValue({ data: null });
    const eqCheck = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCheck });
    const selectCheck = jest.fn().mockReturnValue({ eq: eqCheck });

    const maybeSingleGet = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: "db fail" } });
    const eqGet = jest.fn().mockReturnValue({ maybeSingle: maybeSingleGet });
    const selectGet = jest.fn().mockReturnValue({ eq: eqGet });

    const from = jest
      .fn()
      .mockReturnValueOnce({ select: selectCheck })
      .mockReturnValueOnce({ select: selectGet });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null, data: { user: {} } }) },
      from,
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toEqual({
      error: {
        message:
          "Account created but failed to set username. Please try signing in and updating your profile.",
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns error when DB update fails", async () => {
    const maybeSingleCheck = jest.fn().mockResolvedValue({ data: null });
    const eqCheck = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCheck });
    const selectCheck = jest.fn().mockReturnValue({ eq: eqCheck });

    const maybeSingleGet = jest.fn().mockResolvedValue({ data: { id: "user-1" }, error: null });
    const eqGet = jest.fn().mockReturnValue({ maybeSingle: maybeSingleGet });
    const selectGet = jest.fn().mockReturnValue({ eq: eqGet });

    const eqUpdate = jest.fn().mockResolvedValue({ error: { message: "update fail" } });
    const update = jest.fn().mockReturnValue({ eq: eqUpdate });

    const from = jest
      .fn()
      .mockReturnValueOnce({ select: selectCheck })
      .mockReturnValueOnce({ select: selectGet })
      .mockReturnValueOnce({ update });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null, data: { user: {} } }) },
      from,
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toEqual({
      error: {
        message:
          "Account created but failed to set username. Please try signing in and updating your profile.",
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns success when signup and update succeed", async () => {
    const maybeSingleCheck = jest.fn().mockResolvedValue({ data: null });
    const eqCheck = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCheck });
    const selectCheck = jest.fn().mockReturnValue({ eq: eqCheck });

    const maybeSingleGet = jest.fn().mockResolvedValue({ data: { id: "user-1" }, error: null });
    const eqGet = jest.fn().mockReturnValue({ maybeSingle: maybeSingleGet });
    const selectGet = jest.fn().mockReturnValue({ eq: eqGet });

    const eqUpdate = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq: eqUpdate });

    const from = jest
      .fn()
      .mockReturnValueOnce({ select: selectCheck })
      .mockReturnValueOnce({ select: selectGet })
      .mockReturnValueOnce({ update });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null, data: { user: {} } }) },
      from,
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).not.toHaveBeenCalled();
  });
});
