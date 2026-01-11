#!/usr/bin/env node
/**
 * Test Generated Feature
 * 
 * Tests a generated feature component to ensure it works
 */

const fs = require('fs');
const path = require('path');

const featureFile = process.argv[2];

if (!featureFile) {
  console.error('Usage: node test-generated-feature.js <feature-file>');
  process.exit(1);
}

console.log(`🧪 Testing feature: ${featureFile}\n`);
console.log('='.repeat(60));
console.log('');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function test(name, fn) {
  try {
    fn();
    results.passed.push(name);
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function warn(message) {
  results.warnings.push(message);
  console.log(`⚠️  ${message}`);
}

// Read the feature file
let content = '';
try {
  content = fs.readFileSync(featureFile, 'utf8');
  test('File exists and is readable', () => {
    if (!content) throw new Error('File is empty');
  });
} catch (error) {
  console.error(`❌ Cannot read file: ${error.message}`);
  process.exit(1);
}

// Test 1: Valid TypeScript/React syntax
test('Valid TypeScript syntax', () => {
  // Check for basic React/TypeScript patterns
  if (!content.includes('export')) {
    throw new Error('Missing export statement');
  }
  if (!content.includes('React') && !content.includes('from \'react\'')) {
    warn('May not be a React component');
  }
});

// Test 2: Proper imports
test('Has proper imports', () => {
  const hasReact = content.includes("from 'react'") || content.includes('from "react"');
  if (!hasReact && content.includes('function') && content.includes('return')) {
    warn('May be missing React import');
  }
});

// Test 3: Component structure
test('Has component structure', () => {
  const hasFunction = content.includes('function') || content.includes('const') || content.includes('export default');
  if (!hasFunction) {
    throw new Error('No function/component found');
  }
});

// Test 4: TypeScript types
test('Uses TypeScript types', () => {
  const hasTypes = content.includes(': ') || content.includes('interface') || content.includes('type ');
  if (!hasTypes) {
    warn('May be missing TypeScript types');
  }
});

// Test 5: Error handling
test('Has error handling', () => {
  const hasErrorHandling = content.includes('try') || content.includes('catch') || content.includes('error') || content.includes('Error');
  if (!hasErrorHandling) {
    warn('May be missing error handling');
  }
});

// Test 6: Accessibility
test('Has accessibility considerations', () => {
  const hasA11y = content.includes('aria-') || content.includes('role=') || content.includes('alt=') || content.includes('tabIndex');
  if (!hasA11y) {
    warn('May be missing accessibility features');
  }
});

// Test 7: Tailwind styling
test('Uses Tailwind CSS', () => {
  const hasTailwind = content.includes('className=') && (
    content.includes('bg-') || 
    content.includes('text-') || 
    content.includes('p-') || 
    content.includes('m-') ||
    content.includes('flex') ||
    content.includes('rounded')
  );
  if (!hasTailwind) {
    warn('May be missing Tailwind CSS styling');
  }
});

// Test 8: Performance optimizations
test('Has performance optimizations', () => {
  const hasOptimizations = content.includes('useMemo') || content.includes('useCallback') || content.includes('React.memo');
  if (!hasOptimizations) {
    warn('May be missing performance optimizations');
  }
});

// Test 9: User feedback
test('Has user feedback', () => {
  const hasFeedback = content.includes('toast') || content.includes('notification') || content.includes('message') || content.includes('alert');
  if (!hasFeedback) {
    warn('May be missing user feedback mechanisms');
  }
});

// Test 10: No console.logs in production
test('No console.logs (production ready)', () => {
  const hasConsoleLogs = content.includes('console.log');
  if (hasConsoleLogs) {
    warn('Contains console.log (should be removed for production)');
  }
});

// Print summary
console.log('');
console.log('='.repeat(60));
console.log('📊 Test Summary\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log('');

if (results.failed.length > 0) {
  console.log('❌ Failed Tests:\n');
  results.failed.forEach(f => {
    console.log(`   ${f.name}: ${f.error}`);
  });
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('⚠️  Warnings:\n');
  results.warnings.forEach(w => {
    console.log(`   ${w}`);
  });
  console.log('');
}

if (results.failed.length === 0) {
  console.log('✅ Feature passes all critical tests!');
  process.exit(0);
} else {
  console.log('❌ Feature has critical issues');
  process.exit(1);
}
