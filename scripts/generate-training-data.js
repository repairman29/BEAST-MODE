#!/usr/bin/env node
/**
 * Generate Complete Training Data
 * 
 * Since we don't have real user interactions, this script:
 * 1. Generates quality predictions for multiple repos
 * 2. Generates synthetic feedback for those predictions
 * 3. Repeats until we have 50+ predictions with feedback
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

// Diverse set of repos to analyze
const REPOS_TO_ANALYZE = [
  'facebook/react',
  'vercel/next.js',
  'microsoft/vscode',
  'nodejs/node',
  'python/cpython',
  'django/django',
  'tensorflow/tensorflow',
  'pytorch/pytorch',
  'rust-lang/rust',
  'golang/go',
  'kubernetes/kubernetes',
  'rails/rails',
  'spring-projects/spring-boot',
  'microsoft/TypeScript',
  'apache/kafka',
  'elastic/elasticsearch',
  'dotnet/core',
  'microsoft/dotnet',
  'opencv/opencv',
  'bitcoin/bitcoin',
  'mongodb/mongo',
  'redis/redis',
  'postgres/postgres',
  'docker/docker-ce',
  'ansible/ansible',
  'hashicorp/terraform',
  'prometheus/prometheus',
  'grafana/grafana',
  'jenkinsci/jenkins',
  'gitlabhq/gitlabhq',
  'github/linguist',
  'octocat/Hello-World',
  'jquery/jquery',
  'lodash/lodash',
  'moment/moment',
  'expressjs/express',
  'socketio/socket.io',
  'webpack/webpack',
  'babel/babel',
  'eslint/eslint',
  'prettier/prettier',
  'jestjs/jest',
  'cypress-io/cypress',
  'storybookjs/storybook',
  'mui/material-ui',
  'ant-design/ant-design',
  'tailwindlabs/tailwindcss',
  'sveltejs/svelte',
  'vuejs/vue',
  'angular/angular'
];

function generateFeedbackScore(predictedQuality) {
  let baseScore = predictedQuality;
  const variance = (Math.random() - 0.5) * 0.3;
  baseScore = Math.max(0, Math.min(1, baseScore + variance));
  
  if (Math.random() < 0.1) {
    baseScore = Math.random() * 0.5;
  }
  
  return Math.round(baseScore * 100) / 100;
}

function generateFeedbackSource(predictedQuality) {
  const rand = Math.random();
  if (predictedQuality > 0.7 && rand < 0.3) return 'recommendation_click';
  if (predictedQuality > 0.5 && rand < 0.4) return 'time_spent';
  if (rand < 0.2) return 'inline_button';
  return 'auto-inferred';
}

async function generateQualityPrediction(repo) {
  try {
    // Get the most recent prediction for this repo before making new one
    const { data: existing } = await supabase
      .from('ml_predictions')
      .select('id, created_at')
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .contains('context', { repo })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const beforeTime = existing?.created_at || new Date().toISOString();

    // Make quality prediction
    const response = await fetch(`${API_BASE}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        repo,
        platform: 'beast-mode'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Wait for async write
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Find the new prediction in database
    const { data: newPrediction, error } = await supabase
      .from('ml_predictions')
      .select('id, predicted_value')
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .contains('context', { repo })
      .gt('created_at', beforeTime)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !newPrediction) {
      // Fallback: try to find any recent prediction for this repo
      const { data: fallback } = await supabase
        .from('ml_predictions')
        .select('id, predicted_value')
        .eq('service_name', 'beast-mode')
        .eq('prediction_type', 'quality')
        .contains('context', { repo })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fallback) {
        return { id: fallback.id, quality: fallback.predicted_value };
      }
      return null;
    }

    return { id: newPrediction.id, quality: newPrediction.predicted_value };
  } catch (error) {
    console.warn(`   ⚠️  Failed to analyze ${repo}: ${error.message}`);
    return null;
  }
}

async function recordFeedback(predictionId, feedbackScore, source, context = {}) {
  try {
    // Wait for prediction to be written (with retries)
    let prediction = null;
    for (let retry = 0; retry < 10; retry++) {
      const { data, error } = await supabase
        .from('ml_predictions')
        .select('predicted_value')
        .eq('id', predictionId)
        .single();
      
      if (data && !error) {
        prediction = data;
        break;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!prediction) {
      throw new Error('Prediction not found in database after retries');
    }

    // Update ml_predictions directly with actual_value
    const error = Math.abs(prediction.predicted_value - feedbackScore);
    const { error: updateError } = await supabase
      .from('ml_predictions')
      .update({
        actual_value: feedbackScore,
        error: error,
        context: {
          ...context,
          source: source,
          inferred: source.includes('auto') || source.includes('inferred'),
          synthetic: true,
          feedback_collected_at: new Date().toISOString()
        }
      })
      .eq('id', predictionId);

    if (updateError) {
      throw updateError;
    }

    // Also write to ml_feedback table (now that prediction exists)
    try {
      await supabase
        .from('ml_feedback')
        .insert({
          prediction_id: predictionId,
          service_name: 'beast-mode',
          feedback_type: 'system',
          feedback_score: feedbackScore,
          metadata: {
            ...context,
            source: source,
            inferred: source.includes('auto') || source.includes('inferred'),
            synthetic: true,
            generatedAt: new Date().toISOString()
          }
        });
    } catch (fbError) {
      // Ignore ml_feedback errors - ml_predictions update is the important one
      if (fbError.code !== '23505') { // 23505 = duplicate (OK)
        console.warn(`   ⚠️  ml_feedback write failed: ${fbError.message}`);
      }
    }

    return true;
  } catch (error) {
    console.warn(`   ⚠️  Failed to record feedback: ${error.message}`);
    return false;
  }
}

async function getCurrentFeedbackCount() {
  const { data } = await supabase
    .from('ml_predictions')
    .select('id')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null);
  
  return data?.length || 0;
}

async function getPredictionQuality(predictionId) {
  // Try to get from database, with retries
  for (let i = 0; i < 3; i++) {
    const { data, error } = await supabase
      .from('ml_predictions')
      .select('predicted_value')
      .eq('id', predictionId)
      .single();
    
    if (data && !error) {
      return data.predicted_value || 0.5;
    }
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Fallback: use a reasonable default based on repo (we can infer from context)
  return 0.75; // Default to medium-high quality
}

async function main() {
  console.log('🚀 Generating Training Data for ML Model\n');
  console.log('='.repeat(50));
  console.log();

  const targetCount = 50;
  let currentCount = await getCurrentFeedbackCount();

  console.log(`📊 Current Status:`);
  console.log(`   Predictions with feedback: ${currentCount}`);
  console.log(`   Target for training: ${targetCount}`);
  console.log(`   Need to generate: ${targetCount - currentCount}\n`);

  if (currentCount >= targetCount) {
    console.log('✅ Already have enough feedback for training!');
    console.log(`   Run: npm run ml:train`);
    return;
  }

  const needed = targetCount - currentCount;
  console.log(`🎯 Generating ${needed} predictions with feedback...\n`);

  let predictionsGenerated = 0;
  let feedbackGenerated = 0;
  let failed = 0;

  // Process repos in batches
  const batchSize = 5;
  for (let i = 0; i < REPOS_TO_ANALYZE.length && feedbackGenerated < needed; i += batchSize) {
    const batch = REPOS_TO_ANALYZE.slice(i, i + batchSize);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} repos)...`);

    // Generate predictions
    const predictionPromises = batch.map(async (repo) => {
      const result = await generateQualityPrediction(repo);
      if (result && result.id) {
        predictionsGenerated++;
        console.log(`   ✅ ${repo} → ${result.id.substring(0, 8)}... (Quality: ${(result.quality * 100).toFixed(1)}%)`);
      }
      return { repo, prediction: result };
    });

    const results = await Promise.all(predictionPromises);

    // Generate feedback for successful predictions
    for (const { repo, prediction } of results) {
      if (!prediction || !prediction.id || feedbackGenerated >= needed) continue;

      try {
        const predictedQuality = prediction.quality || 0.75;
        const feedbackScore = generateFeedbackScore(predictedQuality);
        const source = generateFeedbackSource(predictedQuality);

        const context = {
          repo,
          synthetic: true,
          pattern: predictedQuality > 0.7 ? 'high-quality' : predictedQuality > 0.4 ? 'medium-quality' : 'low-quality'
        };

        if (source === 'recommendation_click') {
          context.recommendation = 'Add comprehensive README';
        } else if (source === 'time_spent') {
          context.timeSpentMs = Math.floor(Math.random() * 30000) + 5000;
        }

        const success = await recordFeedback(prediction.id, feedbackScore, source, context);
        
        if (success) {
          feedbackGenerated++;
          console.log(`   💡 Feedback: ${(feedbackScore * 100).toFixed(1)}% (${source})`);
        } else {
          failed++;
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`   ⚠️  Failed to generate feedback for ${repo}: ${error.message}`);
        failed++;
      }
    }

    console.log();
  }

  // Final check
  currentCount = await getCurrentFeedbackCount();

  console.log('='.repeat(50));
  console.log('📊 Generation Summary:');
  console.log(`   ✅ Predictions generated: ${predictionsGenerated}`);
  console.log(`   ✅ Feedback generated: ${feedbackGenerated}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total with feedback: ${currentCount}`);
  console.log();

  if (currentCount >= targetCount) {
    console.log('🎉 Training Ready!');
    console.log(`   You now have ${currentCount} predictions with feedback.`);
    console.log(`   Run: npm run ml:train`);
  } else {
    console.log(`⏳ Need ${targetCount - currentCount} more predictions with feedback.`);
    console.log(`   Run this script again or make more quality predictions.`);
  }
  console.log();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
