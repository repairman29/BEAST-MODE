#!/usr/bin/env node

/**
 * Fix all import paths in API routes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const websiteDir = path.join(__dirname, '../website');

// Find all TypeScript files in app/api
const files = execSync('find app/api -name "*.ts"', { 
  cwd: websiteDir, 
  encoding: 'utf8' 
}).trim().split('\n').filter(Boolean);

let fixed = 0;

files.forEach(file => {
  const filePath = path.join(websiteDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Calculate correct path to lib/api-middleware
  const fileDir = path.dirname(file);
  const correctMiddlewarePath = path.relative(fileDir, 'lib/api-middleware');
  const correctSupabasePath = path.relative(fileDir, 'lib/supabase');
  
  // Fix api-middleware imports
  const middlewarePatterns = [
    /from\s+['"]\.\.\/\.\.\/\.\.\/lib\/api-middleware['"]/g,
    /from\s+['"]\.\.\/\.\.\/lib\/api-middleware['"]/g,
    /from\s+['"]@\/lib\/api-middleware['"]/g,
  ];
  
  middlewarePatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `from '${correctMiddlewarePath}'`);
      changed = true;
    }
  });
  
  // Fix supabase imports with wrong depth
  if (content.includes('../../../../../../lib/supabase')) {
    content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabase['"]/g, `from '${correctSupabasePath}'`);
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
});

console.log(`\n📊 Fixed ${fixed} files`);

