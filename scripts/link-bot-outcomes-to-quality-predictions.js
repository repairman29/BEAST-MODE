#!/usr/bin/env node
/**
 * Link Bot Outcomes to Quality Predictions
 * 
 * Find bot outcomes (fix success, task completion, etc.) and link them
 * to quality predictions based on repo name and timestamp.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Find quality predictions that match bot outcomes
 */
async function linkBotOutcomes() {
  console.log('🔗 Linking Bot Outcomes to Quality Predictions\n');
  console.log('='.repeat(70));
  console.log();

  // Get all quality predictions without feedback
  const { data: qualityPredictions, error: qError } = await supabase
    .from('ml_predictions')
    .select('*')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .is('actual_value', null)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (qError) {
    console.error('❌ Error:', qError.message);
    return;
  }

  console.log(`📊 Found ${qualityPredictions.length} quality predictions without feedback`);
  console.log();

  // Get predictions from other services that might have outcomes
  const { data: otherPredictions, error: oError } = await supabase
    .from('ml_predictions')
    .select('*')
    .in('service_name', ['code-roach', 'ai-gm', 'oracle', 'daisy-chain'])
    .not('actual_value', 'is', null) // Only ones with outcomes
    .order('created_at', { ascending: false })
    .limit(1000);

  if (oError) {
    console.error('❌ Error:', oError.message);
    return;
  }

  console.log(`📊 Found ${otherPredictions.length} bot predictions with outcomes`);
  console.log();

  // Match by repo and time window (within 1 hour)
  let linked = 0;
  let recorded = 0;
  let failed = 0;

  for (const qualityPred of qualityPredictions) {
    const repo = qualityPred.context?.repo;
    if (!repo) continue;

    const qualityTime = new Date(qualityPred.created_at);
    const oneHourLater = new Date(qualityTime.getTime() + 60 * 60 * 1000);
    const oneHourEarlier = new Date(qualityTime.getTime() - 60 * 60 * 1000);

    // Find matching bot predictions
    const matching = otherPredictions.filter(botPred => {
      const botRepo = botPred.context?.repo || botPred.context?.repository;
      if (botRepo !== repo) return false;

      const botTime = new Date(botPred.created_at);
      return botTime >= oneHourEarlier && botTime <= oneHourLater;
    });

    if (matching.length > 0) {
      // Use the most recent matching prediction
      const botPred = matching.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0];

      const outcome = botPred.actual_value;
      linked++;

      console.log(`   🔗 ${repo}`);
      console.log(`      Quality: ${qualityPred.id.substring(0, 8)}... (${new Date(qualityPred.created_at).toLocaleString()})`);
      console.log(`      Bot: ${botPred.service_name} ${botPred.id.substring(0, 8)}... (${(outcome * 100).toFixed(0)}%)`);
      console.log(`      Time diff: ${Math.abs(new Date(botPred.created_at) - qualityTime) / 1000 / 60} minutes`);

      // Record as feedback
      try {
        const { error: updateError } = await supabase
          .from('ml_predictions')
          .update({
            actual_value: outcome,
            error: Math.abs(qualityPred.predicted_value - outcome),
            context: {
              ...qualityPred.context,
              botOutcome: outcome >= 0.7 ? 'success' : 'failure',
              linkedFrom: botPred.service_name,
              linkedPredictionId: botPred.id,
              linkedAt: new Date().toISOString()
            }
          })
          .eq('id', qualityPred.id);

        if (updateError) {
          throw updateError;
        }

        // Also record in ml_feedback
        await supabase.from('ml_feedback').insert({
          prediction_id: qualityPred.id,
          service_name: 'beast-mode',
          feedback_type: 'bot',
          feedback_score: outcome,
          metadata: {
            source: 'bot-outcome-link',
            botService: botPred.service_name,
            botPredictionId: botPred.id,
            linkedAt: new Date().toISOString(),
            timeDiffMinutes: Math.abs(new Date(botPred.created_at) - qualityTime) / 1000 / 60
          }
        });

        recorded++;
        console.log(`      ✅ Linked and recorded`);
      } catch (error) {
        failed++;
        console.warn(`      ⚠️  Failed: ${error.message}`);
      }

      console.log();
    }
  }

  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   Quality predictions: ${qualityPredictions.length}`);
  console.log(`   Bot predictions: ${otherPredictions.length}`);
  console.log(`   Linked: ${linked}`);
  console.log(`   Recorded: ${recorded}`);
  console.log(`   Failed: ${failed}`);
  console.log();

  if (recorded > 0) {
    console.log('✅ Bot outcomes linked to quality predictions!');
    console.log(`   ${recorded} new feedback entries created`);
    console.log();
  } else {
    console.log('⚠️  No matches found');
    console.log('   Bots may not be using quality predictions, or timing doesn\'t match');
    console.log();
  }
}

linkBotOutcomes().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
