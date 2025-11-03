import { supabase } from "@/lib/supabaseClient";

describe("Supabase Connection Test", () => {
  it("should connect to Supabase and fetch from recipe table", async () => {
    const { data, error } = await supabase.from("Recipe").select("id, name").limit(1);

    // Connection successful
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
