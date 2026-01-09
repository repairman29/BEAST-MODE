#!/usr/bin/env node
/**
 * Train first ML model when enough data is available
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });
const { createClient } = require('@supabase/supabase-js');
const { ModelTrainer } = require('../lib/mlops/modelTrainer');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function trainFirstModel() {
  console.log('🚀 Training First ML Model...\n');

  try {
    // Check if we have enough data (check ml_predictions with actual_value)
    const { data: predictionsWithFeedback, error: fError } = await supabase
      .from('ml_predictions')
      .select('id')
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .not('actual_value', 'is', null);
    
    const feedbackCount = predictionsWithFeedback?.length || 0;

    if (fError) {
      throw fError;
    }

    if (feedbackCount < 50) {
      console.log(`⚠️  Not enough data to train`);
      console.log(`   Current: ${feedbackCount} examples`);
      console.log(`   Need: 50+ examples`);
      console.log(`   Missing: ${50 - feedbackCount} examples\n`);
      console.log('💡 To improve feedback collection:');
      console.log('   npm run ml:improve-feedback');
      return;
    }

    console.log(`✅ Enough data! (${feedbackCount} examples)\n`);

    // Check MLflow is running
    try {
      await fetch('http://localhost:5000/health');
      console.log('✅ MLflow server is running\n');
    } catch (e) {
      console.log('⚠️  MLflow server not running. Starting...\n');
      const { execSync } = require('child_process');
      execSync('npm run mlflow:start', { stdio: 'inherit' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Train models
    console.log('📊 Training models...\n');

    const trainer = new ModelTrainer();
    
    // Train Code Quality Predictor
    console.log('1. Training Code Quality Predictor...');
    await trainer.trainCodeQualityModel();
    
    // Train Narrative Quality Predictor
    console.log('\n2. Training Narrative Quality Predictor...');
    await trainer.trainNarrativeQualityModel();
    
    // Train Search Relevance Predictor
    console.log('\n3. Training Search Relevance Predictor...');
    await trainer.trainSearchRelevanceModel();

    console.log('\n✅ All models trained!');
    console.log('   View in MLflow: http://localhost:5000');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  trainFirstModel().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { trainFirstModel };
