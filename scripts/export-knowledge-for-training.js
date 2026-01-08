#!/usr/bin/env node

/**
 * Export Knowledge for Fine-Tuning
 * 
 * Converts knowledge base into training data format for LLM fine-tuning
 */

const path = require('path');
const { getKnowledgeRepository } = require('../lib/mlops/knowledgeRepository');

async function exportKnowledge() {
  const category = process.argv[2] || null;
  const outputPath = path.join(
    __dirname,
    '../.beast-mode/training-data',
    `knowledge-base-${category || 'all'}-${Date.now()}.json`
  );

  console.log('📤 Exporting knowledge for training...\n');

  const repo = getKnowledgeRepository();
  const exportData = await repo.exportForFineTuning(outputPath, category);

  console.log(`✅ Exported ${exportData.count} training examples`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Category: ${exportData.category}`);
  console.log('\n📋 Training data format:');
  console.log('   - instruction: System prompt');
  console.log('   - input: User query/context');
  console.log('   - output: Expected response');
  console.log('   - category: Knowledge category');
  console.log('   - metadata: Additional context');
  console.log('\n🎯 Next: Use this file for fine-tuning your LLM model');
}

exportKnowledge().catch(console.error);
