#!/usr/bin/env node
/**
 * Capture Bot Outcomes as Feedback
 * 
 * When bots use quality predictions and either succeed or fail,
 * we can use that as real feedback to improve the model.
 * 
 * This script:
 * 1. Finds predictions that bots have used
 * 2. Checks if bots succeeded or failed
 * 3. Records outcomes as feedback
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Determine bot outcome from prediction context
 * Bots either get it right (succeed) or don't (fail)
 */
function inferBotOutcome(prediction) {
  const context = prediction.context || {};
  const metadata = context.metadata || {};

  // Strategy 1: Check if bot outcome is explicitly recorded
  if (context.botOutcome !== undefined) {
    return context.botOutcome === 'success' || context.botOutcome === true ? 1.0 : 0.0;
  }

  if (metadata.botOutcome !== undefined) {
    return metadata.botOutcome === 'success' || metadata.botOutcome === true ? 1.0 : 0.0;
  }

  // Strategy 2: Check if fix was applied and not reverted (code-roach pattern)
  if (context.fixApplied && !context.fixReverted) {
    return 1.0; // Bot succeeded
  }
  if (context.fixApplied && context.fixReverted) {
    return 0.0; // Bot failed (had to revert)
  }

  // Strategy 3: Check validation results
  if (context.validation) {
    if (context.validation.passed === true) {
      return 1.0;
    }
    if (context.validation.passed === false) {
      return 0.0;
    }
    if (context.validation.score !== undefined) {
      return context.validation.score > 1 ? context.validation.score / 100 : context.validation.score;
    }
  }

  // Strategy 4: Check if prediction was used successfully
  // If a bot used the prediction and completed its task, that's success
  if (context.botUsed && context.taskCompleted) {
    return 1.0;
  }
  if (context.botUsed && context.taskFailed) {
    return 0.0;
  }

  // Strategy 5: Check service-specific patterns
  // Code Roach: fix success
  if (context.fixSuccess !== undefined) {
    return context.fixSuccess ? 1.0 : 0.0;
  }

  // AI GM: narrative quality
  if (context.narrativeQuality !== undefined) {
    return context.narrativeQuality > 1 ? context.narrativeQuality / 100 : context.narrativeQuality;
  }

  // Oracle: answer relevance
  if (context.answerRelevance !== undefined) {
    return context.answerRelevance > 1 ? context.answerRelevance / 100 : context.answerRelevance;
  }

  // No clear outcome found
  return null;
}

/**
 * Record bot outcome as feedback
 */
async function recordBotFeedback(predictionId, outcome, context = {}) {
  try {
    const response = await fetch(`${API_BASE}/api/feedback/bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionId,
        outcome: outcome >= 0.7 ? 'success' : outcome <= 0.3 ? 'failure' : 'partial',
        confidence: Math.abs(outcome - 0.5) * 2, // Higher confidence if outcome is extreme
        reasoning: `Bot outcome inferred from prediction context: ${outcome >= 0.7 ? 'success' : 'failure'}`,
        metrics: {
          outcomeValue: outcome,
          inferred: true,
          source: 'bot-outcome-inference'
        },
        context: {
          ...context,
          inferredAt: new Date().toISOString(),
          inferenceMethod: 'context-analysis'
        }
      })
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn(`   ⚠️  Failed to record bot feedback: ${error.message}`);
    return null;
  }
}

/**
 * Main function to capture bot outcomes
 */
async function captureBotOutcomes() {
  console.log('🤖 Capturing Bot Outcomes as Feedback\n');
  console.log('='.repeat(70));
  console.log();

  // Get predictions that might have bot outcomes
  // Look for predictions with context that suggests bot usage
  const { data: predictions, error } = await supabase
    .from('ml_predictions')
    .select('*')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .is('actual_value', null) // Only ones without feedback
    .not('context', 'is', null)
    .limit(1000);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Found ${predictions.length} predictions to analyze`);
  console.log();

  let processed = 0;
  let inferred = 0;
  let recorded = 0;
  let failed = 0;

  for (const prediction of predictions) {
    const outcome = inferBotOutcome(prediction);
    
    if (outcome !== null) {
      inferred++;
      console.log(`   ✅ ${prediction.id.substring(0, 8)}... → ${outcome >= 0.7 ? 'SUCCESS' : 'FAILURE'} (${(outcome * 100).toFixed(0)}%)`);
      
      const result = await recordBotFeedback(
        prediction.id,
        outcome,
        {
          repo: prediction.context?.repo,
          service: prediction.service_name,
          originalContext: prediction.context
        }
      );

      if (result && result.success) {
        recorded++;
      } else {
        failed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    processed++;
  }

  console.log();
  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   Processed: ${processed}`);
  console.log(`   Inferred outcomes: ${inferred}`);
  console.log(`   Recorded as feedback: ${recorded}`);
  console.log(`   Failed: ${failed}`);
  console.log();

  if (recorded > 0) {
    console.log('✅ Bot outcomes captured as feedback!');
    console.log(`   ${recorded} new feedback entries created`);
    console.log();
    console.log('💡 Next steps:');
    console.log('   1. Run: node scripts/track-feedback-collection-rate.js');
    console.log('   2. Export training data: node scripts/export-all-supabase-data.js');
    console.log('   3. Retrain model: python3 scripts/train_xgboost_improved.py');
    console.log();
  } else {
    console.log('⚠️  No bot outcomes found to capture');
    console.log('   Make sure bots are using quality predictions and recording outcomes');
    console.log();
  }
}

captureBotOutcomes().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
