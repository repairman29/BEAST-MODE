#!/usr/bin/env node
/**
 * Build IDE from User Stories
 * 
 * Uses BEAST MODE APIs to generate IDE features from user stories
 */

const fs = require('fs');
const path = require('path');

const USER_STORIES_PATH = path.join(__dirname, '../../beast-mode-ide/docs/user-stories/ALL_STORIES.json');
const OUTPUT_DIR = path.join(__dirname, '../app/ide');
const COMPONENTS_DIR = path.join(__dirname, '../components/ide');

console.log('🚀 Building IDE from User Stories\n');
console.log('='.repeat(60));
console.log('');

// Load user stories
let stories = [];
try {
  const storiesData = fs.readFileSync(USER_STORIES_PATH, 'utf8');
  stories = JSON.parse(storiesData);
  console.log(`✅ Loaded ${stories.length} user stories\n`);
} catch (error) {
  console.error('❌ Error loading user stories:', error.message);
  process.exit(1);
}

// Filter P0 stories by category
const categories = {
  editor: stories.filter(s => s.priority === 'P0' && (s.category === 'editor' || s.category === 'Editor')),
  terminal: stories.filter(s => s.priority === 'P0' && (s.category === 'terminal' || s.category === 'Terminal')),
  filesystem: stories.filter(s => s.priority === 'P0' && (s.category === 'file-system' || s.category === 'File System')),
  ai: stories.filter(s => s.priority === 'P0' && (s.category === 'ai' || s.category === 'AI')),
  quality: stories.filter(s => s.priority === 'P0' && (s.category === 'quality' || s.category === 'Quality')),
};

console.log('📊 P0 Stories by Category:');
Object.entries(categories).forEach(([cat, stories]) => {
  console.log(`   ${cat}: ${stories.length} stories`);
});
console.log('');

// Create directories
[OUTPUT_DIR, COMPONENTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('\n✅ Ready to build IDE features from user stories!');
console.log('\n📋 Next Steps:');
console.log('   1. Install dependencies: npm install @monaco-editor/react xterm @xterm/addon-fit idb');
console.log('   2. Create core components');
console.log('   3. Implement features from P0 stories');
console.log('   4. Test and iterate');
