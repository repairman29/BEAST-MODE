#!/usr/bin/env node

/**
 * Create Release
 * Automates release creation with version bump, notes, and git tag
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function createRelease(version, options = {}) {
  const {
    type = 'patch', // patch, minor, major
    generateNotes = true,
    createTag = true,
    push = false
  } = options;

  console.log(`🚀 Creating Release v${version}`);
  console.log('============================================================\n');

  // Generate release notes
  if (generateNotes) {
    console.log('📝 Generating release notes...');
    try {
      execSync(`node scripts/automate/generate-release-notes.js ${version}`, {
        stdio: 'inherit'
      });
      console.log('   ✅ Release notes generated\n');
    } catch (error) {
      console.warn('   ⚠️  Failed to generate release notes\n');
    }
  }

  // Update version in package.json
  console.log(`📦 Updating version to ${version}...`);
  try {
    const packagePath = path.join(__dirname, '../..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('   ✅ Version updated\n');
  } catch (error) {
    console.error('   ❌ Failed to update version:', error.message);
    process.exit(1);
  }

  // Create git tag
  if (createTag) {
    console.log(`🏷️  Creating git tag v${version}...`);
    try {
      execSync(`git add package.json`, { stdio: 'pipe' });
      execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'pipe' });
      execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'pipe' });
      console.log('   ✅ Git tag created\n');
    } catch (error) {
      console.warn('   ⚠️  Failed to create git tag:', error.message);
    }
  }

  // Push if requested
  if (push) {
    console.log('📤 Pushing to remote...');
    try {
      execSync(`git push origin main`, { stdio: 'inherit' });
      execSync(`git push origin v${version}`, { stdio: 'inherit' });
      console.log('   ✅ Pushed to remote\n');
    } catch (error) {
      console.warn('   ⚠️  Failed to push:', error.message);
    }
  }

  console.log('============================================================');
  console.log('✅ Release created successfully!');
  console.log(`\n📋 Release v${version} includes:`);
  console.log(`   • Version updated in package.json`);
  if (generateNotes) {
    console.log(`   • Release notes: RELEASE_NOTES_v${version}.md`);
  }
  if (createTag) {
    console.log(`   • Git tag: v${version}`);
  }
  if (push) {
    console.log(`   • Pushed to remote`);
  }
  console.log(`\n🚀 Next Steps:`);
  console.log(`   1. Review release notes`);
  console.log(`   2. Deploy: npm run deploy:prod`);
  console.log(`   3. Announce release`);
}

// CLI
const version = process.argv[2];
const push = process.argv.includes('--push');

if (!version) {
  console.log('Usage: node scripts/automate/create-release.js <version> [--push]');
  console.log('\nExample:');
  console.log('  node scripts/automate/create-release.js 1.0.0');
  console.log('  node scripts/automate/create-release.js 1.0.0 --push');
  process.exit(1);
}

createRelease(version, { push });
