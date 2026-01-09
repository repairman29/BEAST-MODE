#!/usr/bin/env node
/**
 * Verify Production Readiness
 * 
 * Comprehensive checklist before deploying to production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying Production Readiness\n');
console.log('='.repeat(70));
console.log();

const checks = [
  {
    name: 'Build Test',
    check: () => {
      try {
        const websiteDir = path.join(__dirname, '../website');
        process.chdir(websiteDir);
        execSync('npm run build', { stdio: 'pipe', timeout: 300000 });
        return { status: 'pass', message: 'Build successful' };
      } catch (error) {
        return { status: 'fail', message: `Build failed: ${error.message.split('\n')[0]}` };
      }
    }
  },
  {
    name: 'Environment Variables',
    check: () => {
      const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
      ];
      
      const envPaths = [
        path.join(__dirname, '../echeo-landing/.env.local'),
        path.join(__dirname, '../website/.env.local'),
      ];
      
      const missing = [];
      for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf8');
          required.forEach(key => {
            if (!content.includes(key)) {
              missing.push(key);
            }
          });
          break;
        }
      }
      
      if (missing.length > 0) {
        return { status: 'fail', message: `Missing: ${missing.join(', ')}` };
      }
      return { status: 'pass', message: 'All required env vars present' };
    }
  },
  {
    name: 'Database Migrations',
    check: () => {
      const migrationsDir = path.join(__dirname, '../supabase/migrations');
      if (!fs.existsSync(migrationsDir)) {
        return { status: 'fail', message: 'Migrations directory not found' };
      }
      
      const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      if (migrations.length === 0) {
        return { status: 'warn', message: 'No migrations found' };
      }
      
      return { status: 'pass', message: `${migrations.length} migration(s) ready` };
    }
  },
  {
    name: 'API Endpoints',
    check: () => {
      const apiDir = path.join(__dirname, '../website/app/api');
      if (!fs.existsSync(apiDir)) {
        return { status: 'fail', message: 'API directory not found' };
      }
      
      const critical = [
        'repos/quality/route.ts',
        'feedback/submit/route.ts',
        'feedback/stats/route.ts',
      ];
      
      const missing = critical.filter(endpoint => {
        const endpointPath = path.join(apiDir, endpoint);
        return !fs.existsSync(endpointPath);
      });
      
      if (missing.length > 0) {
        return { status: 'fail', message: `Missing: ${missing.join(', ')}` };
      }
      
      return { status: 'pass', message: 'All critical endpoints exist' };
    }
  },
  {
    name: 'Admin Pages',
    check: () => {
      const adminDir = path.join(__dirname, '../website/app/admin');
      if (!fs.existsSync(adminDir)) {
        return { status: 'fail', message: 'Admin directory not found' };
      }
      
      const required = ['layout.tsx', 'page.tsx', 'feedback/page.tsx'];
      const missing = required.filter(page => {
        const pagePath = path.join(adminDir, page);
        return !fs.existsSync(pagePath);
      });
      
      if (missing.length > 0) {
        return { status: 'fail', message: `Missing: ${missing.join(', ')}` };
      }
      
      return { status: 'pass', message: 'All admin pages exist' };
    }
  },
  {
    name: 'Vercel Configuration',
    check: () => {
      const vercelJson = path.join(__dirname, '../website/vercel.json');
      if (!fs.existsSync(vercelJson)) {
        return { status: 'warn', message: 'vercel.json not found (optional)' };
      }
      
      return { status: 'pass', message: 'Vercel config exists' };
    }
  },
  {
    name: 'Test Files',
    check: () => {
      const testDir = path.join(__dirname, '../website/__tests__');
      if (!fs.existsSync(testDir)) {
        return { status: 'warn', message: 'No test files found' };
      }
      
      const tests = fs.readdirSync(testDir, { recursive: true })
        .filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx') || f.endsWith('.test.js'));
      
      if (tests.length === 0) {
        return { status: 'warn', message: 'No test files found' };
      }
      
      return { status: 'pass', message: `${tests.length} test file(s) found` };
    }
  }
];

let allPassed = true;
let hasErrors = false;
let warnings = 0;

checks.forEach((check, idx) => {
  const result = check.check();
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log(`${idx + 1}. ${check.name}`);
  console.log(`   ${color}${icon}${reset} ${result.message}`);
  console.log();
  
  if (result.status === 'fail') {
    allPassed = false;
    hasErrors = true;
  } else if (result.status === 'warn') {
    warnings++;
  }
});

console.log('='.repeat(70));
console.log('📋 Summary:');
console.log('='.repeat(70));
console.log();

if (allPassed && !hasErrors) {
  console.log('✅ All checks passed! Ready for production deployment.');
  console.log();
  console.log('🚀 Next Steps:');
  console.log('   1. Apply migrations: node scripts/apply-all-migrations.js');
  console.log('   2. Deploy to Vercel: cd website && vercel --prod --yes');
  console.log();
} else {
  if (hasErrors) {
    console.log('❌ Critical issues found - fix before deploying!');
  } else {
    console.log(`⚠️  ${warnings} warning(s) found - review before deploying.`);
  }
  console.log();
  process.exit(hasErrors ? 1 : 0);
}
