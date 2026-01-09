-- Codebase Chat Sessions Table
-- Migration: 20250118000000_create_codebase_chat_sessions.sql
-- Description: Persists codebase chat sessions to prevent data loss on server restart

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Codebase Chat Sessions Table
-- Stores chat conversation history for codebase chat feature
CREATE TABLE IF NOT EXISTS codebase_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL UNIQUE, -- Client-generated session ID
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: link to user
    repo TEXT, -- Repository context
    current_file TEXT, -- Current file context
    conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of messages
    context_cache JSONB DEFAULT '{}'::jsonb, -- Cached context data
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
    last_activity TIMESTAMPTZ DEFAULT NOW(), -- Last message timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_codebase_chat_sessions_session_id ON codebase_chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_codebase_chat_sessions_user_id ON codebase_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_codebase_chat_sessions_last_activity ON codebase_chat_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_codebase_chat_sessions_repo ON codebase_chat_sessions(repo) WHERE repo IS NOT NULL;

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_codebase_chat_sessions_history ON codebase_chat_sessions USING GIN (conversation_history);
CREATE INDEX IF NOT EXISTS idx_codebase_chat_sessions_context ON codebase_chat_sessions USING GIN (context_cache);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_codebase_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_codebase_chat_sessions_updated_at
    BEFORE UPDATE ON codebase_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_codebase_chat_sessions_updated_at();

-- Row Level Security (RLS)
ALTER TABLE codebase_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own sessions" ON codebase_chat_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON codebase_chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON codebase_chat_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON codebase_chat_sessions;
DROP POLICY IF EXISTS "Allow anonymous sessions" ON codebase_chat_sessions;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON codebase_chat_sessions;

-- RLS Policies
-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
    ON codebase_chat_sessions
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.uid() IS NULL -- Allow anonymous sessions (no user_id)
    );

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
    ON codebase_chat_sessions
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        auth.uid() IS NULL -- Allow anonymous sessions
    );

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
    ON codebase_chat_sessions
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        auth.uid() IS NULL -- Allow anonymous sessions
    );

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
    ON codebase_chat_sessions
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        auth.uid() IS NULL -- Allow anonymous sessions
    );

-- Allow anonymous sessions (sessions without user_id)
CREATE POLICY "Allow anonymous sessions"
    ON codebase_chat_sessions
    FOR ALL
    USING (user_id IS NULL);

-- Service role can manage all sessions (for server-side operations)
CREATE POLICY "Service role can manage all sessions"
    ON codebase_chat_sessions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE codebase_chat_sessions IS 'Stores codebase chat conversation history to prevent data loss on server restart';
COMMENT ON COLUMN codebase_chat_sessions.session_id IS 'Client-generated unique session identifier';
COMMENT ON COLUMN codebase_chat_sessions.conversation_history IS 'Array of message objects: [{role, content, timestamp, ...}]';
COMMENT ON COLUMN codebase_chat_sessions.context_cache IS 'Cached codebase context to avoid rebuilding on each message';
