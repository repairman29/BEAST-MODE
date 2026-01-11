#!/usr/bin/env node

/**
 * BEAST MODE Dogfood - Fix Authentication Issues
 * 
 * Uses BEAST MODE to analyze authentication code and fix all issues
 * 
 * Usage:
 *   node scripts/dogfood-fix-auth.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const BASE_URL = process.env.BEAST_MODE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';
const TARGET_FILES = [
  'website/app/api/github/oauth/callback/route.ts',
  'website/components/beast-mode/AuthSection.tsx',
  'website/app/page.tsx',
  'website/app/dashboard/layout.tsx',
  'website/app/api/github/oauth/authorize/route.ts'
];

/**
 * Analyze code file with BEAST MODE
 */
async function analyzeCode(filePath) {
  console.log(`\n📊 Analyzing: ${filePath}`);
  console.log('='.repeat(70));
  
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ❌ File not found: ${fullPath}`);
    return null;
  }
  
  const code = fs.readFileSync(fullPath, 'utf8');
  
  try {
    // Use BEAST MODE's quality API to analyze
    const response = await axios.post(`${BASE_URL}/api/repos/quality/generate`, {
      code: code,
      filePath: filePath,
      language: 'typescript'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.data && response.data.quality !== undefined) {
      console.log(`   ✅ Quality Score: ${response.data.quality}/100`);
      if (response.data.recommendations) {
        console.log(`   📋 Recommendations: ${response.data.recommendations.length}`);
        response.data.recommendations.slice(0, 5).forEach((rec, i) => {
          console.log(`      ${i + 1}. [${rec.priority}] ${rec.action}`);
        });
      }
      return response.data;
    }
  } catch (error) {
    console.log(`   ⚠️  API call failed: ${error.message}`);
    // Fallback to static analysis
    return analyzeCodeStatic(code, filePath);
  }
  
  return null;
}

/**
 * Static code analysis fallback
 */
function analyzeCodeStatic(code, filePath) {
  const issues = [];
  let score = 100;
  
  // Check for common authentication issues
  const checks = [
    {
      name: 'Missing error handling in OAuth',
      pattern: /oauth.*callback|github.*oauth/i,
      check: (code) => {
        const hasTryCatch = /try\s*\{[\s\S]*?catch/i.test(code);
        const hasErrorRedirect = /error.*redirect|redirect.*error/i.test(code);
        return hasTryCatch && hasErrorRedirect;
      },
      penalty: 10
    },
    {
      name: 'State validation missing',
      pattern: /state.*mismatch|invalid.*state/i,
      check: (code) => /storedState.*state|state.*storedState/i.test(code),
      penalty: 15
    },
    {
      name: 'Redirect loop potential',
      pattern: /redirect.*dashboard|dashboard.*redirect/i,
      check: (code) => {
        // Check if redirecting to dashboard when not authenticated
        const redirectsToDashboard = /redirect.*['"]\/dashboard/i.test(code);
        const checksAuth = /auth.*required|isAuthenticated/i.test(code);
        return !(redirectsToDashboard && checksAuth);
      },
      penalty: 20
    },
    {
      name: 'Missing URL param handling',
      pattern: /useSearchParams|searchParams/i,
      check: (code) => {
        const hasSearchParams = /useSearchParams|searchParams/i.test(code);
        const handlesAuth = /auth.*required|action.*signin/i.test(code);
        return hasSearchParams && handlesAuth;
      },
      penalty: 10
    },
    {
      name: 'TypeScript any types',
      pattern: /:\s*any\b/,
      count: (code) => (code.match(/:\s*any\b/g) || []).length,
      penalty: 2
    },
    {
      name: 'Console.log in production',
      pattern: /console\.(log|debug)/,
      count: (code) => (code.match(/console\.(log|debug)/g) || []).length,
      penalty: 1
    }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(code)) {
      if (check.check && !check.check(code)) {
        issues.push({ name: check.name, severity: 'high' });
        score -= check.penalty;
      } else if (check.count) {
        const count = check.count(code);
        if (count > 0) {
          issues.push({ name: `${check.name} (${count} found)`, severity: 'medium' });
          score -= check.penalty * Math.min(count, 5);
        }
      }
    }
  });
  
  console.log(`   📊 Static Analysis Score: ${Math.max(0, score)}/100`);
  console.log(`   📋 Issues Found: ${issues.length}`);
  issues.forEach(issue => {
    console.log(`      ${issue.severity === 'high' ? '🔴' : '🟡'} ${issue.name}`);
  });
  
  return { quality: Math.max(0, score), issues, recommendations: [] };
}

/**
 * Get recommendations from BEAST MODE
 */
async function getRecommendations(filePath, code) {
  try {
    const response = await axios.post(`${BASE_URL}/api/codebase/chat`, {
      sessionId: `auth-fix-${Date.now()}`,
      message: `Analyze this authentication code and provide specific fixes for:
1. OAuth state validation
2. Redirect loops
3. Error handling
4. URL parameter handling
5. TypeScript types

File: ${filePath}

\`\`\`typescript
${code.substring(0, 2000)}
\`\`\`

Provide concrete code fixes.`
    }, {
      timeout: 30000
    });
    
    if (response.data && response.data.response) {
      return response.data.response;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not get AI recommendations: ${error.message}`);
  }
  
  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🦾 BEAST MODE - Fixing Authentication Issues');
  console.log('='.repeat(70));
  console.log(`\n🎯 Target Files: ${TARGET_FILES.length}`);
  console.log(`🌐 BEAST MODE URL: ${BASE_URL}\n`);
  
  const results = [];
  
  for (const filePath of TARGET_FILES) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`\n⚠️  Skipping (not found): ${filePath}`);
      continue;
    }
    
    const code = fs.readFileSync(fullPath, 'utf8');
    const analysis = await analyzeCode(filePath);
    
    if (analysis) {
      results.push({
        file: filePath,
        quality: analysis.quality || 0,
        issues: analysis.issues || [],
        recommendations: analysis.recommendations || []
      });
      
      // Get AI recommendations if quality is low
      if (analysis.quality < 85) {
        console.log(`\n   🤖 Getting AI recommendations...`);
        const aiRecs = await getRecommendations(filePath, code);
        if (aiRecs) {
          console.log(`   💡 AI Suggestions:\n${aiRecs.substring(0, 500)}...`);
        }
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 ANALYSIS SUMMARY\n');
  
  results.forEach(result => {
    const status = result.quality >= 85 ? '✅' : result.quality >= 70 ? '⚠️' : '❌';
    console.log(`${status} ${result.file}`);
    console.log(`   Quality: ${result.quality}/100`);
    console.log(`   Issues: ${result.issues.length}`);
    if (result.recommendations.length > 0) {
      console.log(`   Recommendations: ${result.recommendations.length}`);
    }
    console.log();
  });
  
  const avgQuality = results.length > 0 
    ? results.reduce((sum, r) => sum + r.quality, 0) / results.length 
    : 0;
  
  console.log(`\n🎯 Average Quality: ${avgQuality.toFixed(1)}/100`);
  
  if (avgQuality < 85) {
    console.log('\n⚠️  Some files need improvement. Review the recommendations above.');
  } else {
    console.log('\n✅ All authentication files meet quality standards!');
  }
  
  console.log('\n' + '='.repeat(70));
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
}
