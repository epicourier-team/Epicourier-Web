import { supabase } from "@/lib/supabaseClient";

// Skip this integration test in CI or when using fake credentials
const shouldRunIntegrationTests =
  process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("fake");

const describeOrSkip = shouldRunIntegrationTests ? describe : describe.skip;

describeOrSkip("Supabase Connection Test", () => {
  it("should connect to Supabase and fetch from recipe table", async () => {
    const { data, error } = await supabase.from("Recipe").select("id, name").limit(1);

    // Connection successful
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
