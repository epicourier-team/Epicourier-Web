import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Resolve both the Supabase auth user ID (UUID) and the numeric public user ID.
 */
export async function getUserIdentity(
  supabase: SupabaseClient<Database>,
): Promise<{ authUserId: string; publicUserId: number }> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  if (!authUser.email) {
    throw new Error("Authenticated user does not have an email.");
  }

  const { data: publicUsers, error: profileError } = await supabase
    .from("User")
    .select("id")
    .eq("email", authUser.email)
    .limit(1);

  if (profileError) {
    console.error("Error fetching public user profile:", profileError.message);
    throw new Error("Error fetching user profile.");
  }

  if (!publicUsers || publicUsers.length === 0) {
    throw new Error("Public user profile not found.");
  }

  const publicUser = publicUsers[0];
  return { authUserId: authUser.id, publicUserId: publicUser.id };
}

/**
 * Helper function to get the numeric user ID from public."User" table
 * based on the authenticated user's email.
 *
 * @param supabase - Supabase client instance
 * @returns The numeric user ID from the public User table
 * @throws Error if user is not authenticated or user profile is not found
 */
export async function getPublicUserId(supabase: SupabaseClient<Database>): Promise<number> {
  const { publicUserId } = await getUserIdentity(supabase);
  return publicUserId;
}
