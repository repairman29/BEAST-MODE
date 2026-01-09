-- Enterprise Features System Tables
-- Stores SSO configurations, role permissions, audit logs, and enterprise settings

-- SSO configurations table
CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sso_type TEXT NOT NULL CHECK (sso_type IN ('saml', 'oauth', 'oidc', 'ldap')),
  provider_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  config JSONB NOT NULL, -- SSO configuration (endpoints, certificates, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, sso_type)
);

CREATE INDEX IF NOT EXISTS idx_sso_configs_team_id ON sso_configurations(team_id);
CREATE INDEX IF NOT EXISTS idx_sso_configs_type ON sso_configurations(sso_type);
CREATE INDEX IF NOT EXISTS idx_sso_configs_enabled ON sso_configurations(enabled);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'api', 'feature', 'data', 'workspace'
  resource_id TEXT, -- Specific resource (optional)
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'delete', 'admin', 'custom')),
  custom_permissions JSONB DEFAULT '{}'::jsonb, -- Custom permission details
  conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for permission
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role_name, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource_type ON role_permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON role_permissions(is_active);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'access', 'login', 'logout'
  resource_type TEXT NOT NULL, -- 'user', 'team', 'workspace', 'model', 'api'
  resource_id TEXT,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_team_id ON audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Enterprise settings table
CREATE TABLE IF NOT EXISTS enterprise_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'array')),
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_settings_team_id ON enterprise_settings(team_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_settings_key ON enterprise_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_enterprise_settings_updated_at ON enterprise_settings(updated_at);

-- Enable RLS
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Team admins can manage SSO and settings, all can view audit logs

DROP POLICY IF EXISTS "Team admins can manage SSO configs" ON sso_configurations;
CREATE POLICY "Team admins can manage SSO configs" ON sso_configurations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = sso_configurations.team_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Service role can access all role permissions" ON role_permissions;
CREATE POLICY "Service role can access all role permissions" ON role_permissions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view audit logs of their teams" ON audit_logs;
CREATE POLICY "Users can view audit logs of their teams" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = audit_logs.team_id 
    AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role can write audit logs" ON audit_logs;
CREATE POLICY "Service role can write audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Team admins can manage enterprise settings" ON enterprise_settings;
CREATE POLICY "Team admins can manage enterprise settings" ON enterprise_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = enterprise_settings.team_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Function to update sso_configurations updated_at
CREATE OR REPLACE FUNCTION update_sso_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_sso_configurations_updated_at ON sso_configurations;
CREATE TRIGGER update_sso_configurations_updated_at
  BEFORE UPDATE ON sso_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_sso_configurations_updated_at();

-- Function to update role_permissions updated_at
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_updated_at();

-- Function to update enterprise_settings updated_at
CREATE OR REPLACE FUNCTION update_enterprise_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_enterprise_settings_updated_at ON enterprise_settings;
CREATE TRIGGER update_enterprise_settings_updated_at
  BEFORE UPDATE ON enterprise_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_enterprise_settings_updated_at();
