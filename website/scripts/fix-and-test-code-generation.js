#!/usr/bin/env node

/**
 * Fix and Test Code Generation
 * 
 * This script iteratively fixes code generation issues and tests until
 * we can generate complete, working applications
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:7777';

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
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function extractCode(text) {
  if (!text) return null;
  
  // Match code blocks
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const matches = [];
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  
  if (matches.length > 0) {
    return matches.reduce((a, b) => a.length > b.length ? a : b);
  }
  
  // Check if entire response is code-like
  if (text.length > 100 && (text.includes('export') || text.includes('function') || text.includes('const') || text.includes('class'))) {
    return text.trim();
  }
  
  return null;
}

async function testCodeGeneration(prompt) {
  console.log(`\n🧪 Testing: "${prompt}"`);
  console.log('-'.repeat(60));
  
  // Test 1: Direct generate-code endpoint
  console.log('1. Testing /api/beast-mode/generate-code...');
  try {
    const response = await makeRequest('/api/beast-mode/generate-code', 'POST', {
      prompt,
      language: 'typescript',
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.status === 200 && response.data.success) {
      const code = response.data.code || '';
      if (code && code.length > 50) {
        console.log(`   ✅ SUCCESS: Generated ${code.length} characters of code`);
        console.log(`   Preview: ${code.substring(0, 100)}...`);
        return { success: true, code, method: 'generate-code' };
      } else {
        console.log(`   ❌ FAILED: Code too short or missing`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
    } else {
      console.log(`   ❌ FAILED: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  // Test 2: Conversation endpoint
  console.log('2. Testing /api/beast-mode/conversation...');
  try {
    const response = await makeRequest('/api/beast-mode/conversation', 'POST', {
      message: prompt,
      task: 'generate_code',
      context: {
        type: 'code_generation',
      },
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      const code = response.data.code || extractCode(response.data.response || '');
      if (code && code.length > 50) {
        console.log(`   ✅ SUCCESS: Generated ${code.length} characters of code`);
        console.log(`   Preview: ${code.substring(0, 100)}...`);
        return { success: true, code, method: 'conversation' };
      } else {
        console.log(`   ❌ FAILED: Code too short or missing`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
    } else {
      console.log(`   ❌ FAILED: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  // Test 3: Codebase chat endpoint
  console.log('3. Testing /api/codebase/chat...');
  try {
    const explicitPrompt = `Generate COMPLETE, PRODUCTION-READY code for: ${prompt}

CRITICAL: Return ONLY the code in a markdown code block. No explanations, no conversational text. Just the code.

Example format:
\`\`\`typescript
// Complete code here
\`\`\``;

    const response = await makeRequest('/api/codebase/chat', 'POST', {
      sessionId: `test-${Date.now()}`,
      message: explicitPrompt,
      useLLM: true,
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.status === 200 && response.data.success) {
      const code = response.data.code || extractCode(response.data.message || '');
      if (code && code.length > 50) {
        console.log(`   ✅ SUCCESS: Generated ${code.length} characters of code`);
        console.log(`   Preview: ${code.substring(0, 100)}...`);
        return { success: true, code, method: 'codebase-chat' };
      } else {
        console.log(`   ❌ FAILED: Code too short or missing`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
    } else {
      console.log(`   ❌ FAILED: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  return { success: false };
}

async function main() {
  console.log('🔧 Fix and Test Code Generation');
  console.log('='.repeat(60));
  
  const testCases = [
    'Create a React button component with onClick handler',
    'Create a Next.js API route that handles POST requests',
    'Create a complete todo app with React and TypeScript',
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testCodeGeneration(testCase);
    results.push({
      prompt: testCase,
      ...result,
    });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. "${result.prompt}"`);
    if (result.success) {
      console.log(`   ✅ SUCCESS via ${result.method}`);
      console.log(`   Code length: ${result.code.length} characters`);
    } else {
      console.log(`   ❌ FAILED - No code generated`);
    }
  });
  
  console.log(`\n${successCount}/${testCases.length} tests passed`);
  
  if (successCount === 0) {
    console.log('\n⚠️  CRITICAL: Code generation is not working!');
    console.log('   All endpoints are failing to generate code.');
    console.log('   This needs immediate attention.');
    process.exit(1);
  } else if (successCount < testCases.length) {
    console.log('\n⚠️  WARNING: Some code generation methods are failing.');
    console.log('   Review the results above and fix the failing endpoints.');
    process.exit(1);
  } else {
    console.log('\n✅ SUCCESS: All code generation methods are working!');
    process.exit(0);
  }
}

main().catch(console.error);
