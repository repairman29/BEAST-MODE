#!/usr/bin/env node
/**
 * Generate Synthetic Feedback for ML Training
 * 
 * Since we don't have real user interactions yet, this script:
 * 1. Gets recent predictions from the database
 * 2. Generates synthetic feedback based on realistic patterns
 * 3. Simulates user interactions (recommendation clicks, time spent, etc.)
 * 4. Records feedback to reach training threshold (50+)
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

// Realistic feedback patterns
const FEEDBACK_PATTERNS = {
  // High quality repos get positive feedback
  highQuality: { min: 0.75, max: 0.95, probability: 0.7 },
  // Medium quality repos get mixed feedback
  mediumQuality: { min: 0.5, max: 0.8, probability: 0.6 },
  // Low quality repos get negative feedback
  lowQuality: { min: 0.2, max: 0.6, probability: 0.4 },
  // Recommendation clicks (positive engagement)
  recommendationClick: { score: 0.8, probability: 0.3 },
  // Time spent viewing (engagement)
  timeSpent: { min: 0.5, max: 0.7, probability: 0.4 }
};

function generateFeedbackScore(predictedQuality) {
  // Base feedback score correlates with predicted quality (with some variance)
  let baseScore = predictedQuality;
  
  // Add realistic variance (±0.15)
  const variance = (Math.random() - 0.5) * 0.3;
  baseScore = Math.max(0, Math.min(1, baseScore + variance));
  
  // Sometimes users disagree (10% chance of significant disagreement)
  if (Math.random() < 0.1) {
    baseScore = Math.random() * 0.5; // Low score despite high prediction
  }
  
  return Math.round(baseScore * 100) / 100; // Round to 2 decimals
}

function generateFeedbackSource(predictedQuality) {
  const rand = Math.random();
  
  // Higher quality predictions get more engagement
  if (predictedQuality > 0.7 && rand < 0.3) {
    return 'recommendation_click';
  }
  if (predictedQuality > 0.5 && rand < 0.4) {
    return 'time_spent';
  }
  if (rand < 0.2) {
    return 'inline_button';
  }
  return 'auto-inferred';
}

async function getRecentPredictions(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('ml_predictions')
      .select('id, predicted_value, service_name, prediction_type, created_at, context')
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .is('actual_value', null) // Only predictions without feedback
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching predictions:', error.message);
    return [];
  }
}

async function recordFeedback(predictionId, feedbackScore, source, context = {}) {
  try {
    // Use recordOutcome via feedback collector
    const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
    const collector = await getFeedbackCollector();
    
    if (!collector) {
      throw new Error('Feedback collector not available');
    }

    const result = await collector.recordOutcome(predictionId, feedbackScore, {
      ...context,
      source: source,
      inferred: source.includes('auto') || source.includes('inferred'),
      synthetic: true, // Mark as synthetic for testing
      generatedAt: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error(`Failed to record feedback for ${predictionId.substring(0, 8)}...:`, error.message);
    return null;
  }
}

async function generateSyntheticFeedback() {
  console.log('🎲 Generating Synthetic Feedback for ML Training\n');
  console.log('='.repeat(50));
  console.log();

  // Get recent predictions without feedback
  console.log('📊 Fetching recent predictions...');
  const predictions = await getRecentPredictions(100);
  console.log(`   Found ${predictions.length} predictions without feedback\n`);

  if (predictions.length === 0) {
    console.log('⚠️  No predictions found. Make some quality predictions first!');
    return;
  }

  // Check current feedback count
  const { data: existingFeedback } = await supabase
    .from('ml_predictions')
    .select('id')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null);

  const currentCount = existingFeedback?.length || 0;
  const targetCount = 50;
  const needed = Math.max(0, targetCount - currentCount);

  console.log(`📈 Current Status:`);
  console.log(`   Predictions with feedback: ${currentCount}`);
  console.log(`   Target for training: ${targetCount}`);
  console.log(`   Need to generate: ${needed}\n`);

  if (needed === 0) {
    console.log('✅ Already have enough feedback for training!');
    return;
  }

  // Generate feedback for needed predictions
  const toGenerate = Math.min(needed, predictions.length);
  console.log(`🎯 Generating feedback for ${toGenerate} predictions...\n`);

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < toGenerate; i++) {
    const prediction = predictions[i];
    const predictedQuality = prediction.predicted_value || 0.5;
    
    // Generate realistic feedback score
    const feedbackScore = generateFeedbackScore(predictedQuality);
    
    // Generate feedback source
    const source = generateFeedbackSource(predictedQuality);
    
    // Generate context
    const context = {
      repo: prediction.context?.repo || 'unknown',
      synthetic: true,
      pattern: predictedQuality > 0.7 ? 'high-quality' : predictedQuality > 0.4 ? 'medium-quality' : 'low-quality'
    };

    // Add source-specific context
    if (source === 'recommendation_click') {
      context.recommendation = 'Add comprehensive README';
      context.interactionType = 'click';
    } else if (source === 'time_spent') {
      context.timeSpentMs = Math.floor(Math.random() * 30000) + 5000; // 5-35 seconds
      context.interactionType = 'view';
    }

    console.log(`   [${i + 1}/${toGenerate}] ${prediction.id.substring(0, 8)}... Quality: ${(predictedQuality * 100).toFixed(1)}% → Feedback: ${(feedbackScore * 100).toFixed(1)}% (${source})`);

    const result = await recordFeedback(prediction.id, feedbackScore, source, context);

    if (result) {
      generated++;
    } else {
      failed++;
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log();
  console.log('='.repeat(50));
  console.log('📊 Generation Summary:');
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total with feedback: ${currentCount + generated}`);
  console.log();

  // Check if we reached the threshold
  const { data: updatedFeedback } = await supabase
    .from('ml_predictions')
    .select('id')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null);

  const newCount = updatedFeedback?.length || 0;

  if (newCount >= targetCount) {
    console.log('🎉 Training Ready!');
    console.log(`   You now have ${newCount} predictions with feedback.`);
    console.log(`   Run: npm run ml:train`);
  } else {
    console.log(`⏳ Need ${targetCount - newCount} more predictions with feedback.`);
    console.log(`   Run this script again after making more quality predictions.`);
  }
  console.log();
}

async function main() {
  try {
    await generateSyntheticFeedback();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
