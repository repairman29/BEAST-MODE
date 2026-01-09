#!/usr/bin/env node
/**
 * Generate Bot Feedback Directly via Database
 * 
 * Creates quality predictions and bot feedback directly in the database
 * No API server needed - works entirely with Supabase
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

// Diverse set of repos - expanded for more data
const REPOS = [
  // Popular JS/TS frameworks
  'facebook/react', 'microsoft/vscode', 'vercel/next.js', 'nodejs/node',
  'angular/angular', 'vuejs/vue', 'sveltejs/svelte', 'preactjs/preact',
  'microsoft/TypeScript', 'babel/babel', 'webpack/webpack', 'rollup/rollup',
  
  // Python ecosystem
  'python/cpython', 'django/django', 'pytorch/pytorch', 'tensorflow/tensorflow',
  'flask/flask', 'fastapi/fastapi', 'scikit-learn/scikit-learn', 'pandas-dev/pandas',
  'numpy/numpy', 'requests/requests', 'celery/celery', 'scrapy/scrapy',
  
  // Rust ecosystem
  'rust-lang/rust', 'tokio-rs/tokio', 'serde-rs/serde', 'clap-rs/clap',
  'actix/actix-web', 'diesel-rs/diesel', 'hyperium/hyper', 'rayon-rs/rayon',
  
  // Go ecosystem
  'golang/go', 'kubernetes/kubernetes', 'gohugoio/hugo', 'gin-gonic/gin',
  'etcd-io/etcd', 'prometheus/prometheus', 'golang/protobuf', 'hashicorp/terraform',
  
  // Ruby ecosystem
  'rails/rails', 'jekyll/jekyll', 'discourse/discourse', 'gitlabhq/gitlabhq',
  'ruby/ruby', 'carrierwaveuploader/carrierwave', 'sidekiq/sidekiq', 'puma/puma',
  
  // Java ecosystem
  'spring-projects/spring-boot', 'apache/kafka', 'elastic/elasticsearch',
  'apache/spark', 'apache/flink', 'netty/netty', 'hibernate/hibernate',
  
  // C++ ecosystem
  'microsoft/terminal', 'opencv/opencv', 'bitcoin/bitcoin', 'microsoft/calculator',
  'tensorflow/tensorflow', 'electron/electron', 'llvm/llvm-project', 'microsoft/cpprestsdk',
  
  // C# ecosystem
  'dotnet/core', 'dotnet/roslyn', 'aspnet/AspNetCore', 'microsoft/dotnet',
  'microsoft/vscode', 'microsoft/monaco-editor', 'microsoft/ApplicationInsights-dotnet',
  
  // Other popular repos
  'neovim/neovim', 'tmux/tmux', 'ohmyzsh/ohmyzsh', 'nvim-treesitter/nvim-treesitter',
  'redis/redis', 'postgres/postgres', 'mongodb/mongo', 'apache/airflow',
  'istio/istio', 'envoyproxy/envoy', 'containerd/containerd', 'docker/docker',
  
  // Frontend libraries
  'mui/material-ui', 'chakra-ui/chakra-ui', 'radix-ui/primitives', 'tailwindlabs/tailwindcss',
  'storybookjs/storybook', 'jestjs/jest', 'cypress-io/cypress', 'testing-library/react-testing-library',
  
  // Developer tools
  'eslint/eslint', 'prettier/prettier', 'swc-project/swc', 'babel/babel',
  'webpack/webpack', 'vitejs/vite', 'parcel-bundler/parcel', 'rollup/rollup'
];

const BOTS = [
  { name: 'code-roach', successRate: 0.75 },
  { name: 'ai-gm', successRate: 0.70 },
  { name: 'oracle', successRate: 0.80 },
  { name: 'daisy-chain', successRate: 0.65 }
];

const TARGET_FEEDBACK = 500; // Increased target for larger dataset

function generateBasicFeatures(repo) {
  // Generate realistic features based on repo name
  const isPopular = repo.includes('facebook') || repo.includes('microsoft') || 
                    repo.includes('google') || repo.includes('vercel');
  
  return {
    stars: isPopular ? Math.floor(50000 + Math.random() * 100000) : Math.floor(1000 + Math.random() * 10000),
    forks: isPopular ? Math.floor(5000 + Math.random() * 10000) : Math.floor(100 + Math.random() * 1000),
    hasReadme: true,
    hasLicense: Math.random() > 0.1,
    hasDescription: Math.random() > 0.2,
    hasTests: Math.random() > 0.3,
    hasCI: Math.random() > 0.4,
    fileCount: Math.floor(100 + Math.random() * 1000),
    openIssues: Math.floor(Math.random() * 100),
    repoAgeDays: Math.floor(365 + Math.random() * 2000),
    daysSincePush: Math.floor(Math.random() * 30)
  };
}

async function generateBotFeedbackDatabaseDirect() {
  console.log('🚀 Generating Bot Feedback Directly via Database\n');
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

  for (const repo of REPOS) {
    if (totalFeedback >= TARGET_FEEDBACK) {
      console.log(`🎉 Target reached! Stopping early.`);
      break;
    }

    console.log(`📊 Processing: ${repo}`);

    try {
      // Step 1: Create quality prediction directly in database
      const features = generateBasicFeatures(repo);
      const quality = 0.5 + Math.random() * 0.4; // 0.5-0.9
      const confidence = 0.6 + Math.random() * 0.3; // 0.6-0.9

      const { data: prediction, error: predError } = await supabase
        .from('ml_predictions')
        .insert({
          service_name: 'beast-mode',
          prediction_type: 'quality',
          predicted_value: quality,
          actual_value: null, // Will be set by feedback
          confidence: confidence,
          context: {
            repo,
            platform: 'bot-feedback-generator',
            features: features,
            hasRecommendations: true,
            percentile: Math.floor(50 + Math.random() * 40)
          },
          model_version: 'direct-generation',
          source: 'direct-database'
        })
        .select()
        .single();

      if (predError || !prediction) {
        console.warn(`   ⚠️  Failed to create prediction: ${predError?.message}`);
        failed++;
        continue;
      }

      totalPredictions++;
      const predictionId = prediction.id;

      // Step 2: Generate bot feedback for each bot
      for (const bot of BOTS) {
        // Success rate varies by repo quality
        const adjustedSuccessRate = bot.successRate * (0.7 + quality * 0.3);
        const isSuccess = Math.random() < adjustedSuccessRate;
        const outcome = isSuccess ? 'success' : 'failure';
        
        // Actual value based on outcome and quality
        let actualValue;
        if (isSuccess) {
          actualValue = quality + (1.0 - quality) * (0.5 + Math.random() * 0.5);
        } else {
          actualValue = quality * (0.3 + Math.random() * 0.4);
        }
        actualValue = Math.max(0, Math.min(1, actualValue));

        try {
          // Update prediction with actual value
          await supabase
            .from('ml_predictions')
            .update({ actual_value: actualValue })
            .eq('id', predictionId);

          // Create feedback entry
          const { data: feedback, error: fbError } = await supabase
            .from('ml_feedback')
            .insert({
              prediction_id: predictionId,
              service_name: 'beast-mode',
              feedback_type: 'bot',
              feedback_score: actualValue,
              feedback_text: `${bot.name} ${isSuccess ? 'succeeded' : 'failed'} when using quality prediction`,
              metadata: {
                repo,
                botName: bot.name,
                outcome: outcome,
                reasoning: `${bot.name} ${isSuccess ? 'succeeded' : 'failed'} when using quality prediction (${(quality * 100).toFixed(1)}%) for ${repo}`,
                metrics: {
                  botOutcome: outcome,
                  actualValue,
                  repoQuality: quality
                },
                source: 'bot-feedback-generator',
                test: true,
                generatedAt: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (fbError) {
            console.warn(`   ⚠️  ${bot.name} feedback failed: ${fbError.message}`);
            failed++;
            continue;
          }

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

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log();
    } catch (error) {
      console.error(`   ❌ Error processing ${repo}: ${error.message}`);
      failed++;
    }

    // Progress update
    const progress = ((totalFeedback / TARGET_FEEDBACK) * 100).toFixed(1);
    console.log(`📊 Progress: ${totalFeedback}/${TARGET_FEEDBACK} (${progress}%)`);
    console.log();
  }

  // Wait for database writes
  console.log('⏳ Waiting for database writes...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify feedback
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
  }

  // Check total predictions with feedback
  const { data: predictionsWithFeedback, error: predError } = await supabase
    .from('ml_predictions')
    .select('id')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null);

  const feedbackCount = predictionsWithFeedback?.length || 0;
  console.log(`   📈 Total predictions with feedback: ${feedbackCount}`);
  console.log();

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
    console.log('   Run this script again');
  }

  console.log();
}

generateBotFeedbackDatabaseDirect().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
