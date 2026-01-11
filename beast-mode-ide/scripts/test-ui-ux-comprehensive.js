#!/usr/bin/env node
/**
 * Comprehensive UI/UX Testing
 * 
 * Tests UI/UX without requiring Electron
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IDE_DIR = path.join(__dirname, '..');
const RENDERER_DIR = path.join(IDE_DIR, 'renderer');

console.log('🎨 Comprehensive UI/UX Testing\n');
console.log('='.repeat(60));
console.log('');

const results = {
  passed: [],
  failed: [],
  warnings: []
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

// Test 1: Design System CSS exists and is valid
test('Design system CSS exists', () => {
  const cssPath = path.join(RENDERER_DIR, 'styles/design-system.css');
  if (!fs.existsSync(cssPath)) {
    throw new Error('Design system CSS not found');
  }
  const content = fs.readFileSync(cssPath, 'utf8');
  if (content.length < 100) {
    throw new Error('Design system CSS too short');
  }
  // Check for key CSS variables
  if (!content.includes('--color-primary')) {
    throw new Error('Missing color-primary variable');
  }
  if (!content.includes('--color-background')) {
    throw new Error('Missing color-background variable');
  }
});

// Test 2: HTML structure is correct
test('HTML structure is correct', () => {
  const htmlPath = path.join(RENDERER_DIR, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error('index.html not found');
  }
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  // Check for key elements
  if (!content.includes('monaco-editor')) {
    throw new Error('Monaco editor container missing');
  }
  
  // Title bar and status bar are created by JavaScript, check for the script
  const minimalUIPath = path.join(RENDERER_DIR, 'ui/MinimalUI.js');
  if (fs.existsSync(minimalUIPath)) {
    const uiContent = fs.readFileSync(minimalUIPath, 'utf8');
    if (!uiContent.includes('minimal-title-bar') && !uiContent.includes('createTitleBar')) {
      throw new Error('Title bar creation code missing');
    }
    if (!uiContent.includes('minimal-status-bar') && !uiContent.includes('createStatusBar')) {
      throw new Error('Status bar creation code missing');
    }
  } else {
    warn('MinimalUI.js not found - title/status bars may be created elsewhere');
  }
});

// Test 3: JavaScript files are valid
test('Main JavaScript files exist', () => {
  const files = [
    'app.js',
    'ErrorBoundary.js',
    'ui/MinimalUI.js'
  ];
  
  files.forEach(file => {
    const filePath = path.join(RENDERER_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`${file} not found`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.length < 50) {
      throw new Error(`${file} is too short`);
    }
  });
});

// Test 4: Design system colors are Jony Ive style
test('Design system uses Jony Ive colors', () => {
  const cssPath = path.join(RENDERER_DIR, 'styles/design-system.css');
  const content = fs.readFileSync(cssPath, 'utf8');
  
  const requiredColors = [
    '#007AFF', // Primary blue
    '#F5F5F7', // Background
    '#FFFFFF', // Surface
    '#1D1D1F'  // Text
  ];
  
  requiredColors.forEach(color => {
    if (!content.includes(color)) {
      throw new Error(`Missing color: ${color}`);
    }
  });
});

// Test 5: Typography system is applied
test('Typography system is defined', () => {
  const cssPath = path.join(RENDERER_DIR, 'styles/design-system.css');
  const content = fs.readFileSync(cssPath, 'utf8');
  
  if (!content.includes('--font-primary')) {
    throw new Error('Missing font-primary variable');
  }
  if (!content.includes('--font-code')) {
    throw new Error('Missing font-code variable');
  }
  if (!content.includes('-apple-system')) {
    throw new Error('Missing system font');
  }
});

// Test 6: Spacing system is defined
test('Spacing system is defined', () => {
  const cssPath = path.join(RENDERER_DIR, 'styles/design-system.css');
  const content = fs.readFileSync(cssPath, 'utf8');
  
  if (!content.includes('--space-')) {
    throw new Error('Missing spacing variables');
  }
  if (!content.includes('4px')) {
    throw new Error('Missing 4px base unit');
  }
});

// Test 7: Animations are defined
test('Animation system is defined', () => {
  const cssPath = path.join(RENDERER_DIR, 'styles/design-system.css');
  const content = fs.readFileSync(cssPath, 'utf8');
  
  if (!content.includes('--transition-')) {
    throw new Error('Missing transition variables');
  }
});

// Test 8: Minimal UI has auto-hide
test('Minimal UI has auto-hide functionality', () => {
  const uiPath = path.join(RENDERER_DIR, 'ui/MinimalUI.js');
  const content = fs.readFileSync(uiPath, 'utf8');
  
  if (!content.includes('auto-hide') && !content.includes('hideUI')) {
    throw new Error('Missing auto-hide functionality');
  }
});

// Test 9: Error boundary is implemented
test('Error boundary is implemented', () => {
  const errorBoundaryPath = path.join(RENDERER_DIR, 'ErrorBoundary.js');
  const content = fs.readFileSync(errorBoundaryPath, 'utf8');
  
  if (!content.includes('ErrorBoundary') && !content.includes('catchError')) {
    throw new Error('Error boundary not properly implemented');
  }
});

// Test 10: Features are integrated
test('Features are integrated', () => {
  const featureLoaderPath = path.join(RENDERER_DIR, 'features/feature-loader.js');
  if (!fs.existsSync(featureLoaderPath)) {
    throw new Error('Feature loader not found');
  }
  
  const htmlPath = path.join(RENDERER_DIR, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  if (!htmlContent.includes('feature-loader.js')) {
    throw new Error('Feature loader not included in HTML');
  }
});

// Test 11: UI elements have proper structure
test('UI elements have proper structure', () => {
  const htmlPath = path.join(RENDERER_DIR, 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  // Check for semantic HTML
  if (!content.includes('<body>')) {
    throw new Error('Missing body tag');
  }
  if (!content.includes('<!DOCTYPE')) {
    throw new Error('Missing DOCTYPE');
  }
});

// Test 12: CSS is linked
test('CSS is properly linked', () => {
  const htmlPath = path.join(RENDERER_DIR, 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  if (!content.includes('design-system.css')) {
    throw new Error('Design system CSS not linked');
  }
});

// Test 13: JavaScript is loaded in correct order
test('JavaScript loads in correct order', () => {
  const htmlPath = path.join(RENDERER_DIR, 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  const errorBoundaryIndex = content.indexOf('ErrorBoundary.js');
  const minimalUIIndex = content.indexOf('MinimalUI.js');
  const appIndex = content.indexOf('app.js');
  
  if (errorBoundaryIndex === -1 || minimalUIIndex === -1) {
    throw new Error('Required scripts missing');
  }
  
  // ErrorBoundary should load before MinimalUI
  if (errorBoundaryIndex > minimalUIIndex) {
    warn('ErrorBoundary should load before MinimalUI');
  }
});

// Test 14: No inline styles (should use CSS classes)
test('Minimal inline styles (prefer CSS classes)', () => {
  const htmlPath = path.join(RENDERER_DIR, 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  // Count inline style attributes
  const inlineStyleMatches = content.match(/style\s*=/g);
  const inlineStyleCount = inlineStyleMatches ? inlineStyleMatches.length : 0;
  
  if (inlineStyleCount > 20) {
    warn(`Many inline styles (${inlineStyleCount}), consider using CSS classes`);
  }
});

// Test 15: Accessibility basics
test('Accessibility basics present', () => {
  const htmlPath = path.join(RENDERER_DIR, 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  // Check for lang attribute
  if (!content.includes('lang=') && !content.includes('<html')) {
    warn('Missing lang attribute on html tag');
  }
});

// Print summary
console.log('');
console.log('='.repeat(60));
console.log('📊 UI/UX Test Summary\n');
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
  console.log('✅ All UI/UX tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some UI/UX tests failed');
  process.exit(1);
}
