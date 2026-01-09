-- Team & Collaboration System Tables
-- Stores teams, members, workspaces, and collaboration sessions

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}'::jsonb, -- Custom permissions
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_joined_at ON team_members(joined_at);

-- Shared workspaces table
CREATE TABLE IF NOT EXISTS shared_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workspace_type TEXT NOT NULL CHECK (workspace_type IN ('codebase', 'dashboard', 'analytics', 'mlops')),
  config JSONB DEFAULT '{}'::jsonb, -- Workspace configuration
  is_public BOOLEAN DEFAULT FALSE, -- Public to team
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_workspaces_team_id ON shared_workspaces(team_id);
CREATE INDEX IF NOT EXISTS idx_shared_workspaces_type ON shared_workspaces(workspace_type);
CREATE INDEX IF NOT EXISTS idx_shared_workspaces_public ON shared_workspaces(is_public);
CREATE INDEX IF NOT EXISTS idx_shared_workspaces_created_at ON shared_workspaces(created_at);

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES shared_workspaces(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('code_review', 'pair_programming', 'design', 'planning')),
  participants UUID[] NOT NULL, -- Array of user IDs
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  session_data JSONB DEFAULT '{}'::jsonb, -- Session state/data
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_workspace_id ON collaboration_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host_id ON collaboration_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_status ON collaboration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_started_at ON collaboration_sessions(started_at);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access their own teams and teams they're members of

DROP POLICY IF EXISTS "Users can access their own teams" ON teams;
CREATE POLICY "Users can access their own teams" ON teams
  FOR ALL
  USING (auth.uid() = owner_id OR EXISTS (
    SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can access team members of their teams" ON team_members;
CREATE POLICY "Users can access team members of their teams" ON team_members
  FOR ALL
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can access workspaces of their teams" ON shared_workspaces;
CREATE POLICY "Users can access workspaces of their teams" ON shared_workspaces
  FOR ALL
  USING (is_public = TRUE OR EXISTS (
    SELECT 1 FROM team_members WHERE team_id = shared_workspaces.team_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can access collaboration sessions they're in" ON collaboration_sessions;
CREATE POLICY "Users can access collaboration sessions they're in" ON collaboration_sessions
  FOR ALL
  USING (auth.uid() = ANY(participants) OR auth.uid() = host_id);

-- Function to update teams updated_at
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- Function to update shared_workspaces updated_at
CREATE OR REPLACE FUNCTION update_shared_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_shared_workspaces_updated_at ON shared_workspaces;
CREATE TRIGGER update_shared_workspaces_updated_at
  BEFORE UPDATE ON shared_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_workspaces_updated_at();
