#!/usr/bin/env node
/**
 * Run secrets table migration directly via Supabase
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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running secrets table migration...\n');
  
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../website/supabase/migrations/20250101000001_create_secrets_table.sql'),
    'utf8'
  );
  
  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📋 Executing ${statements.length} SQL statements...\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    try {
      // Use REST API directly for DDL statements
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql: statement })
      }).catch(async () => {
        // Try alternative: use postgrest directly
        return await fetch(`${supabaseUrl.replace('/rest/v1', '')}/postgrest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sql: statement })
        });
      });
      
      if (response && response.ok) {
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
      } else {
        console.log(`   ⚠️  Statement ${i + 1} might need manual execution`);
      }
    } catch (e) {
      console.log(`   ⚠️  Could not execute statement ${i + 1} automatically`);
      console.log(`   💡 You'll need to run this in Supabase SQL Editor`);
    }
  }
  
  // Try to verify by querying the table
  console.log('\n🔍 Verifying secrets table...');
  try {
    const { data, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('key', 'porkbun_api')
      .single();
    
    if (!error && data) {
      console.log('✅ Secrets table exists and contains Porkbun credentials!');
      console.log(`   Key: ${data.key}`);
      console.log(`   Description: ${data.description}`);
    } else if (error && error.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist yet');
      console.log('   Please run the migration in Supabase SQL Editor:');
      console.log('   website/supabase/migrations/20250101000001_create_secrets_table.sql');
    } else {
      console.log('⚠️  Could not verify (might need manual migration)');
    }
  } catch (e) {
    console.log('⚠️  Could not verify table');
  }
}

runMigration().catch(console.error);
