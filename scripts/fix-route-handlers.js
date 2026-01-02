#!/usr/bin/env node

/**
 * Fix broken route handlers after withProductionIntegration removal
 */

const fs = require('fs');
const path = require('path');

const websiteDir = path.join(__dirname, '../website');

const files = [
  'app/api/optimization/cache/route.ts',
  'app/api/optimization/cost/route.ts',
  'app/api/optimization/models/route.ts',
  'app/api/mlops/drift-detection/route.ts',
];

files.forEach(file => {
  const filePath = path.join(websiteDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix broken GET handlers
  content = content.replace(
    /export async function GET\(req: NextRequest\) \{[^}]*\}/gs,
    (match) => {
      if (!match.includes('return handler(req)')) {
        changed = true;
        return 'export async function GET(req: NextRequest) {\n  return handler(req);\n}';
      }
      return match;
    }
  );

  // Fix broken POST handlers
  content = content.replace(
    /export async function POST\(req: NextRequest\) \{[^}]*\}/gs,
    (match) => {
      if (!match.includes('return handler(req)')) {
        changed = true;
        return 'export async function POST(req: NextRequest) {\n  return handler(req);\n}';
      }
      return match;
    }
  );

  // Remove duplicate return statements
  content = content.replace(/return handler\(req\);\s*return handler\(req\);/g, 'return handler(req);');
  
  // Remove orphaned braces
  content = content.replace(/^\s*\}\s*$/gm, '');
  content = content.replace(/^\s*\/\/ Middleware not available\s*$/gm, '');

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`✓  OK: ${file}`);
  }
});

console.log('\n📊 Route handlers fixed!');

