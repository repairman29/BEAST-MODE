#!/usr/bin/env node

/**
 * Production Deployment Verification
 * 
 * Verifies all production deployment requirements are met
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const { createLogger } = require('../lib/utils/logger');
const log = createLogger('ProductionDeployment');

async function verifyProductionDeployment() {
  console.log('\n🚀 Production Deployment Verification\n');
  console.log('='.repeat(60));
  
  const checks = {
    envVars: false,
    stripeIntegration: false,
    githubApp: false,
    supabase: false,
    monitoring: false,
    apiEndpoints: false
  };

  // Check 1: Environment Variables
  console.log('\n1️⃣  Checking Environment Variables...\n');
  
  const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase URL',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase Service Role Key',
    'STRIPE_SECRET_KEY': 'Stripe Secret Key',
    'STRIPE_WEBHOOK_SECRET': 'Stripe Webhook Secret',
    'GITHUB_APP_ID': 'GitHub App ID',
    'GITHUB_APP_PRIVATE_KEY': 'GitHub App Private Key',
    'GITHUB_APP_WEBHOOK_SECRET': 'GitHub App Webhook Secret',
    'NEXT_PUBLIC_APP_URL': 'App URL'
  };

  const optionalEnvVars = {
    'SENTRY_DSN': 'Sentry DSN (optional)',
    'REDIS_URL': 'Redis URL (optional)',
    'UPSTASH_REDIS_REST_URL': 'Upstash Redis URL (optional)'
  };

  let envVarsMissing = [];
  let envVarsPresent = [];

  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    if (value) {
      const preview = key.includes('KEY') || key.includes('SECRET') || key.includes('PRIVATE')
        ? `${value.substring(0, 8)}...`
        : value;
      console.log(`   ✅ ${key}: ${preview}`);
      envVarsPresent.push(key);
    } else {
      console.log(`   ❌ ${key}: Missing (${description})`);
      envVarsMissing.push(key);
    }
  }

  console.log('\n   Optional Environment Variables:');
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    const value = process.env[key];
    if (value) {
      console.log(`   ✅ ${key}: Set`);
    } else {
      console.log(`   ⚠️  ${key}: Not set (${description})`);
    }
  }

  checks.envVars = envVarsMissing.length === 0;

  // Check 2: Stripe Integration
  console.log('\n2️⃣  Checking Stripe Integration...\n');
  
  const stripeFiles = [
    'website/app/api/stripe/create-checkout/route.ts',
    'website/app/api/stripe/webhook/route.ts',
    'website/app/api/user/subscription/route.ts'
  ];

  let stripeFilesExist = true;
  for (const file of stripeFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file}: Missing`);
      stripeFilesExist = false;
    }
  }

  // Check if Stripe code is commented out
  if (stripeFilesExist) {
    const checkoutRoute = fs.readFileSync(
      path.join(__dirname, '..', 'website/app/api/stripe/create-checkout/route.ts'),
      'utf8'
    );
    const hasCommentedCode = checkoutRoute.includes('// TODO:') || 
                              checkoutRoute.includes('// Uncomment') ||
                              checkoutRoute.includes('/* STRIPE');
    
    if (hasCommentedCode) {
      console.log(`   ⚠️  Stripe code may be commented out - check create-checkout/route.ts`);
    } else {
      console.log(`   ✅ Stripe code appears active`);
    }
  }

  checks.stripeIntegration = stripeFilesExist;

  // Check 3: GitHub App
  console.log('\n3️⃣  Checking GitHub App Setup...\n');
  
  const githubAppId = process.env.GITHUB_APP_ID;
  const githubAppKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const githubWebhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

  if (githubAppId && githubAppKey && githubWebhookSecret) {
    console.log(`   ✅ GitHub App ID: ${githubAppId}`);
    console.log(`   ✅ Private Key: ${githubAppKey.length} chars`);
    console.log(`   ✅ Webhook Secret: Set`);
    
    // Check webhook route
    const webhookRoute = path.join(__dirname, '..', 'website/app/api/github/webhook/route.ts');
    if (fs.existsSync(webhookRoute)) {
      console.log(`   ✅ Webhook route exists`);
    } else {
      console.log(`   ❌ Webhook route missing`);
    }
    
    checks.githubApp = true;
  } else {
    console.log(`   ❌ GitHub App credentials incomplete`);
    checks.githubApp = false;
  }

  // Check 4: Supabase
  console.log('\n4️⃣  Checking Supabase Setup...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log(`   ✅ Supabase URL: ${supabaseUrl}`);
    console.log(`   ✅ Service Role Key: Set`);
    
    // Check migrations
    const migrationsDir = path.join(__dirname, '..', 'supabase/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      console.log(`   ✅ Migrations: ${migrations.length} found`);
    } else {
      console.log(`   ⚠️  Migrations directory not found`);
    }
    
    checks.supabase = true;
  } else {
    console.log(`   ❌ Supabase credentials incomplete`);
    checks.supabase = false;
  }

  // Check 5: Monitoring
  console.log('\n5️⃣  Checking Monitoring Setup...\n');
  
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    console.log(`   ✅ Sentry DSN: Set`);
  } else {
    console.log(`   ⚠️  Sentry DSN: Not set (optional but recommended)`);
  }

  // Check for monitoring dashboard
  const monitoringPage = path.join(__dirname, '..', 'website/app/monitoring/page.tsx');
  if (fs.existsSync(monitoringPage)) {
    console.log(`   ✅ Monitoring dashboard exists`);
  } else {
    console.log(`   ⚠️  Monitoring dashboard not found`);
  }

  checks.monitoring = true; // Not blocking

  // Check 6: API Endpoints
  console.log('\n6️⃣  Checking API Endpoints...\n');
  
  const apiEndpoints = [
    'website/app/api/github/webhook/route.ts',
    'website/app/api/stripe/webhook/route.ts',
    'website/app/api/repos/quality/route.ts',
    'website/app/api/user/subscription/route.ts'
  ];

  let endpointsExist = true;
  for (const endpoint of apiEndpoints) {
    const endpointPath = path.join(__dirname, '..', endpoint);
    if (fs.existsSync(endpointPath)) {
      console.log(`   ✅ ${endpoint.split('/').pop()}`);
    } else {
      console.log(`   ❌ ${endpoint.split('/').pop()}: Missing`);
      endpointsExist = false;
    }
  }

  checks.apiEndpoints = endpointsExist;

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Verification Summary:\n');
  
  const allChecks = Object.values(checks);
  const passed = allChecks.filter(Boolean).length;
  const total = allChecks.length;
  
  Object.entries(checks).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    const name = check.replace(/([A-Z])/g, ' $1').trim();
    console.log(`   ${icon} ${name}`);
  });

  console.log(`\n   Result: ${passed}/${total} checks passed\n`);

  if (passed === total) {
    console.log('✅ Production deployment is ready!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Deploy to Vercel: vercel --prod --yes');
    console.log('   2. Configure Stripe webhook in Stripe dashboard');
    console.log('   3. Verify GitHub App webhook URL in GitHub');
    console.log('   4. Test end-to-end flow');
    console.log('   5. Monitor error logs\n');
  } else {
    console.log('⚠️  Production deployment needs attention');
    console.log('\n📋 To complete setup:');
    if (!checks.envVars) {
      console.log('   1. Set missing environment variables in .env.local');
      console.log('   2. Add to Vercel environment variables');
    }
    if (!checks.stripeIntegration) {
      console.log('   3. Verify Stripe integration files exist');
      console.log('   4. Uncomment Stripe code if needed');
    }
    if (!checks.githubApp) {
      console.log('   5. Complete GitHub App setup');
    }
    if (!checks.supabase) {
      console.log('   6. Configure Supabase credentials');
    }
    console.log('');
  }

  return passed === total;
}

if (require.main === module) {
  verifyProductionDeployment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyProductionDeployment };
