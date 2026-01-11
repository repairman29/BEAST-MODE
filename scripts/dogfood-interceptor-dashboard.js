#!/usr/bin/env node

/**
 * Dogfood BEAST MODE - Analyze and Improve Interceptor Dashboard
 * 
 * Uses BEAST MODE to analyze the code we just wrote, find issues,
 * and generate improvements until quality is high.
 * 
 * Usage:
 *   node scripts/dogfood-interceptor-dashboard.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = process.env.BEAST_MODE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TARGET_FILES = [
  'website/components/beast-mode/InterceptorDashboard.tsx',
  'website/app/api/intercepted-commits/stats/route.ts',
  'website/app/api/intercepted-commits/route.ts'
];

const QUALITY_THRESHOLD = 90; // Target quality score

/**
 * Analyze code file with BEAST MODE
 */
async function analyzeCode(filePath) {
  console.log(`\n📊 Analyzing: ${filePath}`);
  console.log('='.repeat(60));
  
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  File not found: ${fullPath}`);
    return null;
  }
  
  const code = fs.readFileSync(fullPath, 'utf8');
  
  try {
    // Use BEAST MODE's codebase chat to analyze
    const response = await axios.post(`${BASE_URL}/api/codebase/chat`, {
      sessionId: `dogfood-analysis-${Date.now()}`,
      message: `Analyze this TypeScript/React code for quality issues:

File: ${filePath}

\`\`\`typescript
${code}
\`\`\`

Please provide:
1. Quality score (0-100)
2. Issues found (with severity: critical, high, medium, low)
3. Specific improvements needed
4. Code smells or anti-patterns
5. Performance concerns
6. Accessibility issues
7. Type safety issues
8. Best practices violations

Format your response as JSON:
{
  "qualityScore": 85,
  "issues": [
    {
      "severity": "high",
      "type": "performance",
      "message": "Missing React.memo for expensive component",
      "line": 45,
      "suggestion": "Wrap component with React.memo"
    }
  ],
  "improvements": [
    "Add error boundaries",
    "Implement proper loading states"
  ],
  "codeSmells": [],
  "performance": [],
  "accessibility": [],
  "typeSafety": []
}`,
      repo: 'BEAST-MODE-PRODUCT',
      useLLM: true
    }, {
      timeout: 60000
    });
    
    if (response.data && response.data.message) {
      let analysis = response.data.message;
      
      // Try to extract JSON from response
      const jsonMatch = analysis.match(/\{[\s\S]*"qualityScore"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log('   ⚠️  Could not parse JSON, using raw response');
        }
      }
      
      return {
        raw: analysis,
        qualityScore: extractScore(analysis)
      };
    }
    
    return null;
  } catch (error) {
    console.log(`   ❌ Analysis failed: ${error.message}`);
    return null;
  }
}

/**
 * Extract quality score from text
 */
function extractScore(text) {
  const scoreMatch = text.match(/quality.*score[:\s]+(\d+)/i) || 
                     text.match(/score[:\s]+(\d+)/i) ||
                     text.match(/(\d+)\/100/i);
  return scoreMatch ? parseInt(scoreMatch[1]) : null;
}

/**
 * Generate improved code using BEAST MODE
 */
async function generateImprovement(filePath, issues) {
  console.log(`\n🔧 Generating improvements for: ${filePath}`);
  console.log('='.repeat(60));
  
  const fullPath = path.join(__dirname, '..', filePath);
  const originalCode = fs.readFileSync(fullPath, 'utf8');
  
  const issuesText = issues.map((issue, idx) => 
    `${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.message}${issue.suggestion ? ` - ${issue.suggestion}` : ''}${issue.line ? ` (line ${issue.line})` : ''}`
  ).join('\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/codebase/chat`, {
      sessionId: `dogfood-improve-${Date.now()}`,
      message: `Improve this code by fixing the following issues:

File: ${filePath}

Issues to fix:
${issuesText}

Original code:
\`\`\`typescript
${originalCode}
\`\`\`

Requirements:
1. Fix ALL issues listed above
2. Maintain existing functionality
3. Follow React/TypeScript best practices
4. Keep the same component structure
5. Preserve all props and interfaces
6. Add proper error handling if missing
7. Improve type safety
8. Add accessibility improvements
9. Optimize performance where needed

Return ONLY the complete improved code, no explanations, no markdown code blocks. Just the TypeScript code.`,
      repo: 'BEAST-MODE-PRODUCT',
      useLLM: true
    }, {
      timeout: 120000
    });
    
    if (response.data && response.data.message) {
      let improvedCode = response.data.message;
      
      // Extract code from markdown if present
      if (improvedCode.includes('```')) {
        const codeBlockMatch = improvedCode.match(/```(?:tsx|typescript|ts)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
          improvedCode = codeBlockMatch[1].trim();
        } else {
          improvedCode = improvedCode.replace(/```(?:tsx|typescript|ts)?\n?/g, '').replace(/```\n?/g, '').trim();
        }
      }
      
      if (improvedCode.length > originalCode.length * 0.5) {
        return improvedCode;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`   ❌ Improvement generation failed: ${error.message}`);
    return null;
  }
}

/**
 * Save improvement tracking
 */
function saveTracking(filePath, analysis, improvement) {
  const trackingDir = path.join(__dirname, '..', 'reports', 'dogfood');
  if (!fs.existsSync(trackingDir)) {
    fs.mkdirSync(trackingDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const trackingFile = path.join(trackingDir, `interceptor-dashboard-${Date.now()}.json`);
  
  const tracking = {
    timestamp,
    file: filePath,
    analysis,
    improvement: improvement ? {
      generated: true,
      codeLength: improvement.length
    } : {
      generated: false
    },
    qualityScore: analysis.qualityScore || analysis.score || null
  };
  
  fs.writeFileSync(trackingFile, JSON.stringify(tracking, null, 2));
  console.log(`   💾 Tracking saved: ${trackingFile}`);
  
  return trackingFile;
}

/**
 * Main dogfood process
 */
async function dogfood() {
  console.log('🐕 BEAST MODE Dogfooding - Self-Improvement');
  console.log('='.repeat(60));
  console.log(`📡 API: ${BASE_URL}`);
  console.log(`🎯 Target Quality: ${QUALITY_THRESHOLD}+`);
  console.log(`📁 Files to analyze: ${TARGET_FILES.length}\n`);
  
  const results = [];
  
  for (const filePath of TARGET_FILES) {
    // Step 1: Analyze
    const analysis = await analyzeCode(filePath);
    
    if (!analysis) {
      console.log(`   ⚠️  Skipping ${filePath} - analysis failed`);
      continue;
    }
    
    const qualityScore = analysis.qualityScore || analysis.score || 0;
    console.log(`   ✅ Quality Score: ${qualityScore}/100`);
    
    if (analysis.issues && analysis.issues.length > 0) {
      console.log(`   📋 Issues found: ${analysis.issues.length}`);
      analysis.issues.forEach(issue => {
        console.log(`      • [${issue.severity}] ${issue.message}`);
      });
    }
    
    // Step 2: Generate improvements if quality is below threshold
    let improvedCode = null;
    if (qualityScore < QUALITY_THRESHOLD && analysis.issues && analysis.issues.length > 0) {
      const criticalIssues = analysis.issues.filter(i => 
        i.severity === 'critical' || i.severity === 'high'
      );
      
      if (criticalIssues.length > 0) {
        improvedCode = await generateImprovement(filePath, criticalIssues);
        
        if (improvedCode) {
          // Save improved version
          const backupPath = filePath.replace('.tsx', '.tsx.backup').replace('.ts', '.ts.backup');
          const backupFullPath = path.join(__dirname, '..', backupPath);
          fs.writeFileSync(backupFullPath, fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8'));
          console.log(`   💾 Backup saved: ${backupPath}`);
          
          // Write improved code
          fs.writeFileSync(path.join(__dirname, '..', filePath), improvedCode, 'utf8');
          console.log(`   ✅ Improved code written to: ${filePath}`);
          
          // Re-analyze to check improvement
          console.log(`\n   🔄 Re-analyzing improved code...`);
          const reAnalysis = await analyzeCode(filePath);
          if (reAnalysis) {
            const newScore = reAnalysis.qualityScore || reAnalysis.score || 0;
            console.log(`   📊 New Quality Score: ${newScore}/100 (${newScore - qualityScore > 0 ? '+' : ''}${newScore - qualityScore})`);
          }
        }
      }
    } else if (qualityScore >= QUALITY_THRESHOLD) {
      console.log(`   🎉 Quality threshold met! (${qualityScore} >= ${QUALITY_THRESHOLD})`);
    }
    
    // Step 3: Save tracking
    const trackingFile = saveTracking(filePath, analysis, improvedCode);
    
    results.push({
      file: filePath,
      qualityScore,
      issues: analysis.issues?.length || 0,
      improved: improvedCode !== null,
      trackingFile
    });
  }
  
  // Summary
  console.log('\n📊 Summary');
  console.log('='.repeat(60));
  results.forEach(result => {
    const status = result.qualityScore >= QUALITY_THRESHOLD ? '✅' : '⚠️';
    console.log(`${status} ${result.file}`);
    console.log(`   Quality: ${result.qualityScore}/100`);
    console.log(`   Issues: ${result.issues}`);
    console.log(`   Improved: ${result.improved ? 'Yes' : 'No'}`);
  });
  
  const avgScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
  console.log(`\n📈 Average Quality Score: ${avgScore.toFixed(1)}/100`);
  console.log(`🎯 Target: ${QUALITY_THRESHOLD}+`);
  
  if (avgScore >= QUALITY_THRESHOLD) {
    console.log('\n🎉 SUCCESS! All code meets quality threshold!');
  } else {
    console.log(`\n⚠️  Quality below threshold. Run again to continue improvements.`);
  }
}

if (require.main === module) {
  dogfood().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { dogfood, analyzeCode, generateImprovement };
