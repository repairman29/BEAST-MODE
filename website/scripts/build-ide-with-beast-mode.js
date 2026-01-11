#!/usr/bin/env node
/**
 * Build IDE Features Using BEAST MODE APIs
 * 
 * Dogfooding: Use BEAST MODE to build BEAST MODE IDE
 * Generates code from user stories using our own APIs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const USER_STORIES_PATH = path.join(__dirname, '../../beast-mode-ide/docs/user-stories/ALL_STORIES.json');
const OUTPUT_DIR = path.join(__dirname, '../components/ide/features');
const API_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000/api/beast-mode/conversation';

console.log('🚀 Building IDE with BEAST MODE (Dogfooding)\n');
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

// Filter P0 stories
const p0Stories = stories.filter(s => s.priority === 'P0');
console.log(`📊 Found ${p0Stories.length} P0 (critical) stories\n`);

// Group by category
const categories = {
  'File Management': p0Stories.filter(s => s.category.includes('File Management')),
  'Code Editing': p0Stories.filter(s => s.category.includes('Code Editing')),
  'Terminal': p0Stories.filter(s => s.category.includes('Terminal')),
  'AI Assistance': p0Stories.filter(s => s.category.includes('AI')),
  'Quality Assurance': p0Stories.filter(s => s.category.includes('Quality')),
  'Code Completion': p0Stories.filter(s => s.category.includes('Code Completion')),
};

console.log('📋 P0 Stories by Category:');
Object.entries(categories).forEach(([cat, stories]) => {
  console.log(`   ${cat}: ${stories.length} stories`);
});
console.log('');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Created directory: ${OUTPUT_DIR}\n`);
}

// Function to call BEAST MODE API
async function generateWithBeastMode(story, context = '') {
  const prompt = `Generate React/TypeScript code for this user story:

Title: ${story.title}
Category: ${story.category}
As: ${story.as}
Want: ${story.want}
So That: ${story.soThat}
Criteria: ${story.criteria.join(', ')}

Context: This is for BEAST MODE IDE web application using:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Monaco Editor (@monaco-editor/react)
- xterm.js (@xterm/xterm)
- Tailwind CSS

${context}

Generate a complete, production-ready component or feature that implements this user story. Include:
1. Full TypeScript code
2. Proper error handling
3. User feedback
4. Accessibility considerations
5. Performance optimizations

Return only the code, no explanations.`;

  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.text || response.content || data);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify({
      message: prompt,
      stream: false,
    }));

    req.end();
  });
}

// Generate features from stories
async function generateFeatures() {
  console.log('🎨 Generating features with BEAST MODE...\n');

  const features = [];
  const maxFeatures = 10; // Start with 10 to test

  for (let i = 0; i < Math.min(maxFeatures, p0Stories.length); i++) {
    const story = p0Stories[i];
    console.log(`[${i + 1}/${Math.min(maxFeatures, p0Stories.length)}] Generating: ${story.title}...`);

    try {
      const code = await generateWithBeastMode(story, `
Current IDE structure:
- app/ide/page.tsx - Main IDE page
- components/ide/Editor.tsx - Monaco Editor component
- components/ide/Terminal.tsx - xterm Terminal component
- components/ide/FileTree.tsx - File tree component
      `);

      const featureFile = path.join(OUTPUT_DIR, `${story.id.replace(/[^a-zA-Z0-9]/g, '_')}.tsx`);
      fs.writeFileSync(featureFile, code);
      
      features.push({
        id: story.id,
        title: story.title,
        category: story.category,
        file: featureFile,
      });

      console.log(`   ✅ Generated: ${featureFile}`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ Generated ${features.length} features\n`);

  // Create index file
  const indexContent = `// Auto-generated features from user stories
${features.map(f => `export { default as ${f.id.replace(/[^a-zA-Z0-9]/g, '_')} } from './${path.basename(f.file)}';`).join('\n')}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('✅ Created index.ts\n');

  return features;
}

// Main execution
(async () => {
  try {
    const features = await generateFeatures();
    
    console.log('='.repeat(60));
    console.log('📊 Summary:\n');
    console.log(`✅ Generated ${features.length} features`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Review generated features');
    console.log('   2. Integrate into IDE components');
    console.log('   3. Test functionality');
    console.log('   4. Continue with more stories');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
