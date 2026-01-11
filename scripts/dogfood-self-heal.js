#!/usr/bin/env node

/**
 * BEAST MODE Self-Healing System
 * 
 * Analyzes code quality, tracks improvements, and uses BEAST MODE
 * to continuously improve code until quality threshold is met.
 * 
 * Usage:
 *   node scripts/dogfood-self-heal.js [--file=path] [--threshold=90]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const TARGET_FILES = [
  'website/components/beast-mode/InterceptorDashboard.tsx',
  'website/app/api/intercepted-commits/stats/route.ts',
  'website/app/api/intercepted-commits/route.ts'
];

const QUALITY_THRESHOLD = parseInt(process.argv.find(arg => arg.startsWith('--threshold='))?.split('=')[1] || '90');

/**
 * Analyze code quality using static analysis
 */
function analyzeCodeQuality(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    return { error: 'File not found' };
  }
  
  const code = fs.readFileSync(fullPath, 'utf8');
  const lines = code.split('\n');
  const issues = [];
  let score = 100;
  
  // Check for common issues
  const checks = [
    {
      name: 'Missing error handling',
      pattern: /catch\s*\(/,
      negative: true,
      severity: 'high',
      penalty: 5
    },
    {
      name: 'Missing TypeScript types',
      pattern: /:\s*any\b/,
      severity: 'medium',
      penalty: 2
    },
    {
      name: 'Console.log in production',
      pattern: /console\.(log|debug)/,
      severity: 'low',
      penalty: 1,
      excludePattern: /\/\/ Error logged via|Error logged via notification/
    },
    {
      name: 'Missing accessibility',
      pattern: /aria-label|role|alt|htmlFor/,
      negative: true,
      severity: 'medium',
      penalty: 3,
      checkFunction: (code) => {
        // More sophisticated check: ensure interactive elements have labels
        const hasInteractiveElements = /<Button|<select|<input|<textarea/.test(code);
        const hasAccessibility = /aria-label|htmlFor|role="main"/.test(code);
        return hasInteractiveElements && !hasAccessibility;
      }
    },
    {
      name: 'Missing loading states',
      pattern: /loading|isLoading|LoadingState/,
      negative: false, // Should have loading states
      severity: 'medium',
      penalty: 0, // Don't penalize if present
      checkFunction: (code) => {
        // Check if async operations have loading states
        const hasAsyncOps = /fetch\(|await|async/.test(code);
        const hasLoading = /loading|isLoading|LoadingState/.test(code);
        return hasAsyncOps && !hasLoading;
      }
    },
    {
      name: 'Missing error boundaries',
      pattern: /ErrorBoundary|error.*boundary/i,
      negative: true,
      severity: 'high',
      penalty: 5
    },
    {
      name: 'Hardcoded values',
      pattern: /['"]\d+['"]|magic.*number/i,
      severity: 'low',
      penalty: 1
    },
    {
      name: 'Missing JSDoc',
      pattern: /\/\*\*[\s\S]*?\*\//,
      negative: true,
      severity: 'low',
      penalty: 1
    }
  ];
  
  // Run checks
  checks.forEach(check => {
    let shouldFlag = false;
    
    // Use custom check function if available
    if (check.checkFunction) {
      shouldFlag = check.checkFunction(code);
    } else {
      const hasPattern = check.pattern.test(code);
      const shouldHave = !check.negative;
      shouldFlag = hasPattern !== shouldHave;
      
      // Check if pattern should be excluded
      if (shouldFlag && check.excludePattern) {
        const lines = code.split('\n');
        const patternLine = findLineNumber(code, check.pattern);
        if (patternLine) {
          // Check surrounding lines for exclusion pattern
          const contextStart = Math.max(0, patternLine - 3);
          const contextEnd = Math.min(lines.length, patternLine + 3);
          const context = lines.slice(contextStart, contextEnd).join('\n');
          if (check.excludePattern.test(context)) {
            shouldFlag = false;
          }
        }
      }
    }
    
    if (shouldFlag) {
      const hasPattern = check.pattern.test(code);
      const shouldHave = !check.negative;
      
      if (shouldHave && !hasPattern) {
        // Missing required pattern
        issues.push({
          severity: check.severity,
          type: check.name,
          message: `Missing ${check.name.toLowerCase()}`,
          line: findLineNumber(code, check.pattern),
          suggestion: `Add ${check.name.toLowerCase()}`
        });
        score -= check.penalty;
      } else if (!shouldHave && hasPattern) {
        // Has unwanted pattern
        issues.push({
          severity: check.severity,
          type: check.name,
          message: `Found ${check.name.toLowerCase()}`,
          line: findLineNumber(code, check.pattern),
          suggestion: `Remove or fix ${check.name.toLowerCase()}`
        });
        score -= check.penalty;
      }
    }
  });
  
  // Calculate metrics
  const metrics = {
    linesOfCode: lines.length,
    functions: (code.match(/(?:function|const|export)\s+\w+/g) || []).length,
    complexity: estimateComplexity(code),
    testCoverage: 0, // Would need test files
    typeSafety: calculateTypeSafety(code)
  };
  
  return {
    qualityScore: Math.max(0, Math.min(100, score)),
    issues,
    metrics,
    file: filePath
  };
}

function findLineNumber(code, pattern) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      return i + 1;
    }
  }
  return null;
}

function estimateComplexity(code) {
  let complexity = 1;
  complexity += (code.match(/\bif\s*\(/g) || []).length;
  complexity += (code.match(/\bfor\s*\(/g) || []).length;
  complexity += (code.match(/\bwhile\s*\(/g) || []).length;
  complexity += (code.match(/\bswitch\s*\(/g) || []).length;
  complexity += (code.match(/\bcatch\s*\(/g) || []).length;
  return complexity;
}

function calculateTypeSafety(code) {
  const totalVars = (code.match(/\b(?:const|let|var)\s+\w+/g) || []).length;
  const typedVars = (code.match(/\b(?:const|let|var)\s+\w+\s*:/g) || []).length;
  return totalVars > 0 ? (typedVars / totalVars) * 100 : 100;
}

/**
 * Generate improvements using BEAST MODE patterns
 */
function generateImprovements(analysis) {
  const improvements = [];
  
  analysis.issues.forEach(issue => {
    switch (issue.type) {
      case 'Missing error handling':
        improvements.push({
          type: 'add-error-handling',
          description: 'Add try-catch blocks and error boundaries',
          priority: 'high'
        });
        break;
      case 'Missing TypeScript types':
        improvements.push({
          type: 'add-types',
          description: 'Replace any types with proper TypeScript types',
          priority: 'medium'
        });
        break;
      case 'Missing accessibility':
        improvements.push({
          type: 'add-accessibility',
          description: 'Add ARIA labels and roles for accessibility',
          priority: 'medium'
        });
        break;
      case 'Missing loading states':
        improvements.push({
          type: 'add-loading-states',
          description: 'Add loading indicators for async operations',
          priority: 'medium'
        });
        break;
    }
  });
  
  return improvements;
}

/**
 * Track quality in Supabase
 */
async function trackQuality(filePath, analysis) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ⚠️  Supabase not configured - skipping tracking');
    return null;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if quality_tracking table exists, create if not
    const trackingData = {
      file_path: filePath,
      quality_score: analysis.qualityScore,
      issues_count: analysis.issues.length,
      metrics: analysis.metrics,
      issues: analysis.issues,
      timestamp: new Date().toISOString(),
      threshold: QUALITY_THRESHOLD,
      meets_threshold: analysis.qualityScore >= QUALITY_THRESHOLD
    };
    
    // Try to insert (table might not exist yet)
    const { data, error } = await supabase
      .from('quality_tracking')
      .insert(trackingData)
      .select()
      .single();
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('   📊 Creating quality_tracking table...');
      await createQualityTrackingTable(supabase);
      // Retry insert
      const { data: retryData } = await supabase
        .from('quality_tracking')
        .insert(trackingData)
        .select()
        .single();
      return retryData;
    }
    
    return data;
  } catch (error) {
    console.log(`   ⚠️  Tracking failed: ${error.message}`);
    return null;
  }
}

async function createQualityTrackingTable(supabase) {
  const sql = `
    CREATE TABLE IF NOT EXISTS quality_tracking (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      file_path TEXT NOT NULL,
      quality_score NUMERIC NOT NULL,
      issues_count INTEGER DEFAULT 0,
      metrics JSONB,
      issues JSONB,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      threshold NUMERIC DEFAULT 90,
      meets_threshold BOOLEAN DEFAULT false,
      improvements_applied JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_quality_tracking_file_path ON quality_tracking(file_path);
    CREATE INDEX IF NOT EXISTS idx_quality_tracking_timestamp ON quality_tracking(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_quality_tracking_score ON quality_tracking(quality_score);
  `;
  
  // Use exec_sql if available
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
    // Fallback: try direct SQL (might not work)
    return { error: 'exec_sql not available' };
  });
  
  if (error) {
    console.log(`   ⚠️  Could not create table automatically: ${error.message}`);
    console.log(`   💡 Create table manually using migration`);
  }
}

/**
 * Main self-healing process
 */
async function selfHeal() {
  console.log('🔄 BEAST MODE Self-Healing System');
  console.log('='.repeat(60));
  console.log(`🎯 Target Quality: ${QUALITY_THRESHOLD}+`);
  console.log(`📁 Files to analyze: ${TARGET_FILES.length}\n`);
  
  const results = [];
  
  for (const filePath of TARGET_FILES) {
    console.log(`\n📊 Analyzing: ${filePath}`);
    console.log('-'.repeat(60));
    
    // Analyze
    const analysis = analyzeCodeQuality(filePath);
    
    if (analysis.error) {
      console.log(`   ❌ ${analysis.error}`);
      continue;
    }
    
    console.log(`   ✅ Quality Score: ${analysis.qualityScore}/100`);
    console.log(`   📋 Issues: ${analysis.issues.length}`);
    console.log(`   📏 Lines: ${analysis.metrics.linesOfCode}`);
    console.log(`   🔧 Complexity: ${analysis.metrics.complexity}`);
    console.log(`   🛡️  Type Safety: ${analysis.metrics.typeSafety.toFixed(1)}%`);
    
    if (analysis.issues.length > 0) {
      console.log(`\n   Issues found:`);
      analysis.issues.forEach(issue => {
        const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`      ${icon} [${issue.severity}] ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}`);
      });
    }
    
    // Generate improvements
    const improvements = generateImprovements(analysis);
    if (improvements.length > 0) {
      console.log(`\n   💡 Improvements needed:`);
      improvements.forEach(imp => {
        console.log(`      • [${imp.priority}] ${imp.description}`);
      });
    }
    
    // Track in Supabase
    const tracking = await trackQuality(filePath, analysis);
    if (tracking) {
      console.log(`   💾 Quality tracked in Supabase`);
    }
    
    results.push({
      file: filePath,
      ...analysis,
      improvements,
      tracking
    });
  }
  
  // Summary
  console.log('\n\n📊 Summary');
  console.log('='.repeat(60));
  
  const avgScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const filesMeetingThreshold = results.filter(r => r.qualityScore >= QUALITY_THRESHOLD).length;
  
  results.forEach(result => {
    const status = result.qualityScore >= QUALITY_THRESHOLD ? '✅' : '⚠️';
    console.log(`${status} ${result.file}`);
    console.log(`   Score: ${result.qualityScore}/100 | Issues: ${result.issues.length}`);
  });
  
  console.log(`\n📈 Overall Metrics:`);
  console.log(`   Average Quality: ${avgScore.toFixed(1)}/100`);
  console.log(`   Files Meeting Threshold: ${filesMeetingThreshold}/${results.length}`);
  console.log(`   Total Issues: ${totalIssues}`);
  
  if (avgScore >= QUALITY_THRESHOLD && filesMeetingThreshold === results.length) {
    console.log('\n🎉 SUCCESS! All code meets quality threshold!');
    return { success: true, avgScore };
  } else {
    console.log(`\n⚠️  Quality below threshold. Apply improvements and run again.`);
    return { success: false, avgScore, improvements: results.flatMap(r => r.improvements) };
  }
}

if (require.main === module) {
  selfHeal().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { selfHeal, analyzeCodeQuality };
