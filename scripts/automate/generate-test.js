#!/usr/bin/env node

/**
 * Auto-Generate Test Files
 * Uses BEAST MODE to generate comprehensive tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateTest(filePath, options = {}) {
  const {
    useBeastMode = false,
    testFramework = 'jest'
  } = options;

  console.log(`🧪 Generating Test for: ${filePath}`);
  console.log('============================================================\n');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, path.extname(filePath));
  const fileDir = path.dirname(filePath);
  const testFile = path.join(fileDir, `${fileName}.test${path.extname(filePath)}`);

  let testCode = '';

  if (useBeastMode) {
    try {
      console.log('   🤖 Using BEAST MODE to generate test...');
      const response = execSync(
        `curl -s -X POST http://localhost:3000/api/codebase/chat -H "Content-Type: application/json" -d '{"sessionId":"generate-test-${fileName}","message":"Generate comprehensive test file for this code using ${testFramework}. Include edge cases, error handling, and best practices:\\n\\n${fileContent.replace(/'/g, "\\'").replace(/\n/g, '\\n')}","repo":"BEAST-MODE-PRODUCT"}'`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      const result = JSON.parse(response);
      if (result.code) {
        testCode = result.code;
        console.log('   ✨ Test generated with BEAST MODE');
      } else {
        throw new Error('No code in response');
      }
    } catch (error) {
      console.warn('   ⚠️  BEAST MODE generation failed, using template');
      testCode = generateBasicTest(fileName, filePath, testFramework);
    }
  } else {
    testCode = generateBasicTest(fileName, filePath, testFramework);
  }

  fs.writeFileSync(testFile, testCode);
  console.log(`   ✅ Created: ${testFile}`);

  console.log(`\n✅ Test file generated successfully!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Review ${testFile}`);
  console.log(`   2. Add more test cases`);
  console.log(`   3. Run: npm test ${fileName}`);
}

function generateBasicTest(fileName, filePath, framework) {
  if (framework === 'jest') {
    return `import { describe, it, expect, beforeEach } from '@jest/globals';
import ${fileName} from './${path.basename(filePath)}';

describe('${fileName}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    // TODO: Add test implementation
    expect(true).toBe(true);
  });

  it('should handle errors', () => {
    // TODO: Add error handling tests
    expect(true).toBe(true);
  });
});
`;
  }
  
  return `// Test file for ${fileName}
// TODO: Add test implementation
`;
}

// CLI
const filePath = process.argv[2];
const useBeastMode = process.argv.includes('--beast-mode') || process.argv.includes('-b');

if (!filePath) {
  console.log('Usage: node scripts/automate/generate-test.js <file-path> [--beast-mode]');
  console.log('\nExample:');
  console.log('  node scripts/automate/generate-test.js website/components/UserProfile.tsx');
  console.log('  node scripts/automate/generate-test.js website/app/api/users/route.ts --beast-mode');
  process.exit(1);
}

generateTest(filePath, { useBeastMode });
