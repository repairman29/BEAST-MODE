#!/usr/bin/env node
/**
 * Fix logger imports across all files
 * Adds try/catch fallback for logger imports
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [];

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.js') && !file.includes('fix-logger')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes("require('../utils/logger')") || 
          content.includes('require("../utils/logger")') ||
          content.includes("require('../../utils/logger')") ||
          content.includes('require("../../utils/logger")') ||
          content.includes("require('../../../utils/logger')") ||
          content.includes('require("../../../utils/logger")')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function fixLoggerImport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Pattern 1: const { createLogger } = require('../utils/logger');
  const pattern1 = /const\s*{\s*createLogger\s*}\s*=\s*require\s*\(['"]\.\.\/.*?utils\/logger['"]\)\s*;/g;
  if (pattern1.test(content)) {
    content = content.replace(
      /const\s*{\s*createLogger\s*}\s*=\s*require\s*\(['"]\.\.\/.*?utils\/logger['"]\)\s*;/g,
      `// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(\`[\${name}]\`, ...args),
    warn: (...args) => console.warn(\`[\${name}]\`, ...args),
    error: (...args) => console.error(\`[\${name}]\`, ...args),
    debug: (...args) => console.debug(\`[\${name}]\`, ...args),
  });
}`
    );
  }
  
  // Pattern 2: const logger = require('../utils/logger');
  const pattern2 = /const\s+logger\s*=\s*require\s*\(['"]\.\.\/.*?utils\/logger['"]\)\s*;/g;
  if (pattern2.test(content)) {
    content = content.replace(
      /const\s+logger\s*=\s*require\s*\(['"]\.\.\/.*?utils\/logger['"]\)\s*;/g,
      `// Try to require logger, fallback to console if not available
let logger;
try {
  logger = require('../utils/logger');
} catch (e) {
  logger = {
    createLogger: (name) => ({
      info: (...args) => console.log(\`[\${name}]\`, ...args),
      warn: (...args) => console.warn(\`[\${name}]\`, ...args),
      error: (...args) => console.error(\`[\${name}]\`, ...args),
      debug: (...args) => console.debug(\`[\${name}]\`, ...args),
    })
  };
}`
    );
  }
  
  // Pattern 3: const log = require('../utils/logger').createLogger('name');
  const pattern3 = /const\s+log\s*=\s*require\s*\(['"]\.\.\/.*?utils\/logger['"]\)\s*\.\s*createLogger\s*\(/g;
  if (pattern3.test(content)) {
    content = content.replace(
      /const\s+log\s*=\s*require\s*\(['"]\.\.\/.*?utils\/logger['"]\)\s*\.\s*createLogger\s*\(([^)]+)\)/g,
      `(function() {
  try {
    const loggerModule = require('../utils/logger');
    const createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
    return createLogger($1);
  } catch (e) {
    const name = $1;
    return {
      info: (...args) => console.log(\`[\${name}]\`, ...args),
      warn: (...args) => console.warn(\`[\${name}]\`, ...args),
      error: (...args) => console.error(\`[\${name}]\`, ...args),
      debug: (...args) => console.debug(\`[\${name}]\`, ...args),
    };
  }
})()`
    );
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Find all files
console.log('🔍 Finding files with logger imports...');
const libFiles = findFiles(path.join(__dirname, '../lib'));
const websiteFiles = findFiles(path.join(__dirname, '../website/lib'));

const allFiles = [...libFiles, ...websiteFiles];
console.log(`📋 Found ${allFiles.length} files to check`);

// Fix files
let fixed = 0;
allFiles.forEach(file => {
  if (fixLoggerImport(file)) {
    fixed++;
    console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n✅ Fixed ${fixed} files`);
console.log(`📋 Total files checked: ${allFiles.length}`);
