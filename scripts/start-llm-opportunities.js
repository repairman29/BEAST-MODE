#!/usr/bin/env node
/**
 * Start LLM Opportunities Implementation
 * 
 * This script helps kick off the 18 LLM opportunities roadmap
 * by using BEAST MODE's own APIs to generate implementations
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';
const USER_ID = process.env.BEAST_MODE_USER_ID || 'beast-mode-system';

// Phase 1 opportunities
const PHASE_1_OPPORTUNITIES = [
  {
    id: 'quality-explanations',
    name: 'Quality Analysis Explanations',
    description: 'Use LLM to explain why quality scores are low/high',
    file: 'lib/mlops/qualityExplainer.js',
    prompt: `Create a quality explanation service that uses LLM to explain quality scores.

Requirements:
- Takes code and quality score as input
- Uses BEAST MODE's /api/codebase/chat API
- Returns clear, actionable explanations
- Integrates with existing qualityValidator.js

Use BEAST MODE's custom models for generation.`
  },
  {
    id: 'issue-recommendations',
    name: 'Issue Recommendations',
    description: 'Use LLM to suggest specific fixes for issues',
    file: 'lib/mlops/issueRecommender.js',
    prompt: `Create an issue recommendation service that uses LLM to suggest fixes.

Requirements:
- Takes issue and code context as input
- Uses BEAST MODE's /api/codebase/chat API
- Returns specific, actionable recommendations
- Integrates with existing codebaseScanner.js

Use BEAST MODE's custom models for generation.`
  },
  {
    id: 'code-comments',
    name: 'Code Comments',
    description: 'Use LLM to generate inline comments',
    file: 'lib/mlops/commentGenerator.js',
    prompt: `Create a code comment generator that uses LLM to add inline comments.

Requirements:
- Takes code as input
- Uses BEAST MODE's /api/codebase/chat API
- Adds comments explaining functions, logic, edge cases
- Returns code with comments added

Use BEAST MODE's custom models for generation.`
  },
  {
    id: 'error-messages',
    name: 'Error Message Enhancement',
    description: 'Use LLM to generate helpful error messages',
    file: 'lib/utils/errorMessageEnhancer.js',
    prompt: `Create an error message enhancer that uses LLM to improve error messages.

Requirements:
- Takes error and context as input
- Uses BEAST MODE's /api/codebase/chat API
- Returns helpful, actionable error messages
- Integrates with existing errorHandler.js

Use BEAST MODE's custom models for generation.`
  },
  {
    id: 'caching',
    name: 'Caching & Reuse',
    description: 'Add caching layer for LLM requests',
    file: 'lib/mlops/llmCache.js',
    prompt: `Create an LLM request cache to reduce costs and improve performance.

Requirements:
- Caches similar LLM requests
- Uses request hash as cache key
- Integrates with modelRouter.js
- Configurable TTL and size limits

Use BEAST MODE's existing caching patterns.`
  }
];

async function generateFeature(opportunity) {
  console.log(`\n🎯 Generating: ${opportunity.name}`);
  console.log(`   File: ${opportunity.file}`);
  
  try {
    // Use BEAST MODE codebase chat API to generate the feature
    const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
      sessionId: `llm-opportunities-${opportunity.id}`,
      message: `You are a code generator. Generate a complete, production-ready JavaScript implementation.

File: ${opportunity.file}
Purpose: ${opportunity.name}
Description: ${opportunity.description}

Requirements:
${opportunity.prompt}

IMPORTANT:
- Return ONLY valid JavaScript code
- No explanations, no markdown, no comments outside code
- Include proper error handling
- Use BEAST MODE's /api/codebase/chat API internally
- Export the main class/function
- Follow BEAST MODE code patterns

Generate the complete implementation now:`,
      repo: 'BEAST-MODE-PRODUCT',
      model: 'custom:beast-mode-code-model',
      userId: USER_ID,
      useLLM: true
    });

    // Handle different response formats and extract code
    let code = null;
    if (response.data && response.data.code) {
      code = response.data.code;
    } else if (response.data && response.data.message) {
      code = response.data.message;
    } else if (response.data && response.data.generatedCode) {
      code = response.data.generatedCode;
    } else if (typeof response.data === 'string') {
      code = response.data;
    }
    
    // Extract code from markdown code blocks if present
    if (code) {
      // Remove markdown code blocks
      code = code.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```\n?/g, '');
      // Remove leading/trailing whitespace
      code = code.trim();
      
      // If code looks like a conversation, try to extract code blocks
      const codeBlockMatch = code.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        code = codeBlockMatch[1].trim();
      }
    }
    
    if (code && code.length > 50 && (code.includes('function') || code.includes('class') || code.includes('module.exports') || code.includes('require'))) {
      
      // Save to file
      const filePath = path.join(__dirname, '..', opportunity.file);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, code, 'utf8');
      
      console.log(`   ✅ Generated and saved to ${opportunity.file} (${code.length} chars)`);
      return { success: true, file: opportunity.file, codeLength: code.length };
    } else {
      console.log(`   ⚠️  API response didn't contain valid code`);
      console.log(`   Response preview: ${code ? code.substring(0, 200) : 'null'}...`);
      return { success: false, error: 'No valid code in response', preview: code ? code.substring(0, 200) : null };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🎸 BEAST MODE LLM Opportunities - Phase 1 Kickoff');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Using BEAST MODE APIs to generate implementations...\n');

  const results = [];

  for (const opportunity of PHASE_1_OPPORTUNITIES) {
    const result = await generateFeature(opportunity);
    results.push({ ...opportunity, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => console.log(`   • ${r.name} → ${r.file}`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => console.log(`   • ${r.name}: ${r.error}`));
  }

  console.log('\n🎯 Next Steps:');
  console.log('   1. Review generated code');
  console.log('   2. Test each service');
  console.log('   3. Integrate with existing services');
  console.log('   4. Use BEAST MODE self-improvement to enhance');
  console.log('\n🚀 Let\'s build world-class features! 🎸\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateFeature, PHASE_1_OPPORTUNITIES };
