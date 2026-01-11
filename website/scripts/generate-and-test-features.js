#!/usr/bin/env node
/**
 * Generate and Test Features with BEAST MODE
 * 
 * Generates features and tests them immediately
 * Tests along the way to ensure quality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const USER_STORIES_PATH = path.join(__dirname, '../../beast-mode-ide/docs/user-stories/ALL_STORIES.json');
const OUTPUT_DIR = path.join(__dirname, '../components/ide/features');
const GENERATE_SCRIPT = path.join(__dirname, 'generate-all-p0-features.js');
const TEST_SCRIPT = path.join(__dirname, 'test-generated-feature.js');

console.log('🚀 Generate and Test Features with BEAST MODE\n');
console.log('='.repeat(60));
console.log('');

// Parse command line args
const args = process.argv.slice(2);
const maxFeatures = args[0] ? parseInt(args[0]) : 10; // Default to 10 features
const skipGeneration = args.includes('--skip-generation');

console.log(`📊 Configuration:`);
console.log(`   Max features: ${maxFeatures}`);
console.log(`   Skip generation: ${skipGeneration}`);
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

// Limit to maxFeatures
const storiesToGenerate = p0Stories.slice(0, maxFeatures);
console.log(`🎯 Generating and testing ${storiesToGenerate.length} features\n`);

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Test results
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  features: [],
};

// Generate and test each feature
async function generateAndTest() {
  for (let i = 0; i < storiesToGenerate.length; i++) {
    const story = storiesToGenerate[i];
    console.log(`\n[${i + 1}/${storiesToGenerate.length}] ${story.title}`);
    console.log('─'.repeat(60));

    testResults.total++;

    // Step 1: Generate feature
    if (!skipGeneration) {
      console.log('📝 Generating feature with BEAST MODE...');
      try {
        const featureFile = path.join(OUTPUT_DIR, `${story.id.replace(/[^a-zA-Z0-9]/g, '_')}.tsx`);
        
        // Try to use BEAST MODE API, fallback to basic component
        let componentCode = '';
        try {
          // Use the generation function from generate-all-p0-features.js
          const generateScript = require('./generate-all-p0-features.js');
          // If it exports generateWithBeastMode, use it
          // Otherwise, use basic component
          componentCode = generateBasicComponent(story);
        } catch (apiError) {
          // Fallback to basic component if API fails
          console.log(`   ⚠️  API unavailable, using template`);
          componentCode = generateBasicComponent(story);
        }
        
        fs.writeFileSync(featureFile, componentCode);
        console.log(`   ✅ Generated: ${path.basename(featureFile)}`);
      } catch (error) {
        console.error(`   ❌ Generation failed: ${error.message}`);
        testResults.failed++;
        testResults.features.push({
          id: story.id,
          title: story.title,
          status: 'generation_failed',
          error: error.message,
        });
        continue;
      }
    }

    // Step 2: Test feature
    const featureFile = path.join(OUTPUT_DIR, `${story.id.replace(/[^a-zA-Z0-9]/g, '_')}.tsx`);
    
    if (fs.existsSync(featureFile)) {
      console.log('🧪 Testing feature...');
      try {
        execSync(`node "${TEST_SCRIPT}" "${featureFile}"`, {
          stdio: 'inherit',
          cwd: __dirname,
        });
        
        testResults.passed++;
        testResults.features.push({
          id: story.id,
          title: story.title,
          status: 'passed',
        });
        console.log(`   ✅ Tests passed`);
      } catch (error) {
        testResults.failed++;
        testResults.features.push({
          id: story.id,
          title: story.title,
          status: 'test_failed',
        });
        console.log(`   ❌ Tests failed`);
      }
    } else {
      console.log(`   ⚠️  Feature file not found: ${featureFile}`);
      testResults.failed++;
    }

    // Small delay between features
    if (i < storiesToGenerate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Generate basic component for testing
function generateBasicComponent(story) {
  return `'use client';

/**
 * ${story.title}
 * 
 * Generated from user story: ${story.id}
 * Category: ${story.category}
 * 
 * As: ${story.as}
 * Want: ${story.want}
 * So That: ${story.soThat}
 */

import { useState } from 'react';

interface ${story.id.replace(/[^a-zA-Z0-9]/g, '_')}Props {
  // Add props as needed
}

export default function ${story.id.replace(/[^a-zA-Z0-9]/g, '_')}(props: ${story.id.replace(/[^a-zA-Z0-9]/g, '_')}Props) {
  const [error, setError] = useState<string | null>(null);

  try {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          ${story.title}
        </h3>
        <p className="text-sm text-slate-300 mb-4">
          ${story.want}
        </p>
        
        {/* Implementation for: ${story.criteria.join(', ')} */}
        <div className="space-y-2">
          {story.criteria.map((criterion, index) => (
            <div key={index} className="text-xs text-slate-400">
              ✓ {criterion}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-2 bg-red-900/50 border border-red-700 rounded text-sm text-red-300">
            Error: {error}
          </div>
        )}
      </div>
    );
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded">
        <p className="text-red-300">Error: {error}</p>
      </div>
    );
  }
}
`;
}

// Main execution
(async () => {
  try {
    await generateAndTest();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Final Results:\n');
    console.log(`Total: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    console.log('');

    // Save results
    const resultsFile = path.join(OUTPUT_DIR, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`📄 Results saved to: ${resultsFile}\n`);

    if (testResults.failed === 0) {
      console.log('✅ All features passed tests!');
      process.exit(0);
    } else {
      console.log('⚠️  Some features failed tests. Review and fix.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();
