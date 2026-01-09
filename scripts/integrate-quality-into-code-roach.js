#!/usr/bin/env node
/**
 * Integrate Quality Predictions into Code Roach
 * 
 * Adds quality prediction helper to Code Roach's fix application service
 */

const fs = require('fs');
const path = require('path');

const CODE_ROACH_FIX_SERVICE = path.join(__dirname, '../../smuggler-code-roach/src/services/fixApplicationService.js');

function integrateQualityPredictions() {
  console.log('🔧 Integrating Quality Predictions into Code Roach\n');
  console.log('='.repeat(70));
  console.log();

  if (!fs.existsSync(CODE_ROACH_FIX_SERVICE)) {
    console.error('❌ Code Roach fix service not found:', CODE_ROACH_FIX_SERVICE);
    return;
  }

  let content = fs.readFileSync(CODE_ROACH_FIX_SERVICE, 'utf8');

  // Check if already integrated
  if (content.includes('qualityPredictionHelper')) {
    console.log('✅ Quality predictions already integrated');
    return;
  }

  // Add import at top
  const importPattern = /(const|require\().*feedbackIntegration/;
  if (importPattern.test(content)) {
    content = content.replace(
      importPattern,
      `const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');\n$&`
    );
  } else {
    // Add after other requires
    const requireSection = content.match(/(const.*=.*require\([^)]+\);?\n)+/);
    if (requireSection) {
      content = content.replace(
        requireSection[0],
        `${requireSection[0]}const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');\n`
      );
    }
  }

  // Find recordFixApplication method
  const recordMethodPattern = /async recordFixApplication\([^)]+\)\s*\{/;
  if (recordMethodPattern.test(content)) {
    // Add quality check before fix application
    const qualityCheckCode = `
    // Get quality prediction for repo (if available)
    let qualityPredictionId = null;
    try {
      const helper = getQualityPredictionHelper();
      const repo = error.source || metadata.filePath?.split('/')[0] || metadata.repo;
      if (repo && repo.includes('/')) {
        const qualityData = await helper.getQuality(repo);
        qualityPredictionId = qualityData.predictionId;
        // Use quality to adjust fix confidence
        if (qualityData.quality < 0.5) {
          fix.confidence = Math.min(fix.confidence, 0.7); // Lower confidence for low-quality repos
        }
      }
    } catch (error) {
      log.debug('Quality prediction not available:', error.message);
    }
    `;

    content = content.replace(
      recordMethodPattern,
      `$&\n${qualityCheckCode}`
    );

    // Add outcome recording after fix result
    const outcomeRecordingCode = `
    // Record quality prediction outcome
    if (qualityPredictionId) {
      try {
        const helper = getQualityPredictionHelper();
        const fixSuccess = success && (!rollbackId || rollbackId === null);
        await helper.recordOutcome(qualityPredictionId, fixSuccess, {
          repo: error.source || metadata.filePath?.split('/')[0],
          botName: 'code-roach',
          fixType: fix.type,
          applied: true,
          reverted: !!rollbackId,
          success: fixSuccess
        });
      } catch (error) {
        log.debug('Failed to record quality outcome:', error.message);
      }
    }
    `;

    // Find where success is determined
    const successPattern = /(const|let)\s+success\s*=/;
    if (successPattern.test(content)) {
      // Add after success is set
      const successMatch = content.match(successPattern);
      if (successMatch) {
        const index = content.indexOf(successMatch[0]);
        const nextSemicolon = content.indexOf(';', index);
        if (nextSemicolon > 0) {
          content = content.slice(0, nextSemicolon + 1) + outcomeRecordingCode + content.slice(nextSemicolon + 1);
        }
      }
    }
  }

  // Write back
  fs.writeFileSync(CODE_ROACH_FIX_SERVICE, content, 'utf8');

  console.log('✅ Quality predictions integrated into Code Roach');
  console.log();
  console.log('💡 Code Roach will now:');
  console.log('   1. Get quality predictions before applying fixes');
  console.log('   2. Adjust fix confidence based on quality');
  console.log('   3. Record fix success/failure as feedback');
  console.log();
}

integrateQualityPredictions();
