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
CREATE INDEX idx_chat_history_user_id ON "ChatHistory"(user_id);
