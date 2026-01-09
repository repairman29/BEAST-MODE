#!/usr/bin/env node
/**
 * Integrate Bot Feedback into Quality API
 * 
 * When bots use quality predictions, automatically track their success/failure
 * and use it as feedback to improve the model.
 * 
 * This creates a hook in the Quality API to track bot usage and outcomes.
 */

const fs = require('fs');
const path = require('path');

const QUALITY_API_PATH = path.join(__dirname, '../website/app/api/repos/quality/route.ts');

/**
 * Add bot feedback tracking to Quality API
 */
function integrateBotFeedbackTracking() {
  console.log('🔧 Integrating Bot Feedback Tracking into Quality API\n');
  console.log('='.repeat(70));
  console.log();

  if (!fs.existsSync(QUALITY_API_PATH)) {
    console.error('❌ Quality API not found:', QUALITY_API_PATH);
    return;
  }

  let content = fs.readFileSync(QUALITY_API_PATH, 'utf8');

  // Check if already integrated
  if (content.includes('botFeedbackTracker')) {
    console.log('✅ Bot feedback tracking already integrated');
    return;
  }

  // Find where predictionId is set
  const predictionIdPattern = /predictionId\s*=\s*require\('crypto'\)\.randomUUID\(\);/;
  
  if (!predictionIdPattern.test(content)) {
    console.warn('⚠️  Could not find predictionId assignment pattern');
    console.log('   Manual integration may be needed');
    return;
  }

  // Add bot feedback tracking after prediction is stored
  const trackingCode = `
    // Track bot usage if detected
    if (platform === 'beast-mode' || platform === 'bot' || request.headers.get('user-agent')?.includes('bot')) {
      // Bot is using this prediction - we'll track outcome later
      // Store bot context for later outcome tracking
      try {
        const { getDatabaseWriter } = require('../../../../../lib/mlops/databaseWriter');
        const databaseWriter = getDatabaseWriter();
        if (databaseWriter && predictionId) {
          // Update context to mark as bot-used
          await supabase
            .from('ml_predictions')
            .update({
              context: {
                ...responseData.context,
                botUsed: true,
                botUsedAt: new Date().toISOString(),
                platform: platform
              }
            })
            .eq('id', predictionId);
        }
      } catch (error) {
        console.warn('[Quality API] Failed to track bot usage:', error.message);
      }
    }
  `;

  // Insert after predictionId is set
  content = content.replace(
    predictionIdPattern,
    `$&\n${trackingCode}`
  );

  fs.writeFileSync(QUALITY_API_PATH, content, 'utf8');

  console.log('✅ Bot feedback tracking integrated into Quality API');
  console.log();
  console.log('💡 Next steps:');
  console.log('   1. When bots use quality predictions, they\'re now tracked');
  console.log('   2. Run capture-bot-outcomes-as-feedback.js to infer outcomes');
  console.log('   3. Or bots can directly call /api/feedback/bot with outcomes');
  console.log();
}

integrateBotFeedbackTracking();
