#!/usr/bin/env node

/**
 * Setup OpenAI API Key for Asset Generation
 * 
 * Adds OpenAI key to Supabase for asset generation
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Load environment variables
function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupApiKey() {
  console.log('🔑 Setup OpenAI API Key for Asset Generation\n');
  console.log('='.repeat(60));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase not configured');
    console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Supabase configured');
  console.log(`   URL: ${supabaseUrl}\n`);

  // Check if key already exists
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: existing } = await supabase
    .from('user_api_keys')
    .select('id')
    .eq('provider', 'openai')
    .limit(1)
    .single();

  if (existing) {
    console.log('⚠️  OpenAI key already exists in Supabase');
    const overwrite = await question('   Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('✅ Using existing key');
      rl.close();
      return;
    }
  }

  // Get API key from user
  console.log('\n📋 Enter your OpenAI API key:');
  console.log('   (Get it from: https://platform.openai.com/api-keys)');
  const apiKey = await question('   API Key: ');

  if (!apiKey || !apiKey.startsWith('sk-')) {
    console.error('❌ Invalid API key format (should start with sk-)');
    rl.close();
    process.exit(1);
  }

  // Save to Supabase
  console.log('\n💾 Saving to Supabase...');
  const { data, error } = await supabase
    .from('user_api_keys')
    .upsert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      provider: 'openai',
      key: apiKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'provider'
    });

  if (error) {
    console.error('❌ Error saving to Supabase:', error.message);
    rl.close();
    process.exit(1);
  }

  console.log('✅ API key saved to Supabase!');
  console.log('\n🚀 Ready to generate assets!');
  console.log('   Run: node scripts/generate-brand-assets-with-supabase.js\n');

  rl.close();
}

setupApiKey().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
