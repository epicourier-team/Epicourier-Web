import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("backend/.env")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")  # Usually need service_role for schema changes but let's try anon if enabled or use SERVICE_KEY if available.
# Actually schema changes usually need Postgres direct access or Service Role.
# Let's check environment for SERVICE_ROLE_KEY. If not, I'll try with ANON_KEY (might fail).

# Wait, the user already provided schema.sql which implies they might be running it manually or have a way.
# I will try to run it via python.

if not url or not key:
    print("Missing credentials")
    exit(1)

supabase = create_client(url, key)

sql = """
-- Create ChatHistory table
CREATE TABLE IF NOT EXISTS "ChatHistory" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
    content TEXT,
    tool_calls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster retrieval by user
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON "ChatHistory"(user_id);
"""

try:
    # Supabase-py doesn't support raw SQL query execution easily on client unless RPC is set up.
    # But wait, I can use the SQL editor in the dashboard? No I am the agent.
    # I can try to use `rpc` if a function exists, BUT I don't have one.
    # I will assume the user can run this or I can use the `psql` command if available.
    # Let's check if psql is available via `run_command`.
    pass 
except Exception as e:
    print(e)
