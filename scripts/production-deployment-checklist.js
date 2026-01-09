#!/usr/bin/env node

/**
 * BEAST MODE Production Deployment Checklist
 * 
 * Verifies all requirements are met before production deployment
 */

const fs = require('fs');
const path = require('path');

const checks = {
  migrations: {
    name: 'Database Migrations',
    status: 'pending',
    files: [
      'supabase/migrations/20250106000000_create_ml_artifacts_storage_bucket.sql',
      'supabase/migrations/20250107000000_create_quality_feedback_table.sql',
      'supabase/migrations/20250108000000_create_quality_improvement_tables.sql',
      'supabase/migrations/20250108000001_create_custom_models_table.sql'
    ],
    action: 'Apply migrations to Supabase: supabase db push'
  },
  stripe: {
    name: 'Stripe Integration',
    status: 'pending',
    check: () => {
      const stripeRoute = path.join(__dirname, '../website/app/api/stripe/create-checkout/route.ts');
      if (!fs.existsSync(stripeRoute)) return false;
      const content = fs.readFileSync(stripeRoute, 'utf8');
      // Check if Stripe code is uncommented
      return content.includes('new Stripe(') && !content.includes('// const stripe = new Stripe');
    },
    action: 'Verify STRIPE_SECRET_KEY is set in Vercel'
  },
  envVars: {
    name: 'Environment Variables',
    status: 'pending',
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GITHUB_REDIRECT_URI',
      'GITHUB_TOKEN_ENCRYPTION_KEY',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_URL'
    ],
    action: 'Set all required environment variables in Vercel project settings'
  },
  packageJson: {
    name: 'Package Dependencies',
    status: 'pending',
    check: () => {
      const packageJson = path.join(__dirname, '../website/package.json');
      if (!fs.existsSync(packageJson)) return false;
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      return pkg.dependencies && pkg.dependencies.stripe;
    },
    action: 'Run: cd website && npm install'
  }
};

function checkMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    return { status: 'error', message: 'Migrations directory not found' };
  }
  
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  return {
    status: files.length > 0 ? 'ready' : 'error',
    count: files.length,
    files: files
  };
}

function checkStripe() {
  const stripeRoute = path.join(__dirname, '../website/app/api/stripe/create-checkout/route.ts');
  if (!fs.existsSync(stripeRoute)) {
    return { status: 'error', message: 'Stripe route not found' };
  }
  
  const content = fs.readFileSync(stripeRoute, 'utf8');
  const hasStripe = content.includes('new Stripe(');
  const isCommented = content.includes('// const stripe = new Stripe');
  
  return {
    status: hasStripe && !isCommented ? 'ready' : 'warning',
    hasStripe,
    isCommented
  };
}

function checkPackageJson() {
  const packageJson = path.join(__dirname, '../website/package.json');
  if (!fs.existsSync(packageJson)) {
    return { status: 'error', message: 'package.json not found' };
  }
  
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  const hasStripe = pkg.dependencies && pkg.dependencies.stripe;
  
  return {
    status: hasStripe ? 'ready' : 'warning',
    hasStripe
  };
}

function runChecks() {
  console.log('🔍 BEAST MODE Production Deployment Checklist\n');
  console.log('=' .repeat(60));
  
  const results = {
    ready: [],
    warning: [],
    error: []
  };
  
  // Check Migrations
  console.log('\n📦 Database Migrations');
  const migrations = checkMigrations();
  if (migrations.status === 'ready') {
    console.log(`  ✅ Found ${migrations.count} migration files`);
    results.ready.push('Migrations');
  } else {
    console.log(`  ❌ ${migrations.message || 'No migrations found'}`);
    results.error.push('Migrations');
  }
  
  // Check Stripe
  console.log('\n💳 Stripe Integration');
  const stripe = checkStripe();
  if (stripe.status === 'ready') {
    console.log('  ✅ Stripe integration code is active');
    results.ready.push('Stripe Code');
  } else if (stripe.status === 'warning') {
    console.log('  ⚠️  Stripe code may be commented out');
    results.warning.push('Stripe Code');
  } else {
    console.log(`  ❌ ${stripe.message}`);
    results.error.push('Stripe Code');
  }
  
  // Check Package.json
  console.log('\n📦 Package Dependencies');
  const pkg = checkPackageJson();
  if (pkg.status === 'ready') {
    console.log('  ✅ Stripe package is installed');
    results.ready.push('Stripe Package');
  } else {
    console.log('  ⚠️  Stripe package may be missing');
    results.warning.push('Stripe Package');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`  ✅ Ready: ${results.ready.length}`);
  console.log(`  ⚠️  Warnings: ${results.warning.length}`);
  console.log(`  ❌ Errors: ${results.error.length}`);
  
  if (results.error.length === 0 && results.warning.length === 0) {
    console.log('\n🎉 All checks passed! Ready for production deployment.');
    console.log('\n📋 Next Steps:');
    console.log('  1. Apply migrations: supabase db push');
    console.log('  2. Verify environment variables in Vercel');
    console.log('  3. Test API endpoints');
    console.log('  4. Deploy: vercel --prod --yes');
  } else {
    console.log('\n⚠️  Please address the issues above before deploying.');
    if (results.warning.length > 0) {
      console.log('\n⚠️  Warnings:');
      results.warning.forEach(w => console.log(`  - ${w}`));
    }
    if (results.error.length > 0) {
      console.log('\n❌ Errors:');
      results.error.forEach(e => console.log(`  - ${e}`));
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run checks
runChecks();
