import { supabase } from "@/lib/supabaseClient";

// Opt-in only to avoid hitting the network in sandboxes/CI
const shouldRunIntegrationTests = process.env.RUN_SUPABASE_TESTS === "true";

const describeOrSkip = shouldRunIntegrationTests ? describe : describe.skip;

describeOrSkip("Supabase Connection Test", () => {
  it("should connect to Supabase and fetch from recipe table", async () => {
    const { data, error } = await supabase.from("Recipe").select("id, name").limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
