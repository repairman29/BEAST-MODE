#!/usr/bin/env node

/**
 * BEAST MODE - Fix Build Errors
 * 
 * Analyzes build errors and automatically fixes syntax issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGET_FILES = [
  'website/components/beast-mode/InterceptorDashboard.tsx',
  'website/components/beast-mode/BeastModeDashboard.tsx'
];

function fixOnClickHandlers(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let fixed = false;

  // Fix malformed onClick handlers
  const patterns = [
    [/onClick=\{\(\) = aria-label="Button" aria-label="Button">/g, 'onClick={() =>'],
    [/onClick=\{\(e\) = aria-label="Button" aria-label="Button">/g, 'onClick={(e) =>'],
    [/onClick=\{async \(\) = aria-label="Button" aria-label="Button">/g, 'onClick={async () =>'],
    [/ aria-label="Button" aria-label="Button">/g, ' aria-label="Button">'],
  ];

  patterns.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      fixed = true;
    }
  });

  if (fixed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✅ Fixed onClick handlers in ${filePath}`);
    return true;
  }

  return false;
}

function runBuild() {
  console.log('\n🔨 Running build to check for errors...\n');
  try {
    execSync('cd website && npm run build', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function fixBuildErrors() {
  console.log('\n🦾 BEAST MODE - Fixing Build Errors');
  console.log('='.repeat(70));
  console.log(`\n🎯 Target Files: ${TARGET_FILES.length}\n`);

  let filesFixed = 0;

  // Step 1: Fix known issues
  console.log('📋 Step 1: Fixing known syntax issues...\n');
  for (const filePath of TARGET_FILES) {
    if (fixOnClickHandlers(filePath)) {
      filesFixed++;
    }
  }

  // Step 2: Run build
  console.log('\n📋 Step 2: Running build...\n');
  const buildSuccess = runBuild();

  if (buildSuccess) {
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ BUILD SUCCESSFUL!\n');
    console.log(`   Fixed ${filesFixed} file(s)`);
    console.log('\n🚀 Ready to deploy!\n');
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('\n⚠️  Build still has errors\n');
    console.log('   Please check the build output above for remaining issues.\n');
  }

  return buildSuccess;
}

if (require.main === module) {
  fixBuildErrors()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('\n❌ BEAST MODE build fix failed:', error);
      process.exit(1);
    });
}
