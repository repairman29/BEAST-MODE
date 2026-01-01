#!/usr/bin/env node
/**
 * Check user_api_keys table structure
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

async function checkStructure() {
  console.log('🔍 Checking user_api_keys table structure...\n');
  
  // Get a sample record to see structure
  const { data: sample, error } = await supabase
    .from('user_api_keys')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('📋 Table structure:');
  console.log('   Columns:', Object.keys(sample).join(', '));
  console.log('\n📝 Sample record:');
  console.log(JSON.stringify(sample, null, 2));
  
  // Check what providers are allowed
  console.log('\n🔍 Checking allowed providers...');
  const { data: providers } = await supabase
    .from('user_api_keys')
    .select('provider')
    .limit(20);
  
  if (providers) {
    const uniqueProviders = [...new Set(providers.map(p => p.provider))];
    console.log('   Found providers:', uniqueProviders.join(', '));
  }
}

checkStructure().catch(console.error);
