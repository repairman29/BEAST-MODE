#!/usr/bin/env node

/**
 * BEAST MODE Environment Variables Verification
 * 
 * Checks if all required environment variables are documented
 * Note: This doesn't check actual Vercel values (requires Vercel CLI or dashboard)
 */

const requiredVars = {
  supabase: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  github: [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_REDIRECT_URI',
    'GITHUB_TOKEN_ENCRYPTION_KEY'
  ],
  auth: [
    'JWT_SECRET'
  ],
  stripe: [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ],
  app: [
    'NEXT_PUBLIC_URL'
  ]
};

function verifyEnvVars() {
  console.log('🔍 BEAST MODE Environment Variables Checklist\n');
  console.log('='.repeat(60));
  
  let totalVars = 0;
  let documentedVars = 0;
  
  Object.entries(requiredVars).forEach(([category, vars]) => {
    console.log(`\n📦 ${category.toUpperCase()}`);
    vars.forEach(varName => {
      totalVars++;
      const exists = process.env[varName] !== undefined;
      if (exists) {
        console.log(`  ✅ ${varName}`);
        documentedVars++;
      } else {
        console.log(`  ⚠️  ${varName} (not set locally)`);
      }
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`  Total Required: ${totalVars}`);
  console.log(`  Set Locally: ${documentedVars}`);
  console.log(`  Missing Locally: ${totalVars - documentedVars}`);
  
  console.log('\n📋 Next Steps:');
  console.log('  1. Verify all variables are set in Vercel Dashboard');
  console.log('  2. Go to: Project → Settings → Environment Variables');
  console.log('  3. Ensure all variables are set for "Production" environment');
  console.log('  4. Use Vercel CLI to verify: vercel env ls');
  
  console.log('\n⚠️  Note: This script only checks local .env files.');
  console.log('   For production, verify in Vercel Dashboard or use: vercel env ls');
  
  console.log('\n' + '='.repeat(60));
}

verifyEnvVars();
