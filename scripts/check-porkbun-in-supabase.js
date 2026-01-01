#!/usr/bin/env node
/**
 * Check for Porkbun credentials in Supabase
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

async function checkSupabase() {
  console.log('🔍 Checking Supabase for Porkbun credentials...\n');
  
  const tables = ['app_config', 'config', 'secrets', 'api_config', 'domain_config', 'user_api_keys'];
  
  for (const table of tables) {
    try {
      console.log(`📋 Checking ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(10);
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}\n`);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`   ✅ Found ${data.length} record(s)`);
        data.forEach((record, idx) => {
          console.log(`   Record ${idx + 1}:`);
          console.log(`      Keys: ${Object.keys(record).join(', ')}`);
          if (record.key) console.log(`      Key: ${record.key}`);
          if (record.name) console.log(`      Name: ${record.name}`);
          if (record.provider) console.log(`      Provider: ${record.provider}`);
          if (record.value && typeof record.value === 'object') {
            console.log(`      Value (object): ${JSON.stringify(record.value).substring(0, 100)}...`);
          } else if (record.value) {
            console.log(`      Value: ${String(record.value).substring(0, 50)}...`);
          }
        });
        console.log('');
      } else {
        console.log(`   ℹ️  No records found\n`);
      }
    } catch (e) {
      console.log(`   ⚠️  Table doesn't exist or error: ${e.message}\n`);
    }
  }
}

checkSupabase().catch(console.error);
