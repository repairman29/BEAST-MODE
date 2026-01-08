#!/usr/bin/env node
/**
 * Comprehensive Extension Validation
 * Tests everything we can test programmatically
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_URL = 'https://beast-mode.dev';
let errors = [];
let warnings = [];

console.log('🔍 BEAST MODE Extension Validation\n');
console.log('=' .repeat(50) + '\n');

// Test 1: Check compiled extension exists
console.log('1️⃣ Checking compiled extension...');
const outDir = path.join(__dirname, 'out');
const extensionFile = path.join(outDir, 'extension.js');

if (fs.existsSync(extensionFile)) {
  const stats = fs.statSync(extensionFile);
  console.log(`   ✅ Extension compiled (${(stats.size / 1024).toFixed(1)} KB)`);
} else {
  console.log('   ❌ Extension not compiled!');
  errors.push('Extension not compiled - run: npm run compile');
}

// Test 2: Check package.json
console.log('\n2️⃣ Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

if (packageJson.main === './out/extension.js') {
  console.log('   ✅ Main entry point correct');
} else {
  console.log('   ❌ Main entry point incorrect');
  errors.push('package.json main should be ./out/extension.js');
}

if (packageJson.activationEvents && packageJson.activationEvents.length > 0) {
  console.log(`   ✅ Activation events configured (${packageJson.activationEvents.length})`);
} else {
  console.log('   ⚠️  No activation events');
  warnings.push('Consider adding activation events');
}

if (packageJson.contributes && packageJson.contributes.commands) {
  console.log(`   ✅ Commands registered (${packageJson.contributes.commands.length})`);
} else {
  console.log('   ❌ No commands registered');
  errors.push('No commands in package.json');
}

// Test 3: Check source files
console.log('\n3️⃣ Checking source files...');
const srcDir = path.join(__dirname, 'src');
const requiredFiles = [
  'extension.ts',
  'beastModeClient.ts',
  'suggestionProvider.ts',
  'qualityHintsProvider.ts',
  'chatProvider.ts'
];

requiredFiles.forEach(file => {
  const filePath = path.join(srcDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} missing`);
    errors.push(`Missing source file: ${file}`);
  }
});

// Test 4: Check API connectivity
console.log('\n4️⃣ Testing API connectivity...');
async function testAPI() {
  try {
    // Test health endpoint
    try {
      const healthResponse = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
      console.log('   ✅ Health endpoint accessible');
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.log('   ⚠️  Health endpoint not accessible (might be OK)');
        warnings.push('API health check failed - extension may still work');
      } else {
        console.log('   ⚠️  Health endpoint returned:', error.response?.status || error.message);
      }
    }

    // Test quality API (with minimal data)
    try {
      const qualityResponse = await axios.post(
        `${API_URL}/api/repos/quality`,
        {
          repo: 'test/repo',
          features: {
            lines: 10,
            hasTests: false,
            hasComments: false,
            complexity: 5
          }
        },
        { timeout: 10000 }
      );
      
      if (qualityResponse.data && typeof qualityResponse.data.quality === 'number') {
        console.log(`   ✅ Quality API works (score: ${(qualityResponse.data.quality * 100).toFixed(1)}%)`);
      } else {
        console.log('   ⚠️  Quality API responded but format unexpected');
        warnings.push('Quality API response format may have changed');
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ⚠️  Quality API error: ${error.response.status} - ${error.response.data?.error || error.message}`);
        warnings.push('Quality API may need authentication or different parameters');
      } else {
        console.log('   ⚠️  Quality API connection failed');
        warnings.push('Quality API not accessible - check network');
      }
    }

    // Test suggestions API
    try {
      const suggestionsResponse = await axios.post(
        `${API_URL}/api/codebase/suggestions`,
        {
          repo: 'test/repo',
          filePath: 'test.ts',
          content: 'function test() {',
          cursorLine: 1,
          cursorColumn: 20
        },
        { timeout: 10000 }
      );
      
      if (suggestionsResponse.data) {
        console.log('   ✅ Suggestions API accessible');
      } else {
        console.log('   ⚠️  Suggestions API responded but no data');
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ⚠️  Suggestions API error: ${error.response.status}`);
        warnings.push('Suggestions API may need different parameters');
      } else {
        console.log('   ⚠️  Suggestions API connection failed');
        warnings.push('Suggestions API not accessible');
      }
    }
  } catch (error) {
    console.log('   ⚠️  API tests failed:', error.message);
    warnings.push('API connectivity issues - extension may still work locally');
  }
}

// Test 5: Check configuration
console.log('\n5️⃣ Checking configuration...');
if (packageJson.contributes && packageJson.contributes.configuration) {
  const config = packageJson.contributes.configuration.properties;
  if (config['beastMode.apiUrl']) {
    const defaultUrl = config['beastMode.apiUrl'].default;
    if (defaultUrl === API_URL) {
      console.log(`   ✅ API URL configured: ${defaultUrl}`);
    } else {
      console.log(`   ⚠️  API URL default: ${defaultUrl} (expected: ${API_URL})`);
      warnings.push(`API URL default is ${defaultUrl}, should be ${API_URL}`);
    }
  } else {
    console.log('   ❌ API URL configuration missing');
    errors.push('beastMode.apiUrl configuration missing');
  }
} else {
  console.log('   ❌ No configuration section');
  errors.push('No configuration in package.json');
}

// Test 6: Check keybindings
console.log('\n6️⃣ Checking keybindings...');
if (packageJson.contributes && packageJson.contributes.keybindings) {
  const keybindings = packageJson.contributes.keybindings;
  console.log(`   ✅ ${keybindings.length} keybinding(s) configured`);
  keybindings.forEach(kb => {
    console.log(`      • ${kb.command}: ${kb.mac || kb.key}`);
  });
} else {
  console.log('   ⚠️  No keybindings configured');
  warnings.push('Consider adding keybindings for better UX');
}

// Run API tests
testAPI().then(() => {
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Validation Summary\n');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Extension is ready to use.\n');
  } else {
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} Error(s):\n`);
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} Warning(s):\n`);
      warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
      console.log('');
    }
  }
  
  console.log('🚀 Next Steps:');
  console.log('   1. Reload Cursor: Cmd+Shift+P → "Developer: Reload Window"');
  console.log('   2. Open test file: vscode-extension/src/test-file.ts');
  console.log('   3. Try command: Cmd+Shift+P → "BEAST MODE: Analyze Code Quality"');
  console.log('   4. Check Output Panel: View > Output > Log (Extension Host)');
  console.log('');
  
  process.exit(errors.length > 0 ? 1 : 0);
}).catch(error => {
  console.error('\n❌ Validation failed:', error);
  process.exit(1);
});

