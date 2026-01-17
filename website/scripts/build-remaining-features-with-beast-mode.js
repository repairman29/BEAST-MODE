#!/usr/bin/env node
/**
 * Build Remaining IDE Features with BEAST MODE
 * 
 * Uses BEAST MODE APIs to generate:
 * - Inline Diff Viewer
 * - Enhanced Symbol Search (Cmd+T)
 * - Code Lens (reference counts)
 * - And more...
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:7777';
const USER_ID = process.env.USER_ID || 'default-user';

const featuresToBuild = [
  {
    id: 'inline-diff-viewer',
    title: 'Inline Diff Viewer',
    description: 'Show Git diffs inline in editor with side-by-side comparison and inline change indicators',
    category: 'Git Integration',
    priority: 'P0',
    userStories: [
      'As a developer, I want to see Git diffs inline in the editor so I can review changes without leaving my workflow',
      'As a developer, I want side-by-side diff comparison so I can easily see what changed',
      'As a developer, I want inline change indicators (green/red) so I can quickly spot additions and deletions',
    ],
  },
  {
    id: 'symbol-search',
    title: 'Enhanced Symbol Search (Cmd+T)',
    description: 'Quick file and symbol search with fuzzy matching, similar to VS Code Cmd+T',
    category: 'Code Navigation',
    priority: 'P0',
    userStories: [
      'As a developer, I want to quickly search for files and symbols (Cmd+T) so I can navigate my codebase fast',
      'As a developer, I want fuzzy matching in symbol search so I can find things even with typos',
      'As a developer, I want to see recent files in search results so I can quickly return to what I was working on',
    ],
  },
  {
    id: 'code-lens',
    title: 'Code Lens',
    description: 'Show reference counts and quick actions inline above symbols',
    category: 'Code Navigation',
    priority: 'P1',
    userStories: [
      'As a developer, I want to see how many references a symbol has inline so I know its usage',
      'As a developer, I want quick actions (Go to Definition, Find References) above symbols so I can navigate faster',
    ],
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions Panel',
    description: 'Context-aware quick actions panel (refactor, generate tests, etc.)',
    category: 'AI Features',
    priority: 'P1',
    userStories: [
      'As a developer, I want quick actions for selected code so I can refactor or generate tests quickly',
      'As a developer, I want context-aware suggestions so the IDE knows what I might want to do',
    ],
  },
];

async function callBeastModeAPI(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: data ? 'POST' : 'GET',
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      } : {},
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
          return;
        }
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
    
    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await callBeastModeAPI('/api/health', {});
      if (response.status === 'ok' || response.raw) {
        return true;
      }
    } catch (e) {
      // Server not ready
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function generateFeature(feature) {
  console.log(`\n🤖 Generating: ${feature.title}...`);
  
  const prompt = `CODE GENERATION TASK: Generate a complete React/TypeScript component for: ${feature.title}

Description: ${feature.description}
Category: ${feature.category}
Priority: ${feature.priority}

User Stories:
${feature.userStories.map((us, i) => `${i + 1}. ${us}`).join('\n')}

Requirements:
- Use TypeScript
- Use React hooks (useState, useEffect, etc.)
- Follow the existing IDE component patterns (see components/ide/)
- Use Tailwind CSS for styling (slate color scheme)
- Include proper error handling
- Include TypeScript types
- Make it production-ready

Generate the complete component code with:
1. Component file (${feature.id}.tsx)
2. Any utility functions needed
3. API routes if needed
4. Integration instructions

Return the code in a format that can be directly saved to files.`;

  try {
    const response = await callBeastModeAPI('/api/beast-mode/conversation', {
      message: prompt,
      context: {
        type: 'code_generation',
        task: 'generate_code',
        activeFile: 'components/ide/Editor.tsx',
        conversationHistory: [],
        bounty: {
          title: feature.title,
          description: feature.description,
          tech_stack: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
        },
      },
    });

    if (response.code && response.code.files && response.code.files.length > 0) {
      return response.code.files[0].content;
    } else if (response.message) {
      // Extract code blocks from markdown
      const codeMatch = response.message.match(/```(?:tsx|ts|typescript|javascript|jsx)?\n([\s\S]*?)```/);
      if (codeMatch) {
        return codeMatch[1];
      }
      return response.message;
    }
    
    return null;
  } catch (error) {
    console.error(`Error generating ${feature.title}:`, error.message);
    console.error(`Full error:`, error);
    return null;
  }
}

async function saveFeature(feature, code) {
  if (!code) {
    console.log(`⚠️  No code generated for ${feature.title}`);
    return false;
  }

  // Extract code from JSON if needed
  let cleanCode = code;
  if (typeof code === 'object' && code.code) {
    cleanCode = code.code;
  }
  if (typeof cleanCode === 'object') {
    cleanCode = JSON.stringify(cleanCode, null, 2);
  }

  // Save component
  const componentDir = path.join(__dirname, '../components/ide');
  const componentPath = path.join(componentDir, `${feature.id}.tsx`);
  
  // Ensure directory exists
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Add component header
  const componentCode = `'use client';

/**
 * ${feature.title}
 * 
 * ${feature.description}
 * 
 * Generated by BEAST MODE
 * Category: ${feature.category}
 * Priority: ${feature.priority}
 */

${cleanCode}
`;

  fs.writeFileSync(componentPath, componentCode);
  console.log(`✅ Saved: ${componentPath}`);

  // Update feature registry
  const registryPath = path.join(__dirname, '../components/ide/features/index.ts');
  if (fs.existsSync(registryPath)) {
    let registryContent = fs.readFileSync(registryPath, 'utf8');
    
    // Add feature to registry
    const featureEntry = `  {
    id: '${feature.id}',
    title: '${feature.title}',
    category: '${feature.category}',
    file: '${feature.id}',
  },`;
    
    // Find the features array and add entry
    if (registryContent.includes('export const features')) {
      const featuresMatch = registryContent.match(/export const features = \[([\s\S]*?)\];/);
      if (featuresMatch) {
        const existingFeatures = featuresMatch[1];
        if (!existingFeatures.includes(`'${feature.id}'`)) {
          registryContent = registryContent.replace(
            /export const features = \[/,
            `export const features = [\n${featureEntry}`
          );
          fs.writeFileSync(registryPath, registryContent);
          console.log(`✅ Updated feature registry`);
        }
      }
    }
  }

  return true;
}

async function main() {
  console.log('🚀 Building Remaining IDE Features with BEAST MODE\n');
  console.log('='.repeat(60));
  console.log(`Features to build: ${featuresToBuild.length}`);
  console.log(`BEAST MODE API: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  console.log('\n⏳ Waiting for server to be ready...');
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('⚠️  Server not ready, but continuing anyway...');
  } else {
    console.log('✅ Server is ready!\n');
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const feature of featuresToBuild) {
    try {
      const code = await generateFeature(feature);
      if (code) {
        const saved = await saveFeature(feature, code);
        if (saved) {
          results.success.push(feature.id);
        } else {
          results.failed.push(feature.id);
        }
      } else {
        results.failed.push(feature.id);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error processing ${feature.id}:`, error);
      results.failed.push(feature.id);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Results:');
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60));

  if (results.success.length > 0) {
    console.log('\n✅ Successfully generated:');
    results.success.forEach(id => console.log(`  - ${id}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed to generate:');
    results.failed.forEach(id => console.log(`  - ${id}`));
  }

  console.log('\n🎉 Done! Next steps:');
  console.log('1. Review generated components');
  console.log('2. Integrate into IDE (app/ide/page.tsx)');
  console.log('3. Test features');
  console.log('4. Commit and deploy');
}

main().catch(console.error);
