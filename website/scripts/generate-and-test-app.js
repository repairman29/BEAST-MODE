#!/usr/bin/env node

/**
 * Generate and Test Full Application
 * 
 * Uses BEAST MODE to generate a complete application,
 * then validates it's complete and functional
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:7777';
const TEST_APP_DIR = path.join(__dirname, '../test-apps');

// Ensure test apps directory exists
if (!fs.existsSync(TEST_APP_DIR)) {
  fs.mkdirSync(TEST_APP_DIR, { recursive: true });
}

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function generateApp(name, description) {
  console.log(`\n🚀 Generating: ${name}`);
  console.log(`Description: ${description}`);
  console.log('-'.repeat(60));

  try {
    const response = await makeRequest('/api/beast-mode/conversation', 'POST', {
      message: description,
      task: 'generate_code',
      context: {
        type: 'code_generation',
        formattedContext: `Building ${name}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`API returned ${response.status}: ${response.data.error || response.raw}`);
    }

    const code = response.data.code || response.data.response || '';
    if (!code || code.length < 200) {
      throw new Error('Generated code is too short or missing');
    }

    // Save generated code
    const appDir = path.join(TEST_APP_DIR, name.toLowerCase().replace(/\s+/g, '-'));
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    // Parse and save files
    let files = [];
    try {
      // Try to parse as JSON (multi-file response)
      const parsed = typeof code === 'string' ? JSON.parse(code) : code;
      if (parsed.files && Array.isArray(parsed.files)) {
        files = parsed.files;
      } else {
        // Single file response
        files = [{
          path: 'generated.tsx',
          content: code,
          language: 'typescript',
        }];
      }
    } catch {
      // Not JSON, treat as single file
      files = [{
        path: 'generated.tsx',
        content: code,
        language: 'typescript',
      }];
    }

    // Save all files
    files.forEach((file) => {
      const filePath = path.join(appDir, file.path);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content, 'utf8');
      console.log(`  ✅ Saved: ${file.path} (${file.content.length} chars)`);
    });

    // Validate generated code
    const validation = validateGeneratedCode(files);
    console.log(`\n📊 Validation Results:`);
    console.log(`  - Files: ${files.length}`);
    console.log(`  - Total Lines: ${validation.totalLines}`);
    console.log(`  - Has Imports: ${validation.hasImports ? '✅' : '❌'}`);
    console.log(`  - Has Error Handling: ${validation.hasErrorHandling ? '✅' : '❌'}`);
    console.log(`  - Has Types: ${validation.hasTypes ? '✅' : '❌'}`);
    console.log(`  - Completeness Score: ${validation.completenessScore}/100`);

    return {
      success: true,
      files,
      validation,
      appDir,
    };
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

function validateGeneratedCode(files) {
  let totalLines = 0;
  let hasImports = false;
  let hasErrorHandling = false;
  let hasTypes = false;
  let hasTests = false;
  let hasDocumentation = false;

  files.forEach((file) => {
    const content = file.content || '';
    const lines = content.split('\n');
    totalLines += lines.length;

    // Check for imports
    if (content.includes('import ') || content.includes('require(') || content.includes('from ')) {
      hasImports = true;
    }

    // Check for error handling
    if (content.includes('try') || content.includes('catch') || content.includes('error') || content.includes('Error')) {
      hasErrorHandling = true;
    }

    // Check for types
    if (content.includes(': ') || content.includes('interface ') || content.includes('type ') || content.includes('TypeScript')) {
      hasTypes = true;
    }

    // Check for tests
    if (content.includes('test') || content.includes('describe') || content.includes('it(') || content.includes('expect')) {
      hasTests = true;
    }

    // Check for documentation
    if (content.includes('/**') || content.includes('//') || content.includes('/*')) {
      hasDocumentation = true;
    }
  });

  // Calculate completeness score
  let score = 0;
  if (files.length > 1) score += 20; // Multi-file
  if (totalLines > 500) score += 20; // Substantial code
  if (hasImports) score += 15;
  if (hasErrorHandling) score += 15;
  if (hasTypes) score += 15;
  if (hasTests) score += 10;
  if (hasDocumentation) score += 5;

  return {
    totalLines,
    hasImports,
    hasErrorHandling,
    hasTypes,
    hasTests,
    hasDocumentation,
    completenessScore: Math.min(100, score),
  };
}

async function main() {
  console.log('🎯 BEAST MODE Application Generation & Testing\n');
  console.log('='.repeat(60));

  const apps = [
    {
      name: 'Portfolio Website',
      description: 'Create a complete portfolio website with: 1) Home page with hero section and skills, 2) About page, 3) Projects page with filtering, 4) Contact form with validation, 5) Blog section. Use Next.js 14, TypeScript, Tailwind CSS, and include proper SEO, responsive design, and animations.',
    },
    {
      name: 'Todo App',
      description: 'Create a full-stack todo application with: 1) Next.js frontend with React components, 2) API routes for CRUD operations, 3) Supabase database with schema, 4) User authentication, 5) Real-time updates, 6) Drag-and-drop reordering, 7) Categories and tags, 8) Due dates and reminders. Make it production-ready with error handling and loading states.',
    },
    {
      name: 'E-Commerce Platform',
      description: 'Create a complete e-commerce website with: 1) Product catalog with search/filter/sort, 2) Shopping cart with persistence, 3) Checkout process with validation, 4) User authentication and profiles, 5) Order management, 6) Admin dashboard, 7) Stripe payment integration, 8) Email notifications. Use Next.js, TypeScript, Tailwind CSS, Supabase, and Stripe. Include proper error handling, loading states, and responsive design.',
    },
    {
      name: 'Social Media Dashboard',
      description: 'Create a social media analytics dashboard with: 1) Multiple platform integration (Twitter, Instagram, Facebook), 2) Real-time metrics display, 3) Post scheduling, 4) Analytics charts and graphs, 5) User authentication, 6) Team collaboration features. Use Next.js, TypeScript, Chart.js, and include proper data visualization.',
    },
  ];

  const results = [];

  for (const app of apps) {
    const result = await generateApp(app.name, app.description);
    results.push({
      name: app.name,
      ...result,
    });

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name}`);
    if (result.success) {
      console.log(`   ✅ Generated ${result.files.length} files`);
      console.log(`   📈 Completeness: ${result.validation.completenessScore}/100`);
      console.log(`   📁 Location: ${result.appDir}`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  const avgScore = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.validation.completenessScore, 0) / successCount || 0;

  console.log('\n' + '='.repeat(60));
  console.log(`Overall: ${successCount}/${apps.length} apps generated successfully`);
  console.log(`Average Completeness Score: ${avgScore.toFixed(1)}/100`);
  console.log('='.repeat(60));

  // Save results
  fs.writeFileSync(
    path.join(TEST_APP_DIR, 'generation-results.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: apps.length,
        successful: successCount,
        averageScore: avgScore,
      },
    }, null, 2)
  );

  console.log(`\n📄 Results saved to: ${path.join(TEST_APP_DIR, 'generation-results.json')}`);
}

main().catch(console.error);
