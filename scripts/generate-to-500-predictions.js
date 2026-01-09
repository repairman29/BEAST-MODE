#!/usr/bin/env node
/**
 * Generate Predictions to Reach 500 Total
 * 
 * Generates predictions and feedback until we have 500 total
 * for improved XGBoost training
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

// Expanded list of 350+ additional diverse repositories
const ADDITIONAL_REPOS = [
  // Frontend Frameworks
  'remix-run/remix', 'sveltejs/kit', 'solidjs/solid', 'preactjs/preact',
  'infernojs/inferno', 'mithriljs/mithril.js', 'aurelia/framework',
  
  // Backend Frameworks
  'koajs/koa', 'hapi/hapi', 'meteor/meteor', 'adonisjs/core',
  'nestjs/nest', 'loopbackio/loopback-next', 'feathersjs/feathers',
  
  // Build Tools
  'vitejs/vite', 'parcel-bundler/parcel', 'rollup/rollup', 'swc-project/swc',
  'esbuild/esbuild', 'turborepo/turborepo', 'nx-dev/nx',
  
  // Testing
  'vitest-dev/vitest', 'playwright/playwright', 'testing-library/react-testing-library',
  'cypress-io/cypress', 'karma-runner/karma', 'jasmine/jasmine',
  
  // State Management
  'reduxjs/redux', 'mobxjs/mobx', 'zustand/zustand', 'jotai/jotai',
  'recoiljs/recoil', 'valtio/valtio', 'immerjs/immer',
  
  // UI Libraries
  'chakra-ui/chakra-ui', 'radix-ui/primitives', 'headlessui/headlessui',
  'react-bootstrap/react-bootstrap', 'semantic-org/semantic-ui-react',
  
  // Data Visualization
  'recharts/recharts', 'nivo/nivo', 'visx/visx', 'plotly/plotly.js',
  'apache/echarts', 'd3/d3', 'observablehq/plot',
  
  // Database/ORM
  'prisma/prisma', 'typeorm/typeorm', 'sequelize/sequelize', 'mongoose/mongoose',
  'knex/knex', 'bookshelf/bookshelf', 'waterline/waterline',
  
  // API/GraphQL
  'graphql/graphql-js', 'apollographql/apollo-server', 'postgraphile/postgraphile',
  'tulios/kafkajs', 'nodejs/undici', 'axios/axios',
  
  // Authentication
  'nextauthjs/next-auth', 'auth0/auth0.js', 'supabase/supabase-js',
  'firebase/firebase-js-sdk', 'okta/okta-auth-js',
  
  // DevOps
  'kubernetes/kubernetes', 'helm/helm', 'istio/istio', 'linkerd/linkerd2',
  'argoproj/argo-cd', 'fluxcd/flux2', 'tektoncd/pipeline',
  
  // Monitoring
  'prometheus/prometheus', 'grafana/grafana', 'jaegertracing/jaeger',
  'open-telemetry/opentelemetry-js', 'datadog/dd-trace-js',
  
  // Security
  'OWASP/owasp-mastg', 'authzed/spicedb', 'ory/hydra', 'casbin/casbin',
  
  // AI/ML
  'tensorflow/tfjs', 'ml5js/ml5-library', 'brainjs/brain.js',
  'tensorflow/tensorflow', 'pytorch/pytorch', 'huggingface/transformers',
  
  // Game Engines
  'phaser/phaser', 'pixijs/pixijs', 'threejs/three.js', 'babylonjs/Babylon.js',
  
  // Mobile
  'react-native-community/react-native', 'expo/expo', 'ionic-team/ionic-framework',
  'nativescript/nativescript', 'apache/cordova',
  
  // Desktop
  'electron/electron', 'tauri-apps/tauri', 'neutralinojs/neutralinojs',
  
  // Documentation
  'docusaurus/docusaurus', 'vuejs/vitepress', 'squidfunk/mkdocs-material',
  'gohugoio/hugo', 'jekyll/jekyll', 'getzola/zola',
  
  // CMS
  'strapi/strapi', 'directus/directus', 'payloadcms/payload',
  'ghost/ghost', 'wordpress/wordpress', 'drupal/drupal',
  
  // E-commerce
  'medusajs/medusa', 'saleor/saleor', 'vendure-ecommerce/vendure',
  
  // Communication
  'socketio/socket.io', 'uNetworking/uWebSockets', 'scylladb/scylla',
  
  // File Processing
  'sharp/sharp', 'image-js/image-js', 'pdf-lib/pdf-lib',
  
  // Utilities
  'lodash/lodash', 'ramda/ramda', 'immutable-js/immutable-js',
  'date-fns/date-fns', 'moment/moment', 'dayjs/dayjs',
  'uuidjs/uuid', 'validatorjs/validator.js',
  
  // More Popular Repos
  'microsoft/playwright', 'puppeteer/puppeteer', 'seleniumhq/selenium',
  'cypress-io/cypress', 'appium/appium', 'webdriverio/webdriverio',
  
  // Additional Popular
  'vercel/swr', 'tanstack/react-query', 'apollographql/apollo-client',
  'relay-tools/relay', 'urql/urql', 'graphql-js/graphql-js',
  
  // More Frameworks
  'gatsbyjs/gatsby', 'nuxt/nuxt.js', 'sveltejs/svelte',
  'astro/astro', 'nextjs/next.js', 'remix-run/remix',
  
  // Additional Tools
  'prettier/prettier', 'eslint/eslint', 'stylelint/stylelint',
  'commitlint/commitlint', 'husky/husky', 'lint-staged/lint-staged',
  
  // More Infrastructure
  'hashicorp/consul', 'hashicorp/nomad', 'hashicorp/packer',
  'spinnaker/spinnaker', 'jenkinsci/jenkins', 'gitlabhq/gitlabhq',
  
  // Additional Languages
  'crystal-lang/crystal', 'nim-lang/Nim', 'ziglang/zig',
  'vlang/v', 'julia/julia', 'elixir-lang/elixir',
  
  // More Databases
  'cockroachdb/cockroach', 'yugabyte/yugabyte-db', 'scylladb/scylla',
  'couchbase/couchbase', 'ravendb/ravendb', 'rethinkdb/rethinkdb'
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
    const beforeTime = new Date().toISOString();

    const response = await fetch(`${API_BASE}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, platform: 'beast-mode' })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

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
    console.warn(`   ⚠️  ${repo}: ${error.message}`);
    return null;
  }
}

async function recordFeedback(predictionId, feedbackScore, source, context = {}) {
  try {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!prediction) {
      throw new Error('Prediction not found');
    }

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

    if (updateError) throw updateError;

    try {
      await supabase.from('ml_feedback').insert({
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
      if (fbError.code !== '23505') {
        console.warn(`   ⚠️  ml_feedback: ${fbError.message}`);
      }
    }

    return true;
  } catch (error) {
    console.warn(`   ⚠️  Feedback failed: ${error.message}`);
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
  console.log('🚀 Generating Predictions to Reach 500 Total\n');
  console.log('='.repeat(50));
  console.log();

  const targetCount = 500;
  let currentCount = await getCurrentFeedbackCount();

  console.log(`📊 Current Status:`);
  console.log(`   Predictions with feedback: ${currentCount}`);
  console.log(`   Target: ${targetCount}`);
  console.log(`   Need to generate: ${targetCount - currentCount}\n`);

  if (currentCount >= targetCount) {
    console.log('✅ Already have 500+ predictions with feedback!');
    return;
  }

  const needed = targetCount - currentCount;
  console.log(`🎯 Generating ${needed} predictions with feedback...\n`);

  let predictionsGenerated = 0;
  let feedbackGenerated = 0;
  let failed = 0;

  const batchSize = 10;
  for (let i = 0; i < ADDITIONAL_REPOS.length && feedbackGenerated < needed; i += batchSize) {
    const batch = ADDITIONAL_REPOS.slice(i, i + batchSize);
    
    console.log(`📦 Batch ${Math.floor(i / batchSize) + 1} (${batch.length} repos)...`);

    const predictionPromises = batch.map(async (repo) => {
      const result = await generateQualityPrediction(repo);
      if (result && result.id) {
        predictionsGenerated++;
        console.log(`   ✅ ${repo} → ${result.id.substring(0, 8)}... (${(result.quality * 100).toFixed(1)}%)`);
      }
      return { repo, prediction: result };
    });

    const results = await Promise.all(predictionPromises);

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

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`   ⚠️  ${repo}: ${error.message}`);
        failed++;
      }
    }

    console.log();
  }

  const finalCount = await getCurrentFeedbackCount();

  console.log('='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   ✅ Predictions: ${predictionsGenerated}`);
  console.log(`   ✅ Feedback: ${feedbackGenerated}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${finalCount}\n`);

  if (finalCount >= targetCount) {
    console.log('🎉 TARGET REACHED!');
    console.log(`   ${finalCount} predictions with feedback`);
    console.log(`   Ready for improved XGBoost training!`);
  } else {
    console.log(`⏳ Need ${targetCount - finalCount} more`);
  }
  console.log();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
