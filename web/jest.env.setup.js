// Set fake environment variables for Jest tests
// Only set them if they don't already exist (e.g., from .env file)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-url.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key-for-testing";
}
