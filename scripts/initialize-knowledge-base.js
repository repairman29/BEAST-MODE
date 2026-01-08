#!/usr/bin/env node

/**
 * Initialize Knowledge Base
 * 
 * Loads initial knowledge from files and prepares for training
 */

const path = require('path');
const { getKnowledgeRepository } = require('../lib/mlops/knowledgeRepository');
const fs = require('fs').promises;

async function initializeKnowledgeBase() {
  console.log('🚀 Initializing Knowledge Base...\n');

  const repo = getKnowledgeRepository();
  await repo.initialize();

  // Load UX principles
  console.log('📚 Loading UX Principles...');
  const uxPrinciplesPath = path.join(__dirname, '../knowledge-base/ux-principles/initial-principles.json');
  
  if (await fileExists(uxPrinciplesPath)) {
    await repo.loadKnowledgeFromFile(uxPrinciplesPath);
    console.log('   ✅ UX Principles loaded\n');
  } else {
    console.log('   ⚠️  UX Principles file not found\n');
  }

  // Get stats
  const stats = await repo.getStats();
  console.log('📊 Knowledge Base Statistics:');
  console.log(`   Total entries: ${stats.total}`);
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    if (count > 0) {
      console.log(`   ${category}: ${count}`);
    }
  });

  console.log('\n✅ Knowledge base initialized!');
  console.log('\nNext steps:');
  console.log('   1. Add more knowledge: node scripts/add-knowledge.js');
  console.log('   2. Export for training: node scripts/export-knowledge-for-training.js');
  console.log('   3. Fine-tune model: node scripts/fine-tune-with-knowledge.js');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

initializeKnowledgeBase().catch(console.error);
