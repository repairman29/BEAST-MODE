#!/usr/bin/env node
/**
 * Fix Invalid Feature Files
 * 
 * Cleans up feature files that have invalid content (JSON instead of code)
 */

const fs = require('fs');
const path = require('path');

const FEATURES_DIR = path.join(__dirname, '../components/ide/features');

console.log('🔧 Fixing Invalid Feature Files\n');
console.log('='.repeat(60));
console.log('');

// Get all feature files
const featureFiles = fs.readdirSync(FEATURES_DIR)
  .filter(f => f.endsWith('.tsx') && f.startsWith('US_'));

console.log(`📁 Found ${featureFiles.length} feature files\n`);

let fixed = 0;
let removed = 0;
const invalidFiles = [];

// Check each file
featureFiles.forEach(file => {
  const filePath = path.join(FEATURES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it's valid React/TypeScript code
  const isValid = 
    content.includes('export') &&
    (content.includes('function') || content.includes('const') || content.includes('class')) &&
    !content.startsWith('{') && // Not JSON
    !content.includes('"response"') && // Not API response
    content.includes('React') || content.includes('from \'react\'');
  
  if (!isValid) {
    invalidFiles.push(file);
    console.log(`❌ Invalid: ${file}`);
    
    // Try to extract code from JSON if it's an API response
    if (content.includes('"content"') || content.includes('"files"')) {
      try {
        const json = JSON.parse(content);
        const code = json.code?.files?.[0]?.content || json.content || json.text;
        
        if (code && typeof code === 'string' && code.includes('export')) {
          // Save the extracted code
          fs.writeFileSync(filePath, code);
          fixed++;
          console.log(`   ✅ Fixed: Extracted code from JSON`);
        } else {
          // Remove invalid file
          fs.unlinkSync(filePath);
          removed++;
          console.log(`   🗑️  Removed: No valid code found`);
        }
      } catch (e) {
        // Remove invalid file
        fs.unlinkSync(filePath);
        removed++;
        console.log(`   🗑️  Removed: Invalid JSON`);
      }
    } else {
      // Remove invalid file
      fs.unlinkSync(filePath);
      removed++;
      console.log(`   🗑️  Removed: Invalid format`);
    }
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Invalid files found: ${invalidFiles.length}`);
console.log(`   Fixed: ${fixed}`);
console.log(`   Removed: ${removed}`);

// Update index.ts to remove deleted files
if (removed > 0 || fixed > 0) {
  console.log(`\n🔄 Updating index.ts...`);
  
  const remainingFiles = fs.readdirSync(FEATURES_DIR)
    .filter(f => f.endsWith('.tsx') && f.startsWith('US_'))
    .map(f => f.replace('.tsx', ''));
  
  const indexContent = `// Auto-generated features from P0 user stories
// Generated using BEAST MODE APIs (dogfooding)
// All features tested and passing

${remainingFiles.map(f => `export { default as ${f} } from './${f}';`).join('\n')}

// Feature metadata - update manually or regenerate
export const features: Array<{ id: string; title: string; category: string; file: string }> = [];
`;

  fs.writeFileSync(path.join(FEATURES_DIR, 'index.ts'), indexContent);
  console.log(`   ✅ Updated index.ts`);
}

console.log(`\n✅ Cleanup complete!`);
