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
    // simulate failure when fetching user data (maybeSingle returns error)
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('db fail') });
    const eqForSelect = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq: eqForSelect });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null }) },
      from: jest.fn().mockReturnValue({ select }),
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    expect(result).toHaveProperty('error');
    expect((result as any).error).toBeInstanceOf(Error);
    expect((result as any).error.message).toBe('db fail');
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /signin when signup succeeds", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null });
    const eqForSelect = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq: eqForSelect });

    const eqForUpdate = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq: eqForUpdate });

    const from = jest.fn().mockImplementation((table: string) => ({ select, update }));

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null }) },
      from,
    });

    const result = await signup({ email: "a@test.com", password: "pw", username: "user" });

    // action redirects on success
    expect(redirect).toHaveBeenCalledWith('/signin');
    expect(result).toBeUndefined();
  });

  it('returns error when updating user fails', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'user-2' }, error: null });
    const eqForSelect = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq: eqForSelect });

    const eqForUpdate = jest.fn().mockResolvedValue({ error: new Error('update failed') });
    const update = jest.fn().mockReturnValue({ eq: eqForUpdate });

    const from = jest.fn().mockImplementation((table: string) => ({ select, update }));

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: jest.fn().mockResolvedValue({ error: null }) },
      from,
    });

    const result = await signup({ email: 'a@test.com', password: 'pw', username: 'who' });
    expect(result).toHaveProperty('error');
    expect((result as any).error).toBeInstanceOf(Error);
    expect((result as any).error.message).toBe('update failed');
    expect(redirect).not.toHaveBeenCalled();
  });
});
