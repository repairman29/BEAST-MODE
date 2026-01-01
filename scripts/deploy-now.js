#!/usr/bin/env node
/**
 * Automated Vercel Deployment Script
 * Handles git commit, push, and Vercel deployment
 */

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WEBSITE_DIR = path.join(PROJECT_ROOT, 'website');

function runCommand(cmd, cwd = PROJECT_ROOT) {
  console.log(`\n▶️  Running: ${cmd}`);
  try {
    const output = execSync(cmd, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return { success: true, output };
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

console.log('🚀 Starting Vercel Deployment Process...\n');

// Step 1: Git add
console.log('📦 Staging changes...');
runCommand('git add -A');

// Step 2: Git commit
console.log('\n💾 Committing changes...');
const commitMsg = process.argv[2] || 'fix: Move TypeScript to dependencies and add deployment automation';
runCommand(`git commit -m "${commitMsg}"`);

// Step 3: Git push
console.log('\n📤 Pushing to origin/main...');
runCommand('git push origin main');

// Step 4: Deploy to Vercel
console.log('\n🌐 Deploying to Vercel...');
runCommand('vercel --prod --yes', WEBSITE_DIR);

console.log('\n✅ Deployment complete!');

