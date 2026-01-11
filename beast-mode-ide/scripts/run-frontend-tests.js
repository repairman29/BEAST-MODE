#!/usr/bin/env node
/**
 * Run Frontend UI/UX Tests
 * 
 * Comprehensive frontend testing suite
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Frontend UI/UX Tests\n');
console.log('='.repeat(60));
console.log('');

const IDE_DIR = path.join(__dirname, '..');
const results = {
  ui: { passed: 0, failed: 0 },
  ux: { passed: 0, failed: 0 },
  visual: { passed: 0, failed: 0 },
  a11y: { passed: 0, failed: 0 },
};

// Run UI tests
console.log('📱 Running UI Tests...\n');
try {
  execSync('npm run test:ui', { 
    cwd: IDE_DIR, 
    stdio: 'inherit',
    timeout: 120000 
  });
  console.log('✅ UI tests passed\n');
} catch (error) {
  console.log('❌ UI tests failed\n');
}

// Run UX tests
console.log('🎨 Running UX Tests...\n');
try {
  execSync('npm run test:ux', { 
    cwd: IDE_DIR, 
    stdio: 'inherit',
    timeout: 120000 
  });
  console.log('✅ UX tests passed\n');
} catch (error) {
  console.log('❌ UX tests failed\n');
}

// Run Visual tests
console.log('👁️  Running Visual Tests...\n');
try {
  execSync('npm run test:visual', { 
    cwd: IDE_DIR, 
    stdio: 'inherit',
    timeout: 120000 
  });
  console.log('✅ Visual tests passed\n');
} catch (error) {
  console.log('❌ Visual tests failed\n');
}

// Run Accessibility tests
console.log('♿ Running Accessibility Tests...\n');
try {
  execSync('npm run test:accessibility', { 
    cwd: IDE_DIR, 
    stdio: 'inherit',
    timeout: 120000 
  });
  console.log('✅ Accessibility tests passed\n');
} catch (error) {
  console.log('❌ Accessibility tests failed\n');
}

console.log('='.repeat(60));
console.log('📊 Frontend Test Summary\n');
console.log('✅ All frontend tests completed!');
console.log('');
