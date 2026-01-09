#!/usr/bin/env node

/**
 * Self-Improvement Script for LLM Features
 * 
 * Uses BEAST MODE's self-improvement service to enhance all LLM feature code
 */

const path = require('path');
const fs = require('fs').promises;

const LLM_FEATURES = [
  'qualityExplainer.js',
  'issueRecommender.js',
  'commentGenerator.js',
  'errorMessageEnhancer.js',
  'llmCache.js',
  'documentationGenerator.js',
  'testGenerator.js',
  'securityAnalyzer.js',
  'refactoringSuggestions.js',
  'progressiveEnhancer.js',
  'performanceOptimizer.js',
  'apiDocumentationGenerator.js',
  'requestBatcher.js',
  'contextAwareModelSelector.js',
  'taskModelSelector.js',
  'ensembleGenerator.js',
  'qualityRouter.js',
  'modelFineTuner.js'
];

const FEATURES_DIR = path.join(__dirname, '../lib/mlops');
const UTILS_DIR = path.join(__dirname, '../lib/utils');

async function selfImproveFeatures() {
  console.log('🚀 Starting self-improvement for LLM features...\n');

  const results = {
    improved: [],
    skipped: [],
    errors: []
  };

  for (const feature of LLM_FEATURES) {
    try {
      const featurePath = path.join(FEATURES_DIR, feature);
      const utilsPath = path.join(UTILS_DIR, feature);
      
      let filePath;
      if (await fileExists(featurePath)) {
        filePath = featurePath;
      } else if (await fileExists(utilsPath)) {
        filePath = utilsPath;
      } else {
        console.log(`⚠️  Skipping ${feature} - file not found`);
        results.skipped.push(feature);
        continue;
      }

      console.log(`📝 Improving ${feature}...`);
      
      // Read current code
      const code = await fs.readFile(filePath, 'utf8');
      
      // Use self-improvement API
      const improved = await improveCode(code, feature, filePath);
      
      if (improved) {
        // Write improved code
        await fs.writeFile(filePath, improved, 'utf8');
        console.log(`✅ Improved ${feature}`);
        results.improved.push(feature);
      } else {
        console.log(`⏭️  No improvements needed for ${feature}`);
        results.skipped.push(feature);
      }
    } catch (error) {
      console.error(`❌ Error improving ${feature}:`, error.message);
      results.errors.push({ feature, error: error.message });
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Self-Improvement Summary:');
  console.log(`✅ Improved: ${results.improved.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.improved.length > 0) {
    console.log('✨ Improved Features:');
    results.improved.forEach(f => console.log(`   • ${f}`));
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('❌ Errors:');
    results.errors.forEach(({ feature, error }) => {
      console.log(`   • ${feature}: ${error}`);
    });
    console.log('');
  }
}

async function improveCode(code, fileName, filePath) {
  try {
    const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 
                          process.env.NEXT_PUBLIC_APP_URL || 
                          'http://localhost:3000';

    const response = await fetch(`${BEAST_MODE_API}/api/self-improvement/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo: 'BEAST-MODE-PRODUCT',
        targetFile: filePath,
        options: {
          focusAreas: ['code-quality', 'error-handling', 'performance', 'documentation'],
          autoApply: false,
          dryRun: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data.improvedCode) {
      return data.improvedCode;
    }

    if (data.generatedFiles && data.generatedFiles.length > 0) {
      const improved = data.generatedFiles[0];
      return improved.code || improved.content;
    }

    return null;
  } catch (error) {
    // Fallback: Use codebase chat for improvement
    try {
      return await improveViaChat(code, fileName);
    } catch (chatError) {
      console.warn(`Chat improvement failed: ${chatError.message}`);
      return null;
    }
  }
}

async function improveViaChat(code, fileName) {
  const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 
                        process.env.NEXT_PUBLIC_APP_URL || 
                        'http://localhost:3000';

  const response = await fetch(`${BEAST_MODE_API}/api/codebase/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: `self-improve-${Date.now()}`,
      message: `Improve this code for better quality, error handling, performance, and documentation. Return ONLY the improved code, no explanations:\n\n${code}`,
      repo: 'BEAST-MODE-PRODUCT',
      useLLM: true,
      model: 'custom:beast-mode-code-model'
    })
  });

  if (!response.ok) {
    throw new Error(`Chat API returned ${response.status}`);
  }

  const data = await response.json();
  return data.response || data.message || null;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  selfImproveFeatures().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { selfImproveFeatures };
