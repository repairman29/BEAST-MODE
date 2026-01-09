#!/usr/bin/env node
/**
 * Generate 100+ More Predictions with Feedback
 * 
 * This script:
 * 1. Calls the quality API for 100+ diverse repositories
 * 2. Waits for predictions to be written to database
 * 3. Generates synthetic feedback for all new predictions
 * 4. Reaches 150+ total predictions with feedback
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

// Expanded list of 100+ diverse repositories
const REPOS_TO_ANALYZE = [
  // JavaScript/TypeScript
  'facebook/react', 'vercel/next.js', 'microsoft/vscode', 'nodejs/node',
  'microsoft/TypeScript', 'angular/angular', 'vuejs/vue', 'sveltejs/svelte',
  'webpack/webpack', 'babel/babel', 'eslint/eslint', 'prettier/prettier',
  'jestjs/jest', 'cypress-io/cypress', 'storybookjs/storybook',
  'mui/material-ui', 'ant-design/ant-design', 'tailwindlabs/tailwindcss',
  'socketio/socket.io', 'expressjs/express', 'lodash/lodash', 'moment/moment',
  'jquery/jquery', 'axios/axios', 'threejs/three.js', 'd3/d3',
  
  // Python
  'python/cpython', 'django/django', 'tensorflow/tensorflow', 'pytorch/pytorch',
  'flask/flask', 'fastapi/fastapi', 'pandas-dev/pandas', 'numpy/numpy',
  'scikit-learn/scikit-learn', 'matplotlib/matplotlib', 'requests/requests',
  'psf/requests', 'celery/celery', 'scrapy/scrapy', 'ansible/ansible',
  
  // Rust
  'rust-lang/rust', 'tokio-rs/tokio', 'serde-rs/serde', 'clap-rs/clap',
  'actix/actix-web', 'diesel-rs/diesel', 'hyperium/hyper',
  
  // Go
  'golang/go', 'kubernetes/kubernetes', 'gohugoio/hugo', 'gin-gonic/gin',
  'etcd-io/etcd', 'prometheus/prometheus', 'grafana/grafana',
  'hashicorp/terraform', 'hashicorp/vault', 'hashicorp/consul',
  
  // Ruby
  'rails/rails', 'jekyll/jekyll', 'discourse/discourse', 'gitlabhq/gitlabhq',
  'ruby/ruby', 'sidekiq/sidekiq', 'carrierwaveuploader/carrierwave',
  
  // Java
  'spring-projects/spring-boot', 'apache/kafka', 'elastic/elasticsearch',
  'apache/spark', 'apache/flink', 'apache/cassandra', 'apache/hadoop',
  'eclipse/eclipse', 'netty/netty', 'square/okhttp',
  
  // C/C++
  'microsoft/terminal', 'opencv/opencv', 'bitcoin/bitcoin', 'torvalds/linux',
  'apple/swift', 'microsoft/cpprestsdk', 'nlohmann/json',
  
  // C#
  'dotnet/core', 'dotnet/roslyn', 'microsoft/dotnet', 'aspnet/AspNetCore',
  'microsoft/vscode', 'microsoft/monaco-editor',
  
  // Databases
  'mongodb/mongo', 'redis/redis', 'postgres/postgres', 'mysql/mysql-server',
  'sqlite/sqlite', 'couchdb/couchdb', 'neo4j/neo4j',
  
  // DevOps/Infrastructure
  'docker/docker-ce', 'kubernetes/kubernetes', 'jenkinsci/jenkins',
  'ansible/ansible', 'hashicorp/terraform', 'prometheus/prometheus',
  'grafana/grafana', 'gitlabhq/gitlabhq', 'github/linguist',
  
  // Other Popular
  'octocat/Hello-World', 'torvalds/linux', 'apple/swift',
  'microsoft/vscode', 'atom/atom', 'facebook/react-native',
  'facebook/create-react-app', 'vercel/vercel', 'zeit/next.js',
  
  // Additional diverse repos
  'mozilla/firefox', 'google/chrome', 'microsoft/edge',
  'adobe/spectrum-css', 'stripe/stripe-node', 'twilio/twilio-node',
  'aws/aws-sdk-js', 'googleapis/google-api-nodejs-client',
  'facebook/jest', 'testing-library/react-testing-library',
  'reduxjs/redux', 'mobxjs/mobx', 'immerjs/immer',
  'date-fns/date-fns', 'moment/moment-timezone', 'dayjs/dayjs',
  'chartjs/Chart.js', 'plotly/plotly.js', 'apache/echarts',
  'gatsbyjs/gatsby', 'nuxt/nuxt.js', 'remix-run/remix',
  'prisma/prisma', 'typeorm/typeorm', 'sequelize/sequelize',
  'nestjs/nest', 'loopbackio/loopback-next', 'adonisjs/core'
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

    // Also write to ml_feedback table
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
      // Ignore ml_feedback errors
      if (fbError.code !== '23505') {
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

async function main() {
  console.log('🚀 Generating 100+ More Predictions with Feedback\n');
  console.log('='.repeat(50));
  console.log();

  const targetCount = 150; // 50 existing + 100 new = 150 total
  let currentCount = await getCurrentFeedbackCount();

  console.log(`📊 Current Status:`);
  console.log(`   Predictions with feedback: ${currentCount}`);
  console.log(`   Target: ${targetCount} total`);
  console.log(`   Need to generate: ${targetCount - currentCount}\n`);

  if (currentCount >= targetCount) {
    console.log('✅ Already have enough predictions with feedback!');
    return;
  }

  const needed = targetCount - currentCount;
  console.log(`🎯 Generating ${needed} predictions with feedback...\n`);

  let predictionsGenerated = 0;
  let feedbackGenerated = 0;
  let failed = 0;

  // Process repos in batches
  const batchSize = 10;
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
    console.log('🎉 Target Reached!');
    console.log(`   You now have ${currentCount} predictions with feedback.`);
    console.log(`   Ready for improved model training!`);
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
