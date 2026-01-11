#!/usr/bin/env node
/**
 * Generate All P0 Features Using BEAST MODE
 * 
 * Automatically generates code for all P0 user stories
 * Uses BEAST MODE APIs to dogfood our own product
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const USER_STORIES_PATH = path.join(__dirname, '../../beast-mode-ide/docs/user-stories/ALL_STORIES.json');
const OUTPUT_DIR = path.join(__dirname, '../components/ide/features');
const API_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000/api/beast-mode/conversation';
const BATCH_SIZE = 5; // Generate 5 at a time
const DELAY_MS = 2000; // 2 second delay between batches

console.log('🚀 Generating All P0 Features with BEAST MODE\n');
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

// Group by category for better organization
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
async function generateWithBeastMode(story, index, total) {
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

Current IDE structure:
- app/ide/page.tsx - Main IDE page
- components/ide/Editor.tsx - Monaco Editor component
- components/ide/Terminal.tsx - xterm Terminal component
- components/ide/FileTree.tsx - File tree component

Generate a complete, production-ready component or feature that implements this user story. Include:
1. Full TypeScript code with proper types
2. Proper error handling
3. User feedback (toast notifications)
4. Accessibility considerations (ARIA labels, keyboard nav)
5. Performance optimizations (useMemo, useCallback)
6. Tailwind CSS styling matching the dark theme (slate-900, slate-800, etc.)

Return only the code, no explanations. Export as default component.`;

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
      timeout: 60000, // 60 second timeout
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const code = response.text || response.content || response.message || data;
          resolve(code);
        } catch (e) {
          // If not JSON, assume it's plain text
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(JSON.stringify({
      message: prompt,
      stream: false,
      context: {
        type: 'code_generation',
        task: 'generate_ide_feature',
        story: story.id,
      },
    }));

    req.end();
  });
}

// Generate features in batches
async function generateAllFeatures() {
  console.log('🎨 Generating features with BEAST MODE...\n');

  const features = [];
  const errors = [];

  // Process in batches
  for (let i = 0; i < p0Stories.length; i += BATCH_SIZE) {
    const batch = p0Stories.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(p0Stories.length / BATCH_SIZE)}`);

    const batchPromises = batch.map(async (story, batchIndex) => {
      const globalIndex = i + batchIndex;
      console.log(`   [${globalIndex + 1}/${p0Stories.length}] ${story.title}...`);

      try {
        const code = await generateWithBeastMode(story, globalIndex, p0Stories.length);

        // Clean up code (remove markdown if present)
        let cleanCode = code;
        if (code.includes('```')) {
          const match = code.match(/```(?:typescript|tsx|ts|javascript|jsx|js)?\n([\s\S]*?)```/);
          if (match) {
            cleanCode = match[1];
          }
        }

        const featureFile = path.join(OUTPUT_DIR, `${story.id.replace(/[^a-zA-Z0-9]/g, '_')}.tsx`);
        fs.writeFileSync(featureFile, cleanCode);

        features.push({
          id: story.id,
          title: story.title,
          category: story.category,
          file: featureFile,
        });

        console.log(`      ✅ Generated: ${path.basename(featureFile)}`);
        return { success: true, story, code: cleanCode };
      } catch (error) {
        console.error(`      ❌ Error: ${error.message}`);
        errors.push({ story, error: error.message });
        return { success: false, story, error: error.message };
      }
    });

    await Promise.all(batchPromises);

    // Delay between batches
    if (i + BATCH_SIZE < p0Stories.length) {
      console.log(`\n⏳ Waiting ${DELAY_MS / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\n✅ Generated ${features.length} features`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} errors occurred`);
  }

  // Create index file
  const indexContent = `// Auto-generated features from P0 user stories
// Generated using BEAST MODE APIs (dogfooding)

${features.map(f => {
  const importName = f.id.replace(/[^a-zA-Z0-9]/g, '_');
  return `export { default as ${importName} } from './${path.basename(f.file, '.tsx')}';`;
}).join('\n')}

// Feature metadata
export const features = ${JSON.stringify(features, null, 2)};
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('✅ Created index.ts\n');

  // Save progress
  const progress = {
    total: p0Stories.length,
    generated: features.length,
    errors: errors.length,
    timestamp: new Date().toISOString(),
    features: features.map(f => ({
      id: f.id,
      title: f.title,
      category: f.category,
    })),
    errors: errors.map(e => ({
      id: e.story.id,
      title: e.story.title,
      error: e.error,
    })),
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'generation-progress.json'),
    JSON.stringify(progress, null, 2)
  );

  return { features, errors, progress };
}

// Main execution
(async () => {
  try {
    console.log('🚀 Starting feature generation...\n');
    const result = await generateAllFeatures();

    console.log('='.repeat(60));
    console.log('📊 Summary:\n');
    console.log(`✅ Generated: ${result.features.length} features`);
    console.log(`❌ Errors: ${result.errors.length}`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Review generated features');
    console.log('   2. Integrate into IDE components');
    console.log('   3. Test functionality');
    console.log('   4. Fix any errors and regenerate');
    console.log('\n📄 Progress saved to: generation-progress.json');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();
