#!/usr/bin/env node

/**
 * Fine-Tune Model with Knowledge Base
 * 
 * Fine-tunes a model using knowledge base training data
 */

const path = require('path');
const { getKnowledgeRepository } = require('../lib/mlops/knowledgeRepository');
const { getModelFineTuning } = require('../lib/mlops/modelFineTuning');

async function fineTuneWithKnowledge() {
  const category = process.argv[2] || null;
  const baseModel = process.argv[3] || 'quality-predictor-v3-advanced.json';

  console.log('🎯 Fine-Tuning Model with Knowledge Base...\n');

  // 1. Get knowledge as training data
  console.log('📚 Step 1: Loading knowledge...');
  const repo = getKnowledgeRepository();
  const trainingData = await repo.toTrainingData(category);
  
  if (trainingData.length === 0) {
    console.error('❌ No training data found!');
    console.log('   Run: node scripts/initialize-knowledge-base.js first');
    process.exit(1);
  }

  console.log(`   ✅ Loaded ${trainingData.length} training examples\n`);

  // 2. Prepare data for fine-tuning
  console.log('🔧 Step 2: Preparing training data...');
  const preparedData = trainingData.map(example => ({
    features: {
      instruction: example.instruction,
      input: example.input,
      category: example.category,
      ...example.metadata
    },
    quality: 1.0, // High quality knowledge
    output: example.output
  }));

  console.log(`   ✅ Prepared ${preparedData.length} examples\n`);

  // 3. Fine-tune model
  console.log('🚀 Step 3: Fine-tuning model...');
  const { ModelFineTuning } = require('../lib/mlops/modelFineTuning');
  const fineTuning = new ModelFineTuning();
  await fineTuning.initialize();

  const result = await fineTuning.fineTuneModel(
    baseModel,
    preparedData,
    {
      learningRate: 0.0001, // Lower for knowledge injection
      epochs: 5,
      batchSize: 16
    }
  );

  if (result.success) {
    console.log('\n✅ Fine-tuning successful!');
    console.log(`   Model: ${result.modelPath}`);
    console.log(`   Version: ${result.version}`);
    console.log(`   Metrics: ${JSON.stringify(result.metrics, null, 2)}`);
    console.log('\n🎯 Model is now trained on:');
    console.log(`   - UX Principles`);
    console.log(`   - Software Engineering Best Practices`);
    console.log(`   - Design Patterns`);
    console.log(`   - Code Quality Standards`);
  } else {
    console.error('\n❌ Fine-tuning failed:', result.error);
    process.exit(1);
  }
}

fineTuneWithKnowledge().catch(console.error);
