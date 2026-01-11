#!/usr/bin/env node

/**
 * Auto-Generate API Route Boilerplate
 * Uses BEAST MODE to generate Next.js API routes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_TEMPLATE = `import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * {{METHOD}} /api/{{ROUTE_NAME}}
 * {{DESCRIPTION}}
 */
export async function {{METHOD}}(request: NextRequest) {
  try {
    // TODO: Implement {{ROUTE_NAME}} logic
    
    return NextResponse.json({
      success: true,
      message: '{{ROUTE_NAME}} endpoint',
      data: {}
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in {{ROUTE_NAME}}:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
`;

const TEST_TEMPLATE = `import { describe, it, expect } from '@jest/globals';

describe('{{ROUTE_NAME}} API', () => {
  it('should handle {{METHOD}} requests', async () => {
    // TODO: Add test implementation
    expect(true).toBe(true);
  });
});
`;

function generateAPI(routeName, options = {}) {
  const { 
    method = 'GET',
    description = `API endpoint for ${routeName}`,
    directory = 'website/app/api',
    generateTest = true,
    useBeastMode = false
  } = options;

  console.log(`🚀 Generating API Route: ${routeName}`);
  console.log('============================================================\n');

  // Validate route name
  if (!routeName || !/^[a-z][a-z0-9-]*$/.test(routeName)) {
    console.error('❌ Invalid route name. Must be lowercase with hyphens.');
    process.exit(1);
  }

  const routeDir = path.join(__dirname, '../..', directory, routeName);
  const routeFile = path.join(routeDir, 'route.ts');
  const testFile = path.join(routeDir, `${routeName}.test.ts`);

  // Create directory
  fs.mkdirSync(routeDir, { recursive: true });

  // Generate API route
  let apiCode = API_TEMPLATE
    .replace(/\{\{METHOD\}\}/g, method.toUpperCase())
    .replace(/\{\{ROUTE_NAME\}\}/g, routeName)
    .replace(/\{\{DESCRIPTION\}\}/g, description);

  // Use BEAST MODE to enhance if requested
  if (useBeastMode) {
    try {
      const response = execSync(
        `curl -s -X POST http://localhost:3000/api/codebase/chat -H "Content-Type: application/json" -d '{"sessionId":"generate-api-${routeName}","message":"Enhance this API route with proper error handling, validation, and best practices: ${apiCode.replace(/'/g, "\\'")}","repo":"BEAST-MODE-PRODUCT"}'`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      const result = JSON.parse(response);
      if (result.code) {
        apiCode = result.code;
        console.log('   ✨ Enhanced with BEAST MODE');
      }
    } catch (error) {
      console.warn('   ⚠️  BEAST MODE enhancement failed, using template');
    }
  }

  fs.writeFileSync(routeFile, apiCode);
  console.log(`   ✅ Created: ${routeFile}`);

  // Generate test
  if (generateTest) {
    const testCode = TEST_TEMPLATE
      .replace(/\{\{ROUTE_NAME\}\}/g, routeName)
      .replace(/\{\{METHOD\}\}/g, method);
    
    fs.writeFileSync(testFile, testCode);
    console.log(`   ✅ Created: ${testFile}`);
  }

  console.log(`\n✅ ${routeName} API route generated successfully!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Edit ${routeFile}`);
  console.log(`   2. Implement your logic`);
  console.log(`   3. Run tests: npm test ${routeName}`);
}

// CLI
const routeName = process.argv[2];
const method = process.argv.includes('--method') 
  ? process.argv[process.argv.indexOf('--method') + 1] 
  : 'GET';
const useBeastMode = process.argv.includes('--beast-mode') || process.argv.includes('-b');

if (!routeName) {
  console.log('Usage: node scripts/automate/generate-api.js <route-name> [--method GET|POST|PUT|DELETE] [--beast-mode]');
  console.log('\nExample:');
  console.log('  node scripts/automate/generate-api.js users');
  console.log('  node scripts/automate/generate-api.js users --method POST');
  console.log('  node scripts/automate/generate-api.js users --beast-mode');
  process.exit(1);
}

generateAPI(routeName, { method, useBeastMode });
