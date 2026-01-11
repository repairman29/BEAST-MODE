/**
 * Copy mlops files to .next/server/lib/mlops for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'lib', 'mlops');
const destDir = path.join(__dirname, '..', '.next', 'server', 'lib', 'mlops');

if (!fs.existsSync(srcDir)) {
  console.log('Source directory not found, skipping copy:', srcDir);
  process.exit(0);
}

// Create destination directory
fs.mkdirSync(destDir, { recursive: true });

// Copy all .js files
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  fs.copyFileSync(srcFile, destFile);
  console.log(`Copied ${file} to .next/server/lib/mlops/`);
});

console.log(`✅ Copied ${files.length} mlops files`);
