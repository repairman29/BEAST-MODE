#!/usr/bin/env node
/**
 * Create secrets table in Supabase and store Porkbun credentials
 */

const path = require('path');
const fs = require('fs');

// Load .env.local
try {
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PORKBUN_API_KEY = 'pk1_7cad269a0c08c304bdeef027a8c77b4593b251ce0202f022cd4ff11b04962b7d';
const PORKBUN_SECRET_KEY = 'sk1_21538a7e248a1beb603511a1d6b721980333ddd9f29cc0cd29a0704135e5fb3b';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSecretsTableAndStore() {
  console.log('🔐 Creating secrets table and storing Porkbun credentials...\n');
  
  // First, try to create the table using SQL
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS secrets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value JSONB NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_secrets_key ON secrets(key);
    
    -- Enable RLS
    ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Only service role can access
    DROP POLICY IF EXISTS "Service role only" ON secrets;
    CREATE POLICY "Service role only" ON secrets
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  `;
  
  try {
    // Try to execute via SQL (if RPC exists)
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (createError) {
      console.log('   ⚠️  Could not create via RPC, table might already exist or need manual creation');
    } else {
      console.log('   ✅ Created secrets table');
    }
  } catch (e) {
    console.log('   ℹ️  RPC not available, trying direct insert (table might exist)');
  }
  
  // Now try to insert/update the credentials
  const credentials = {
    api_key: PORKBUN_API_KEY,
    secret_key: PORKBUN_SECRET_KEY,
    stored_at: new Date().toISOString()
  };
  
  try {
    const { data, error } = await supabase
      .from('secrets')
      .upsert({
        key: 'porkbun_api',
        value: credentials,
        description: 'Porkbun DNS API credentials for beast-mode.dev',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single();
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  secrets table does not exist');
        console.log('   💡 Creating migration file for you...');
        
        // Create migration file
        const migrationSQL = `-- Create secrets table for storing API keys and credentials
CREATE TABLE IF NOT EXISTS secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secrets_key ON secrets(key);

-- Enable RLS
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access
CREATE POLICY "Service role only" ON secrets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insert Porkbun credentials
INSERT INTO secrets (key, value, description)
VALUES (
  'porkbun_api',
  '{"api_key": "${PORKBUN_API_KEY}", "secret_key": "${PORKBUN_SECRET_KEY}", "stored_at": "${new Date().toISOString()}"}'::jsonb,
  'Porkbun DNS API credentials for beast-mode.dev'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();
`;
        
        const migrationPath = path.join(__dirname, '../website/supabase/migrations/20250101000001_create_secrets_table.sql');
        const migrationsDir = path.dirname(migrationPath);
        if (!fs.existsSync(migrationsDir)) {
          fs.mkdirSync(migrationsDir, { recursive: true });
        }
        fs.writeFileSync(migrationPath, migrationSQL);
        console.log(`   ✅ Created migration: ${migrationPath}`);
        console.log('   📋 Run this migration in Supabase SQL editor');
      } else {
        console.error('   ❌ Error:', error.message);
      }
    } else {
      console.log('   ✅ Stored Porkbun credentials in secrets table');
      console.log(`   Key: porkbun_api`);
      console.log(`   ID: ${data.id}`);
    }
  } catch (e) {
    console.error('   ❌ Error:', e.message);
  }
}

createSecretsTableAndStore().then(() => {
  console.log('\n✅ Done!');
}).catch(console.error);
