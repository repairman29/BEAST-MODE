/**
 * Copy mlops files to .next/server/lib/mlops for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'lib', 'mlops');
const destDir = path.join(__dirname, '..', '.next', 'server', 'lib', 'mlops');

if (!fs.existsSync(srcDir)) {
  console.error('Source directory not found:', srcDir);
  process.exit(1);
}

// Create destination directories
fs.mkdirSync(destDir1, { recursive: true });
// destDir2 should already exist, but ensure it does
if (!fs.existsSync(destDir2)) {
  fs.mkdirSync(destDir2, { recursive: true });
}

// Copy all .js files to both locations
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  // Copy to .next/server (for Next.js runtime)
  const destFile1 = path.join(destDir1, file);
  fs.copyFileSync(srcFile, destFile1);
  console.log(`Copied ${file} to .next/server/lib/mlops/`);
  
  // Also ensure it's in the source location (for Vercel)
  if (!fs.existsSync(path.join(destDir2, file))) {
    const destFile2 = path.join(destDir2, file);
    fs.copyFileSync(srcFile, destFile2);
    console.log(`Ensured ${file} exists in lib/mlops/`);
  }
});

console.log(`✅ Copied ${files.length} mlops files to both locations`);
