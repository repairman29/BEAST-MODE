#!/usr/bin/env node
/**
 * Prepare Production Deployment
 * 
 * High Priority: Get real users to generate feedback
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Production Deployment\n');
console.log('='.repeat(70));
console.log();

const checklist = [
  {
    name: 'Database Migrations',
    check: () => {
      const migrationsDir = path.join(__dirname, '../supabase/migrations');
      if (!fs.existsSync(migrationsDir)) {
        return { status: 'error', message: 'Migrations directory not found' };
      }
      const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      return {
        status: migrations.length > 0 ? 'pass' : 'warn',
        message: `${migrations.length} migration(s) found`,
        action: migrations.length === 0 ? 'Create database migrations' : null
      };
    }
  },
  {
    name: 'Environment Variables',
    check: () => {
      const envExample = path.join(__dirname, '../website/.env.example');
      const envLocal = path.join(__dirname, '../website/.env.local');
      const hasExample = fs.existsSync(envExample);
      const hasLocal = fs.existsSync(envLocal);
      
      if (!hasExample) {
        return { status: 'warn', message: '.env.example not found' };
      }
      
      return {
        status: hasLocal ? 'pass' : 'warn',
        message: hasLocal ? '.env.local exists' : '.env.local not found (expected in production)',
        action: !hasLocal ? 'Set up environment variables in Vercel' : null
      };
    }
  },
  {
    name: 'Supabase Configuration',
    check: () => {
      const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
      const envPath = path.join(__dirname, '../echeo-landing/.env.local');
      
      if (!fs.existsSync(envPath)) {
        return { status: 'warn', message: 'Cannot check .env.local' };
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const missing = required.filter(key => !envContent.includes(key));
      
      return {
        status: missing.length === 0 ? 'pass' : 'error',
        message: missing.length === 0 
          ? 'All Supabase vars present' 
          : `Missing: ${missing.join(', ')}`,
        action: missing.length > 0 ? 'Add missing environment variables' : null
      };
    }
  },
  {
    name: 'Build Test',
    check: () => {
      const buildDir = path.join(__dirname, '../website/.next');
      return {
        status: fs.existsSync(buildDir) ? 'pass' : 'warn',
        message: fs.existsSync(buildDir) ? 'Build directory exists' : 'Run: npm run build',
        action: !fs.existsSync(buildDir) ? 'Run: cd website && npm run build' : null
      };
    }
  },
  {
    name: 'API Endpoints',
    check: () => {
      const apiDir = path.join(__dirname, '../website/app/api');
      if (!fs.existsSync(apiDir)) {
        return { status: 'error', message: 'API directory not found' };
      }
      
      const criticalEndpoints = [
        'repos/quality/route.ts',
        'feedback/submit/route.ts',
        'feedback/stats/route.ts',
      ];
      
      const missing = criticalEndpoints.filter(endpoint => {
        const endpointPath = path.join(apiDir, endpoint);
        return !fs.existsSync(endpointPath);
      });
      
      return {
        status: missing.length === 0 ? 'pass' : 'error',
        message: missing.length === 0 
          ? 'All critical endpoints exist' 
          : `Missing: ${missing.join(', ')}`,
        action: missing.length > 0 ? 'Create missing API endpoints' : null
      };
    }
  },
  {
    name: 'Admin Pages',
    check: () => {
      const adminDir = path.join(__dirname, '../website/app/admin');
      if (!fs.existsSync(adminDir)) {
        return { status: 'error', message: 'Admin directory not found' };
      }
      
      const requiredPages = ['layout.tsx', 'page.tsx', 'plg-usage/page.tsx', 'feedback/page.tsx'];
      const missing = requiredPages.filter(page => {
        const pagePath = path.join(adminDir, page);
        return !fs.existsSync(pagePath);
      });
      
      return {
        status: missing.length === 0 ? 'pass' : 'error',
        message: missing.length === 0 
          ? 'All admin pages exist' 
          : `Missing: ${missing.join(', ')}`,
        action: missing.length > 0 ? 'Create missing admin pages' : null
      };
    }
  }
];

let allPassed = true;
let hasErrors = false;

checklist.forEach((item, idx) => {
  const result = item.check();
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  
  console.log(`${idx + 1}. ${item.name}`);
  console.log(`   ${icon} ${result.message}`);
  
  if (result.action) {
    console.log(`   💡 Action: ${result.action}`);
    allPassed = false;
  }
  
  if (result.status === 'error') {
    hasErrors = true;
  }
  
  console.log();
});

console.log('='.repeat(70));
console.log('📋 Summary:');
console.log('='.repeat(70));
console.log();

if (allPassed && !hasErrors) {
  console.log('✅ All checks passed! Ready for production deployment.');
  console.log();
  console.log('🚀 Next Steps:');
  console.log('   1. Apply database migrations: node scripts/setup-ux-plg-db-via-exec-sql.js');
  console.log('   2. Test build: cd website && npm run build');
  console.log('   3. Deploy: cd website && vercel --prod --yes');
  console.log();
} else {
  console.log('⚠️  Some checks need attention before deployment.');
  console.log();
  if (hasErrors) {
    console.log('❌ Critical issues found - fix before deploying!');
  } else {
    console.log('⚠️  Warnings found - review before deploying.');
  }
  console.log();
}
