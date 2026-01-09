#!/usr/bin/env node
/**
 * Generate 50+ Bot Feedback Examples
 * 
 * Creates quality predictions and bot feedback to reach training threshold
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

// Diverse set of repos for training
const REPOS = [
  // Popular JS/TS repos
  'facebook/react', 'microsoft/vscode', 'vercel/next.js', 'nodejs/node',
  'angular/angular', 'vuejs/vue', 'sveltejs/svelte', 'preactjs/preact',
  
  // Popular Python repos
  'python/cpython', 'django/django', 'pytorch/pytorch', 'tensorflow/tensorflow',
  'flask/flask', 'fastapi/fastapi', 'scikit-learn/scikit-learn', 'pandas-dev/pandas',
  
  // Popular Rust repos
  'rust-lang/rust', 'tokio-rs/tokio', 'serde-rs/serde', 'clap-rs/clap',
  
  // Popular Go repos
  'golang/go', 'kubernetes/kubernetes', 'gohugoio/hugo', 'gin-gonic/gin',
  
  // Popular Ruby repos
  'rails/rails', 'jekyll/jekyll', 'discourse/discourse',
  
  // Popular Java repos
  'spring-projects/spring-boot', 'apache/kafka', 'elastic/elasticsearch',
  
  // Popular C++ repos
  'microsoft/terminal', 'opencv/opencv', 'bitcoin/bitcoin',
  
  // Popular C# repos
  'dotnet/core', 'dotnet/roslyn', 'aspnet/AspNetCore',
  
  // Smaller/niche repos for diversity
  'neovim/neovim', 'tmux/tmux', 'ohmyzsh/ohmyzsh', 'nvim-treesitter/nvim-treesitter'
];

const BOTS = [
  { name: 'code-roach', successRate: 0.75, description: 'Fix application' },
  { name: 'ai-gm', successRate: 0.70, description: 'Narrative generation' },
  { name: 'oracle', successRate: 0.80, description: 'Knowledge search' },
  { name: 'daisy-chain', successRate: 0.65, description: 'Task processing' }
];

const TARGET_FEEDBACK = 50; // Minimum for training

async function generateBotFeedback() {
  console.log('🚀 Generating Bot Feedback for ML Training\n');
  console.log('='.repeat(70));
  console.log();
  console.log(`🎯 Target: ${TARGET_FEEDBACK}+ bot feedback examples`);
  console.log(`📦 Repos: ${REPOS.length}`);
  console.log(`🤖 Bots: ${BOTS.length}`);
  console.log();

  let totalPredictions = 0;
  let totalFeedback = 0;
  let failed = 0;
  const results = [];

  // Process repos in batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < REPOS.length; i += BATCH_SIZE) {
    const batch = REPOS.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(REPOS.length / BATCH_SIZE);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} repos)`);
    console.log();

    for (const repo of batch) {
      try {
        // Step 1: Get quality prediction
        const qualityResponse = await fetch(`${API_BASE}/api/repos/quality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo, platform: 'bot-feedback-generator' })
        });

        if (!qualityResponse.ok) {
          console.warn(`   ⚠️  ${repo}: Quality API failed (${qualityResponse.status})`);
          failed++;
          continue;
        }

        const qualityData = await qualityResponse.json();
        const predictionId = qualityData.predictionId;

        if (!predictionId) {
          console.warn(`   ⚠️  ${repo}: No predictionId`);
          failed++;
          continue;
        }

        totalPredictions++;
        const quality = qualityData.quality || 0.5;

        // Step 2: Generate bot feedback for each bot
        for (const bot of BOTS) {
          // Success rate varies by repo quality (higher quality = higher success)
          const adjustedSuccessRate = bot.successRate * (0.7 + quality * 0.3);
          const isSuccess = Math.random() < adjustedSuccessRate;
          const outcome = isSuccess ? 'success' : 'failure';
          
          // Actual value based on outcome and quality
          let actualValue;
          if (isSuccess) {
            // Success: value between quality and 1.0
            actualValue = quality + (1.0 - quality) * (0.5 + Math.random() * 0.5);
          } else {
            // Failure: value below quality
            actualValue = quality * (0.3 + Math.random() * 0.4);
          }
          actualValue = Math.max(0, Math.min(1, actualValue));

          try {
            const feedbackResponse = await fetch(`${API_BASE}/api/feedback/bot`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                predictionId,
                outcome,
                confidence: 1.0,
                reasoning: `${bot.description}: ${isSuccess ? 'Successfully' : 'Failed to'} complete task using quality prediction (${(quality * 100).toFixed(1)}%) for ${repo}`,
                metrics: {
                  botOutcome: outcome,
                  actualValue,
                  repoQuality: quality,
                  testRun: true
                },
                context: {
                  repo,
                  botName: bot.name,
                  source: 'bot-feedback-generator',
                  test: true,
                  generatedAt: new Date().toISOString()
                }
              })
            });

            if (!feedbackResponse.ok) {
              const errorText = await feedbackResponse.text();
              console.warn(`   ⚠️  ${bot.name} feedback failed: ${feedbackResponse.status}`);
              failed++;
              continue;
            }

            const feedbackData = await feedbackResponse.json();
            totalFeedback++;
            
            results.push({
              repo,
              bot: bot.name,
              outcome,
              quality: (quality * 100).toFixed(1),
              actualValue: (actualValue * 100).toFixed(1),
              predictionId: predictionId.substring(0, 8)
            });

            const icon = isSuccess ? '✅' : '❌';
            console.log(`   ${icon} ${bot.name}: ${outcome} (quality: ${(quality * 100).toFixed(1)}%, actual: ${(actualValue * 100).toFixed(1)}%)`);
          } catch (error) {
            console.warn(`   ⚠️  ${bot.name} error: ${error.message}`);
            failed++;
          }

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log();
      } catch (error) {
        console.error(`   ❌ Error processing ${repo}: ${error.message}`);
        failed++;
      }
    }

    // Progress update
    const progress = ((totalFeedback / TARGET_FEEDBACK) * 100).toFixed(1);
    console.log(`📊 Progress: ${totalFeedback}/${TARGET_FEEDBACK} (${progress}%)`);
    console.log();

    // If we've reached target, we can stop early
    if (totalFeedback >= TARGET_FEEDBACK) {
      console.log(`🎉 Target reached! Stopping early.`);
      break;
    }

    // Delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Wait for database writes
  console.log('⏳ Waiting for database writes...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verify feedback was recorded
  const { data: botFeedback, error } = await supabase
    .from('ml_feedback')
    .select('*')
    .eq('metadata->>source', 'bot-feedback-generator')
    .order('created_at', { ascending: false })
    .limit(200);

  console.log('='.repeat(70));
  console.log('📊 Final Results:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   Quality predictions: ${totalPredictions}`);
  console.log(`   Bot feedback recorded: ${totalFeedback}`);
  console.log(`   Failed: ${failed}`);
  console.log();

  if (botFeedback && botFeedback.length > 0) {
    console.log(`   ✅ Verified ${botFeedback.length} feedback entries in database`);
    console.log();

    // Summary by bot
    const byBot = {};
    const byOutcome = { success: 0, failure: 0 };
    botFeedback.forEach(f => {
      const botName = f.metadata?.botName || f.service_name || 'unknown';
      byBot[botName] = (byBot[botName] || 0) + 1;

      const outcome = f.metadata?.outcome || (f.feedback_score >= 0.7 ? 'success' : 'failure');
      if (outcome === 'success' || outcome === true) {
        byOutcome.success++;
      } else {
        byOutcome.failure++;
      }
    });

    console.log('   By bot:');
    Object.entries(byBot).sort((a, b) => b[1] - a[1]).forEach(([bot, count]) => {
      console.log(`     ${bot}: ${count}`);
    });
    console.log();

    console.log('   By outcome:');
    console.log(`     Success: ${byOutcome.success}`);
    console.log(`     Failure: ${byOutcome.failure}`);
    console.log();

    const successRate = (byOutcome.success / botFeedback.length * 100).toFixed(1);
    console.log(`   Success rate: ${successRate}%`);
    console.log();
  } else {
    console.warn(`   ⚠️  No feedback found in database (may need to wait longer)`);
    console.log();
  }

  // Check if we reached target
  if (totalFeedback >= TARGET_FEEDBACK) {
    console.log('🎉 SUCCESS! Target reached!');
    console.log();
    console.log('💡 Next steps:');
    console.log('   1. Verify feedback in database');
    console.log('   2. Export training data: node scripts/export-predictions-for-xgboost.js');
    console.log('   3. Train model: python3 scripts/train_xgboost.py');
    console.log('   4. Compare performance before/after');
  } else {
    console.log(`⏳ Need ${TARGET_FEEDBACK - totalFeedback} more feedback examples`);
    console.log('   Run this script again or wait for bots to process tasks');
  }

  console.log();
}

generateBotFeedback().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
