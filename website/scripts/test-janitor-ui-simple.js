#!/usr/bin/env node

/**
 * Simple test script for Day 2 Operations UI
 * Tests file structure and basic functionality without TypeScript
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Day 2 Operations UI (Simple)...\n');

let passed = 0;
let failed = 0;
const errors = [];

// Test 1: All components exist
console.log('📁 Checking components exist...');
const components = [
  'website/components/beast-mode/JanitorDashboard.tsx',
  'website/components/beast-mode/JanitorConfigModal.tsx',
  'website/components/beast-mode/VibeOpsTestCreator.tsx',
  'website/components/beast-mode/RefactoringHistory.tsx',
  'website/components/beast-mode/ArchitectureRulesView.tsx',
  'website/components/beast-mode/RepoMemoryGraph.tsx',
  'website/components/beast-mode/VibeRestorationHistory.tsx',
  'website/components/beast-mode/InvisibleCICDLogs.tsx'
];

components.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('export default') || content.includes('export function')) {
      console.log(`  ✅ ${file}`);
      passed++;
    } else {
      console.log(`  ⚠️  ${file} - Missing export`);
      failed++;
      errors.push(`${file}: Missing export`);
    }
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    failed++;
    errors.push(`${file}: File not found`);
  }
});

// Test 2: All API routes exist
console.log('\n📡 Checking API routes exist...');
const apiRoutes = [
  'website/app/api/beast-mode/janitor/status/route.ts',
  'website/app/api/beast-mode/janitor/[feature]/route.ts',
  'website/app/api/beast-mode/janitor/refactor/route.ts',
  'website/app/api/beast-mode/janitor/refactoring/history/route.ts',
  'website/app/api/beast-mode/janitor/architecture/rules/route.ts',
  'website/app/api/beast-mode/janitor/architecture/rules/[ruleId]/route.ts',
  'website/app/api/beast-mode/janitor/vibe-ops/create-test/route.ts',
  'website/app/api/beast-mode/janitor/repo-memory/graph/route.ts',
  'website/app/api/beast-mode/janitor/vibe-restoration/history/route.ts',
  'website/app/api/beast-mode/janitor/vibe-restoration/restore/[stateId]/route.ts',
  'website/app/api/beast-mode/janitor/invisible-cicd/logs/route.ts'
];

apiRoutes.forEach(route => {
  const fullPath = path.join(process.cwd(), route);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('export async function') || content.includes('export function')) {
      console.log(`  ✅ ${route}`);
      passed++;
    } else {
      console.log(`  ⚠️  ${route} - Missing export`);
      failed++;
      errors.push(`${route}: Missing export function`);
    }
  } else {
    console.log(`  ❌ ${route} - MISSING`);
    failed++;
    errors.push(`${route}: File not found`);
  }
});

// Test 3: Check for common React patterns
console.log('\n⚛️  Checking React patterns...');
components.forEach(component => {
  const fullPath = path.join(process.cwd(), component);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const checks = {
      'useState or useEffect': content.includes('useState') || content.includes('useEffect'),
      'React import or "use client"': content.includes('import React') || content.includes('"use client"'),
      'JSX return': content.includes('return (') || content.includes('return <')
    };
    
    Object.entries(checks).forEach(([check, result]) => {
      if (result) {
        passed++;
      } else {
        failed++;
        errors.push(`${component}: Missing ${check}`);
      }
    });
  }
});

// Test 4: Check API route patterns
console.log('\n🔌 Checking API route patterns...');
apiRoutes.forEach(route => {
  const fullPath = path.join(process.cwd(), route);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const checks = {
      'NextRequest/NextResponse': content.includes('NextRequest') || content.includes('NextResponse'),
      'GET or POST export': content.includes('export async function GET') || content.includes('export async function POST')
    };
    
    Object.entries(checks).forEach(([check, result]) => {
      if (result) {
        passed++;
      } else {
        failed++;
        errors.push(`${route}: Missing ${check}`);
      }
    });
  }
});

// Test 5: Check for Supabase integration
console.log('\n💾 Checking Supabase integration...');
const supabaseRoutes = [
  'website/app/api/beast-mode/janitor/refactoring/history/route.ts',
  'website/app/api/beast-mode/janitor/architecture/rules/route.ts',
  'website/app/api/beast-mode/janitor/vibe-restoration/history/route.ts'
];

supabaseRoutes.forEach(route => {
  const fullPath = path.join(process.cwd(), route);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('getSupabaseClientOrNull') || content.includes('supabase')) {
      console.log(`  ✅ ${route} - Has Supabase integration`);
      passed++;
    } else {
      console.log(`  ⚠️  ${route} - Missing Supabase integration`);
      // Not a failure, just a note
    }
  }
});

// Test 6: Check database migration exists
console.log('\n🗄️  Checking database migration...');
const migrationFile = 'website/supabase/migrations/20250101000006_create_janitor_tables.sql';
const migrationPath = path.join(process.cwd(), migrationFile);
if (fs.existsSync(migrationPath)) {
  const content = fs.readFileSync(migrationPath, 'utf8');
  const tables = [
    'janitor_features',
    'architecture_rules',
    'refactoring_runs',
    'vibe_restoration_states',
    'repo_memory_graph',
    'vibe_ops_tests'
  ];
  
  tables.forEach(table => {
    if (content.includes(`CREATE TABLE.*${table}`) || content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`  ✅ Table ${table} defined`);
      passed++;
    } else {
      console.log(`  ⚠️  Table ${table} not found`);
      failed++;
      errors.push(`Migration: Table ${table} not found`);
    }
  });
} else {
  console.log(`  ⚠️  Migration file not found`);
  failed++;
  errors.push('Migration file not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (errors.length > 0) {
  console.log('\n⚠️  Errors found:');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (failed === 0) {
  console.log('\n🎉 All tests passed! UI is ready for testing.');
  console.log('\n📝 Next steps:');
  console.log('  1. Start dev server: cd website && npm run dev');
  console.log('  2. Navigate to: http://localhost:3001/dashboard?view=janitor');
  console.log('  3. Test each feature: Enable/disable, configure, view history');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}

