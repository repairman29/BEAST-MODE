#!/usr/bin/env node

/**
 * Add Knowledge to Repository
 * 
 * Interactive script to add knowledge entries
 */

const readline = require('readline');
const { getKnowledgeRepository } = require('../lib/mlops/knowledgeRepository');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function addKnowledge() {
  console.log('📚 Add Knowledge to Repository\n');

  const repo = getKnowledgeRepository();
  await repo.initialize();

  // Show categories
  console.log('Available categories:');
  Object.entries(repo.categories).forEach(([key, name]) => {
    console.log(`  ${key}: ${name}`);
  });
  console.log('');

  // Get input
  const category = await question('Category: ');
  const title = await question('Title: ');
  const content = await question('Content (multi-line, end with empty line):\n');
  
  const tagsInput = await question('Tags (comma-separated): ');
  const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
  
  const source = await question('Source (optional): ') || 'manual';
  const priority = await question('Priority (high/medium/low): ') || 'medium';

  // Add knowledge
  try {
    const entry = await repo.addKnowledge(category, title, content, {
      source,
      tags,
      priority
    });

    console.log(`\n✅ Knowledge added successfully!`);
    console.log(`   ID: ${entry.id}`);
    console.log(`   Category: ${entry.category}`);
    console.log(`   Title: ${entry.title}`);
    
    // Show stats
    const stats = await repo.getStats();
    console.log(`\n📊 Knowledge Base: ${stats.total} total entries`);
  } catch (error) {
    console.error(`\n❌ Failed to add knowledge: ${error.message}`);
    process.exit(1);
  }

  rl.close();
}

addKnowledge().catch(console.error);
