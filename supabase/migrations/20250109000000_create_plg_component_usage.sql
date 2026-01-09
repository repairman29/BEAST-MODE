
    CREATE TABLE IF NOT EXISTS plg_component_usage (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      component_name TEXT NOT NULL,
      component_type TEXT NOT NULL, -- 'badge', 'widget', 'button', 'cards'
      repo TEXT,
      user_id UUID,
      session_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_plg_component_name ON plg_component_usage(component_name);
    CREATE INDEX IF NOT EXISTS idx_plg_component_type ON plg_component_usage(component_type);
    CREATE INDEX IF NOT EXISTS idx_plg_component_created ON plg_component_usage(created_at);
  