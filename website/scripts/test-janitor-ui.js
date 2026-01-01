#!/usr/bin/env node

/**
 * Test script for Day 2 Operations UI
 * Tests all components and API routes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Day 2 Operations UI...\n');

const tests = [
  {
    name: 'Check TypeScript compilation',
    command: 'cd website && npx tsc --noEmit --skipLibCheck',
    description: 'Verify all TypeScript files compile without errors'
  },
  {
    name: 'Check component imports',
    command: 'cd website && node -e "require(\'./components/beast-mode/JanitorDashboard.tsx\')"',
    description: 'Verify all components can be imported',
    skip: true // Skip this - requires build
  },
  {
    name: 'Check API routes exist',
    command: 'test -f website/app/api/beast-mode/janitor/status/route.ts',
    description: 'Verify all API routes are created'
  }
];

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

let passed = 0;
let failed = 0;

// Test 1: Check all files exist
console.log('📁 Checking files exist...');
const allFiles = [...apiRoutes, ...components];
allFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
    passed++;
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    failed++;
  }
});

console.log('\n📡 Testing API routes...');
apiRoutes.forEach(route => {
  const fullPath = path.join(process.cwd(), route);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    // Check for basic structure
    if (content.includes('export async function') || content.includes('export function')) {
      console.log(`  ✅ ${route} - Has export function`);
      passed++;
    } else {
      console.log(`  ⚠️  ${route} - Missing export function`);
      failed++;
    }
  }
});

console.log('\n🎨 Testing components...');
components.forEach(component => {
  const fullPath = path.join(process.cwd(), component);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    // Check for React component structure
    if (content.includes('export default') || content.includes('export function')) {
      console.log(`  ✅ ${component} - Has export`);
      passed++;
    } else {
      console.log(`  ⚠️  ${component} - Missing export`);
      failed++;
    }
    
    // Check for common React patterns
    if (content.includes('useState') || content.includes('useEffect') || content.includes('React')) {
      console.log(`  ✅ ${component} - Uses React hooks`);
      passed++;
    }
  }
});

// Test TypeScript compilation
console.log('\n🔧 Testing TypeScript compilation...');
try {
  execSync('cd website && npx tsc --noEmit --skipLibCheck 2>&1', { 
    stdio: 'pipe',
    encoding: 'utf8'
  });
  console.log('  ✅ TypeScript compilation passed');
  passed++;
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  console.log('     Error:', error.stdout || error.message);
  failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed! UI is ready for testing.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}

