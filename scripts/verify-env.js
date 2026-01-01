/**
 * Environment Variable Verification Script
 * 
 * Verifies that all required environment variables are set
 * 
 * Phase 1: Production Deployment
 */

const requiredVars = {
  production: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL'
  ],
  development: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
};

const optionalVars = [
  'DATADOG_API_KEY',
  'DATADOG_APP_KEY',
  'NEW_RELIC_LICENSE_KEY',
  'SLACK_WEBHOOK_URL',
  'PAGERDUTY_API_KEY'
];

function main() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredVars[env] || requiredVars.development;

  console.log(`🔍 Verifying environment variables (${env})...\n`);

  let allValid = true;
  const missing = [];
  const present = [];
  const optionalPresent = [];

  // Check required variables
  for (const varName of required) {
    if (process.env[varName]) {
      present.push(varName);
      console.log(`✅ ${varName}: Set`);
    } else {
      missing.push(varName);
      allValid = false;
      console.log(`❌ ${varName}: Missing`);
    }
  }

  // Check optional variables
  console.log('\n📋 Optional variables:');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      optionalPresent.push(varName);
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚪ ${varName}: Not set (optional)`);
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Required: ${present.length}/${required.length} set`);
  console.log(`   Optional: ${optionalPresent.length}/${optionalVars.length} set`);

  if (allValid) {
    console.log('\n✅ All required environment variables are set!');
    return 0;
  } else {
    console.log('\n❌ Missing required environment variables:');
    missing.forEach(v => console.log(`   - ${v}`));
    console.log('\n💡 Set these in Vercel Dashboard → Settings → Environment Variables');
    return 1;
  }
}

process.exit(main());

