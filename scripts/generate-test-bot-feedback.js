#!/usr/bin/env node
/**
 * Generate Test Bot Feedback
 * 
 * Creates test quality predictions and bot feedback to verify the system works
 */

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_REPOS = [
  'facebook/react',
  'microsoft/vscode',
  'vercel/next.js',
  'nodejs/node',
  'python/cpython'
];

const BOTS = [
  { name: 'code-roach', successRate: 0.8 },
  { name: 'ai-gm', successRate: 0.7 },
  { name: 'oracle', successRate: 0.75 },
  { name: 'daisy-chain', successRate: 0.65 }
];

async function generateTestBotFeedback() {
  console.log('🧪 Generating Test Bot Feedback\n');
  console.log('='.repeat(70));
  console.log();

  let totalPredictions = 0;
  let totalFeedback = 0;
  let failed = 0;

  for (const repo of TEST_REPOS) {
    console.log(`📊 Processing: ${repo}`);
    
    try {
      // Step 1: Get quality prediction
      const qualityResponse = await fetch(`${API_BASE}/api/repos/quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, platform: 'test-bot-feedback' })
      });

      if (!qualityResponse.ok) {
        console.warn(`   ⚠️  Quality API failed: ${qualityResponse.status}`);
        continue;
      }

      const qualityData = await qualityResponse.json();
      const predictionId = qualityData.predictionId;

      if (!predictionId) {
        console.warn(`   ⚠️  No predictionId returned`);
        continue;
      }

      totalPredictions++;
      console.log(`   ✅ Quality: ${(qualityData.quality * 100).toFixed(1)}% (ID: ${predictionId.substring(0, 8)}...)`);

      // Step 2: Generate bot feedback for each bot
      for (const bot of BOTS) {
        const isSuccess = Math.random() < bot.successRate;
        const outcome = isSuccess ? 'success' : 'failure';
        const actualValue = isSuccess ? 0.8 + Math.random() * 0.2 : Math.random() * 0.3;

        try {
          const feedbackResponse = await fetch(`${API_BASE}/api/feedback/bot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              predictionId,
              outcome,
              confidence: 1.0,
              reasoning: `Test ${bot.name} ${isSuccess ? 'succeeded' : 'failed'} when using quality prediction for ${repo}`,
              metrics: {
                botOutcome: outcome,
                actualValue,
                testRun: true
              },
              context: {
                repo,
                botName: bot.name,
                source: 'test-bot-feedback-generator',
                test: true
              }
            })
          });

          if (!feedbackResponse.ok) {
            const errorText = await feedbackResponse.text();
            console.warn(`   ⚠️  ${bot.name} feedback failed: ${feedbackResponse.status} - ${errorText}`);
            failed++;
            continue;
          }

          const feedbackData = await feedbackResponse.json();
          totalFeedback++;
          console.log(`   ✅ ${bot.name}: ${outcome} (${(actualValue * 100).toFixed(0)}%)`);
        } catch (error) {
          console.warn(`   ⚠️  ${bot.name} feedback error: ${error.message}`);
          failed++;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log();
    } catch (error) {
      console.error(`   ❌ Error processing ${repo}: ${error.message}`);
      failed++;
    }
  }

  // Wait for database writes
  console.log('⏳ Waiting for database writes...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify feedback was recorded
  const { data: botFeedback, error } = await supabase
    .from('ml_feedback')
    .select('*')
    .eq('metadata->>source', 'test-bot-feedback-generator')
    .order('created_at', { ascending: false })
    .limit(100);

  console.log('='.repeat(70));
  console.log('📊 Test Results:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   Quality predictions: ${totalPredictions}`);
  console.log(`   Bot feedback recorded: ${totalFeedback}`);
  console.log(`   Failed: ${failed}`);
  console.log();

  if (botFeedback && botFeedback.length > 0) {
    console.log(`   ✅ Verified ${botFeedback.length} feedback entries in database`);
    
    const byBot = {};
    botFeedback.forEach(f => {
      const botName = f.metadata?.botName || f.service_name || 'unknown';
      byBot[botName] = (byBot[botName] || 0) + 1;
    });

    console.log('   By bot:');
    Object.entries(byBot).forEach(([bot, count]) => {
      console.log(`     ${bot}: ${count}`);
    });
  } else {
    console.warn(`   ⚠️  No feedback found in database (may need to wait)`);
  }

  console.log();
  console.log('✅ Test complete!');
  console.log();
  console.log('💡 Next steps:');
  console.log('   1. Monitor bot feedback: node scripts/monitor-bot-feedback.js');
  console.log('   2. Check feedback dashboard: http://localhost:3000/feedback-dashboard');
  console.log('   3. Once you have 50+ real bot feedback, retrain the model');
  console.log();
}

generateTestBotFeedback().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
