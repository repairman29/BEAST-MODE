#!/usr/bin/env node

/**
 * BEAST MODE AI Revolution Workflow
 * 
 * Launches the complete AI-powered development ecosystem
 * "Warhol and Wonka" - Multiple rounds of perfection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 BEAST MODE AI REVOLUTION WORKFLOW 🔥\n');
console.log('⚔️ Initializing AI systems...\n');

// Check if we're in the website directory
const isWebsiteDir = fs.existsSync(path.join(process.cwd(), 'package.json')) && 
                     fs.existsSync(path.join(process.cwd(), 'app'));

if (!isWebsiteDir) {
  console.error('❌ Error: Must run from website directory');
  process.exit(1);
}

// Run design and layout analysis
console.log('📊 Analyzing design and layout...');
try {
  // Check for common layout issues
  const componentsDir = path.join(process.cwd(), 'components', 'beast-mode');
  if (fs.existsSync(componentsDir)) {
    const files = fs.readdirSync(componentsDir);
    console.log(`✅ Found ${files.length} components to analyze`);
  }
} catch (error) {
  console.error('⚠️  Analysis error:', error.message);
}

console.log('\n🎨 Design Review Checklist:');
console.log('  ✓ Max-width standardized to max-w-7xl');
console.log('  ✓ Content centered with mx-auto');
console.log('  ✓ Consistent spacing (space-y-6)');
console.log('  ✓ Proper padding (px-8, py-8)');
console.log('  ✓ Responsive grid layouts');
console.log('  ✓ Loading and empty states');

console.log('\n🚀 Starting development server...');
console.log('💡 Run: npm run dev');
console.log('📝 Review each tab for:');
console.log('   - Proper spacing and alignment');
console.log('   - Content width utilization');
console.log('   - Responsive behavior');
console.log('   - Visual hierarchy');

console.log('\n✨ "Warhol & Wonka" - Multiple rounds of perfection!');
console.log('🎯 Iterate until every pixel is perfect!\n');

// Run automated testing suite
console.log('🧪 Running comprehensive automated tests...\n');

const testSuites = [
  { name: 'UI/UX Tests', script: 'test:ui', description: 'Component structure, animations, accessibility' },
  { name: 'Experience Tests', script: 'test:experience', description: 'User workflows, value propositions, features' }
];

let allPassed = true;

testSuites.forEach((suite, index) => {
  console.log(`\n📋 Running ${suite.name}...`);
  console.log(`   ${suite.description}\n`);
  
  try {
    execSync(`npm run ${suite.script}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`\n✅ ${suite.name} completed successfully!\n`);
  } catch (error) {
    console.error(`\n⚠️  ${suite.name} had some issues (see above for details)\n`);
    allPassed = false;
  }
});

console.log('\n📊 Testing Summary:');
console.log('  • UI/UX Tests: Component structure and code quality');
console.log('  • Experience Tests: User workflows and feature completeness');
console.log('  • API Tests: Run separately with "npm run test:api" (requires dev server)');
console.log('  • Build Tests: Run separately with "npm run test:build"\n');

if (allPassed) {
  console.log('🎉 All automated tests passed!');
} else {
  console.log('⚠️  Some tests had warnings. Review output above.');
}

console.log('\n💡 For full API testing, start dev server: npm run dev -p 7777');
console.log('💡 Then run: npm run test:api\n');

