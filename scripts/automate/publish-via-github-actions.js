#!/usr/bin/env node

/**
 * Alternative: Publish via GitHub Actions
 * Sets up automatic publishing without needing Azure PAT locally
 */

const fs = require('fs');
const path = require('path');

const GITHUB_WORKFLOW = `name: Publish VS Code Extension

on:
  release:
    types: [created]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd beast-mode-extension
          npm ci
      
      - name: Compile extension
        run: |
          cd beast-mode-extension
          npm run compile
      
      - name: Publish to VS Code Marketplace
        uses: HaaLeo/publish-vscode-extension@v1
        with:
          pat: \${{ secrets.VSCODE_MARKETPLACE_TOKEN }}
          extensionFile: 'beast-mode-extension/beast-mode-extension-*.vsix'
`;

console.log('📋 Alternative: Publish via GitHub Actions');
console.log('============================================================\n');

console.log('This method avoids needing Azure PAT locally.\n');

console.log('Setup Steps:');
console.log('1. Get Azure PAT (one time):');
console.log('   → https://dev.azure.com/_usersSettings/tokens');
console.log('   → Create token with "Marketplace (Manage)" scope\n');

console.log('2. Add to GitHub Secrets:');
console.log('   → Go to: https://github.com/repairman29/BEAST-MODE/settings/secrets/actions');
console.log('   → Click "New repository secret"');
console.log('   → Name: VSCODE_MARKETPLACE_TOKEN');
console.log('   → Value: (paste your Azure PAT)');
console.log('   → Click "Add secret"\n');

console.log('3. Create GitHub Actions workflow:');
const workflowPath = path.join(__dirname, '../..', '.github/workflows/publish-extension.yml');
fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
fs.writeFileSync(workflowPath, GITHUB_WORKFLOW);
console.log(`   ✅ Created: ${workflowPath}\n`);

console.log('4. Publish:');
console.log('   → Create a GitHub release');
console.log('   → Or: Go to Actions → Publish VS Code Extension → Run workflow\n');

console.log('✅ GitHub Actions workflow created!');
console.log('\n💡 This way you only need the PAT once (for GitHub secret)');
console.log('   Then publishing happens automatically via GitHub Actions.\n');
