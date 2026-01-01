#!/usr/bin/env node
/**
 * Fix all static imports of withProductionIntegration
 * Replace with dynamic require pattern
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'website/app/api/optimization/resources/route.ts',
  'website/app/api/mlops/analytics/route.ts',
  'website/app/api/mlops/model-registry/route.ts',
  'website/app/api/mlops/feedback-loop/route.ts',
  'website/app/api/mlops/feature-store/route.ts',
  'website/app/api/mlops/fine-tuning/route.ts',
  'website/app/api/mlops/ab-testing/route.ts',
  'website/app/api/mlops/drift-detection/route.ts',
  'website/app/api/optimization/performance/route.ts',
  'website/app/api/optimization/models/route.ts',
  'website/app/api/optimization/cost/route.ts',
  'website/app/api/optimization/cache/route.ts',
  'website/app/api/optimization/database/route.ts',
  'website/app/api/marketplace/plugins/route.ts',
  'website/app/api/marketplace/integrations/route.ts',
];

const projectRoot = path.resolve(__dirname, '..');

filesToFix.forEach(relativePath => {
  const filePath = path.join(projectRoot, relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove static import
  content = content.replace(
    /import\s*{\s*withProductionIntegration\s*}\s*from\s*['"][^'"]+['"];\s*\n/g,
    ''
  );
  
  // Check if withProductionIntegration is used in the file
  if (content.includes('withProductionIntegration')) {
    // Add dynamic import at the top after other imports
    const importMatch = content.match(/(import\s+.*?from\s+['"][^'"]+['"];\s*\n)+/);
    if (importMatch) {
      const insertPoint = importMatch[0].length;
      const dynamicImport = `\n// Dynamic import for optional production integration\nlet withProductionIntegration: any = null;\ntry {\n  /* webpackIgnore: true */\n  const middleware = require(\`../../../../lib/api-middleware\`);\n  withProductionIntegration = middleware.withProductionIntegration;\n} catch (error) {\n  // Middleware not available\n}\n\n`;
      content = content.slice(0, insertPoint) + dynamicImport + content.slice(insertPoint);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${relativePath}`);
});

console.log('\n✅ All files fixed!');

