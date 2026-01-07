#!/usr/bin/env node

/**
 * Security Audit Script for BEAST MODE MVP
 * 
 * Checks for:
 * - Exposed secrets/API keys
 * - Authentication issues
 * - CORS configuration
 * - Environment variable usage
 * - Rate limiting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const websiteDir = path.join(__dirname, '../website');
const issues = [];
const warnings = [];
const passed = [];

/**
 * Check for exposed secrets in code
 */
function checkExposedSecrets() {
  log('\n1. Checking for exposed secrets...', 'cyan');
  
  const secretPatterns = [
    { pattern: /sk-[a-zA-Z0-9]{20,}/g, name: 'OpenAI API key' },
    { pattern: /sk-ant-[a-zA-Z0-9-]{20,}/g, name: 'Anthropic API key' },
    { pattern: /ghp_[a-zA-Z0-9]{36,}/g, name: 'GitHub token' },
    { pattern: /re_[a-zA-Z0-9]{20,}/g, name: 'Resend API key' },
    { pattern: /r8_[a-zA-Z0-9]{20,}/g, name: 'Replicate API key' },
    { pattern: /gsk_[a-zA-Z0-9]{20,}/g, name: 'Groq API key' },
    { pattern: /AIza[a-zA-Z0-9_-]{35,}/g, name: 'Google API key' },
    { pattern: /postgres:\/\/[^:]+:[^@]+@/g, name: 'Database connection string' },
    { pattern: /mongodb:\/\/[^:]+:[^@]+@/g, name: 'MongoDB connection string' },
    { pattern: /SUPABASE_SERVICE_ROLE_KEY.*=.*['"]([^'"]+)['"]/g, name: 'Supabase service role key' },
  ];

  const filesToCheck = [
    path.join(websiteDir, 'app/api/**/*.ts'),
    path.join(websiteDir, 'app/api/**/*.tsx'),
    path.join(websiteDir, 'lib/**/*.ts'),
    path.join(websiteDir, 'lib/**/*.js'),
  ];

  let foundSecrets = false;
  
  // Check specific files
  const apiFiles = execSync(`find ${websiteDir}/app/api -name "*.ts" -o -name "*.tsx"`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  apiFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    
    secretPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        foundSecrets = true;
        issues.push(`❌ ${name} found in ${file}`);
        log(`   ❌ ${name} found in ${path.relative(websiteDir, file)}`, 'red');
      }
    });
  });

  if (!foundSecrets) {
    passed.push('✅ No exposed secrets found in code');
    log('   ✅ No exposed secrets found', 'green');
  }

  // Check .env files are in .gitignore
  const gitignore = fs.readFileSync(path.join(websiteDir, '.gitignore'), 'utf8');
  if (gitignore.includes('.env')) {
    passed.push('✅ .env files are in .gitignore');
    log('   ✅ .env files are in .gitignore', 'green');
  } else {
    warnings.push('⚠️  .env files may not be in .gitignore');
    log('   ⚠️  .env files may not be in .gitignore', 'yellow');
  }
}

/**
 * Check authentication in API routes
 */
function checkAuthentication() {
  log('\n2. Checking authentication in API routes...', 'cyan');
  
  const apiFiles = execSync(`find ${websiteDir}/app/api -name "route.ts"`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  const protectedRoutes = [];
  const unprotectedRoutes = [];

  apiFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(websiteDir, file);
    
    // Check if route has authentication
    const hasAuth = content.includes('getSupabaseClient') || 
                    content.includes('userId') ||
                    content.includes('authorization') ||
                    content.includes('Bearer') ||
                    content.includes('cookies.get') ||
                    content.includes('request.headers.get');
    
    // Public routes that don't need auth
    const publicRoutes = [
      '/api/health',
      '/api/repos/quality', // GET endpoint is public
      '/api/openapi.json',
    ];
    
    const isPublicRoute = publicRoutes.some(route => relativePath.includes(route));
    
    if (isPublicRoute) {
      // Public route - OK
      return;
    }
    
    if (hasAuth) {
      protectedRoutes.push(relativePath);
    } else {
      unprotectedRoutes.push(relativePath);
    }
  });

  log(`   ✅ ${protectedRoutes.length} routes have authentication`, 'green');
  passed.push(`✅ ${protectedRoutes.length} routes have authentication`);
  
  if (unprotectedRoutes.length > 0) {
    warnings.push(`⚠️  ${unprotectedRoutes.length} routes may need authentication`);
    log(`   ⚠️  ${unprotectedRoutes.length} routes may need authentication:`, 'yellow');
    unprotectedRoutes.slice(0, 5).forEach(route => {
      log(`      - ${route}`, 'yellow');
    });
  }
}

/**
 * Check CORS configuration
 */
function checkCORS() {
  log('\n3. Checking CORS configuration...', 'cyan');
  
  // Check middleware
  const middlewareFile = path.join(websiteDir, 'middleware.ts');
  if (fs.existsSync(middlewareFile)) {
    const content = fs.readFileSync(middlewareFile, 'utf8');
    if (content.includes('cors') || content.includes('CORS') || content.includes('Access-Control')) {
      passed.push('✅ CORS configuration found in middleware');
      log('   ✅ CORS configuration found', 'green');
    } else {
      warnings.push('⚠️  CORS configuration not found in middleware');
      log('   ⚠️  CORS configuration not found', 'yellow');
    }
  } else {
    warnings.push('⚠️  middleware.ts not found');
    log('   ⚠️  middleware.ts not found', 'yellow');
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  log('\n4. Checking environment variables...', 'cyan');
  
  const envExample = path.join(websiteDir, '.env.example');
  const envLocal = path.join(websiteDir, '.env.local');
  
  if (fs.existsSync(envExample)) {
    passed.push('✅ .env.example exists');
    log('   ✅ .env.example exists', 'green');
  } else {
    warnings.push('⚠️  .env.example not found');
    log('   ⚠️  .env.example not found', 'yellow');
  }
  
  if (fs.existsSync(envLocal)) {
    // Check if .env.local is in .gitignore
    const gitignore = fs.readFileSync(path.join(websiteDir, '.gitignore'), 'utf8');
    if (gitignore.includes('.env.local')) {
      passed.push('✅ .env.local is in .gitignore');
      log('   ✅ .env.local is in .gitignore', 'green');
    } else {
      issues.push('❌ .env.local is NOT in .gitignore');
      log('   ❌ .env.local is NOT in .gitignore', 'red');
    }
  }
}

/**
 * Check rate limiting
 */
function checkRateLimiting() {
  log('\n5. Checking rate limiting...', 'cyan');
  
  // Check if rate limiting is implemented
  const apiFiles = execSync(`find ${websiteDir}/app/api -name "route.ts"`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  
  let hasRateLimiting = false;
  
  apiFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('rateLimit') || content.includes('rate-limit') || content.includes('throttle')) {
      hasRateLimiting = true;
    }
  });
  
  if (hasRateLimiting) {
    passed.push('✅ Rate limiting found in some routes');
    log('   ✅ Rate limiting found', 'green');
  } else {
    warnings.push('⚠️  Rate limiting not found (consider adding)');
    log('   ⚠️  Rate limiting not found (consider adding)', 'yellow');
  }
}

/**
 * Main function
 */
function main() {
  log('\n🔒 BEAST MODE Security Audit\n', 'cyan');
  log('='.repeat(60) + '\n');

  checkExposedSecrets();
  checkAuthentication();
  checkCORS();
  checkEnvironmentVariables();
  checkRateLimiting();

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 Security Audit Summary\n', 'cyan');
  
  log(`✅ Passed: ${passed.length}`, 'green');
  passed.forEach(item => log(`   ${item}`, 'green'));
  
  if (warnings.length > 0) {
    log(`\n⚠️  Warnings: ${warnings.length}`, 'yellow');
    warnings.forEach(item => log(`   ${item}`, 'yellow'));
  }
  
  if (issues.length > 0) {
    log(`\n❌ Issues: ${issues.length}`, 'red');
    issues.forEach(item => log(`   ${item}`, 'red'));
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  
  if (issues.length === 0) {
    log('\n✅ Security audit passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Security issues found - please fix before launch', 'red');
    process.exit(1);
  }
}

main();

