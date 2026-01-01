#!/usr/bin/env node
/**
 * Check for secrets table in Supabase
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

async function checkSecretsTable() {
  console.log('🔍 Checking for secrets table in Supabase...\n');
  
  const tableNames = ['secrets', 'secret', 'api_secrets', 'service_secrets', 'config_secrets'];
  
  for (const tableName of tableNames) {
    try {
      console.log(`📋 Checking ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ℹ️  Table ${tableName} does not exist\n`);
        } else {
          console.log(`   ⚠️  Error: ${error.message}\n`);
        }
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`   ✅ Found ${tableName} table with ${data.length} record(s)`);
        console.log(`   📋 Columns: ${Object.keys(data[0]).join(', ')}`);
        console.log(`   📝 Sample record:`);
        console.log(`      ${JSON.stringify(data[0], null, 2).substring(0, 200)}...\n`);
        return tableName;
      } else {
        console.log(`   ✅ Table ${tableName} exists but is empty\n`);
        return tableName;
      }
    } catch (e) {
      console.log(`   ⚠️  Error: ${e.message}\n`);
    }
  }
  
  return null;
}

checkSecretsTable().then(tableName => {
  if (tableName) {
    console.log(`✅ Found secrets table: ${tableName}`);
    console.log(`   Ready to store Porkbun credentials there!`);
  } else {
    console.log('❌ No secrets table found');
    console.log('   Checked: secrets, secret, api_secrets, service_secrets, config_secrets');
  }
}).catch(console.error);
