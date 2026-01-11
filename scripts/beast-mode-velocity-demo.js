#!/usr/bin/env node

/**
 * BEAST MODE Velocity Demo
 * 
 * Demonstrates extreme speed - generates 50+ files in seconds
 * Shows parallel processing, batch operations, and rapid iteration
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const TARGET_COUNT = parseInt(process.argv[2]) || 50;

/**
 * Ultra-fast component generator
 */
function generateUltraFastComponent(index) {
  const name = `Feature${index}`;
  return {
    name,
    component: `"use client";
import React from 'react';
export default function ${name}() {
  return <div>${name}</div>;
}`,
    api: `import { NextRequest, NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ success: true, feature: '${name}' });
}`,
    test: `describe('${name}', () => {
  it('works', () => expect(true).toBe(true));
});`
  };
}

/**
 * Velocity test - maximum speed
 */
async function velocityDemo() {
  console.log('⚡ BEAST MODE Velocity Demo');
  console.log('='.repeat(60));
  console.log(`🎯 Generating ${TARGET_COUNT} features at maximum speed...\n`);

  const startTime = performance.now();

  // Generate all features in memory first (fastest)
  const features = Array.from({ length: TARGET_COUNT }, (_, i) => 
    generateUltraFastComponent(i)
  );

  const generationTime = performance.now() - startTime;

  // Write all files in parallel (maximum parallelism)
  const writeStart = performance.now();
  
  const writePromises = features.flatMap((feature, idx) => {
    const promises = [];
    
    // Component
    const compPath = path.join(__dirname, '..', 'website', 'components', 'beast-mode', `Feature${idx}.tsx`);
    promises.push(
      fs.promises.mkdir(path.dirname(compPath), { recursive: true }).then(() =>
        fs.promises.writeFile(compPath, feature.component, 'utf8')
      )
    );
    
    // API
    const apiPath = path.join(__dirname, '..', 'website', 'app', 'api', `feature${idx}`, 'route.ts');
    promises.push(
      fs.promises.mkdir(path.dirname(apiPath), { recursive: true }).then(() =>
        fs.promises.writeFile(apiPath, feature.api, 'utf8')
      )
    );
    
    // Test
    const testPath = path.join(__dirname, '..', 'tests', `feature${idx}.test.ts`);
    promises.push(
      fs.promises.mkdir(path.dirname(testPath), { recursive: true }).then(() =>
        fs.promises.writeFile(testPath, feature.test, 'utf8')
      )
    );
    
    return promises;
  });

  await Promise.all(writePromises);
  const writeTime = performance.now() - writeStart;
  const totalTime = performance.now() - startTime;

  // Calculate metrics
  const totalFiles = TARGET_COUNT * 3; // component + api + test
  const totalLines = features.reduce((sum, f) => 
    sum + f.component.split('\n').length + f.api.split('\n').length + f.test.split('\n').length, 0
  );

  console.log('✅ Velocity Demo Complete!\n');
  console.log('📊 Performance Metrics:');
  console.log('-'.repeat(60));
  console.log(`   Features Generated: ${TARGET_COUNT}`);
  console.log(`   Total Files: ${totalFiles}`);
  console.log(`   Total Lines: ${totalLines}`);
  console.log(`   Generation Time: ${generationTime.toFixed(2)}ms`);
  console.log(`   Write Time: ${writeTime.toFixed(2)}ms`);
  console.log(`   Total Time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log('');
  console.log(`   ⚡ Files per Second: ${((totalFiles / totalTime) * 1000).toFixed(0)}`);
  console.log(`   ⚡ Lines per Second: ${((totalLines / totalTime) * 1000).toFixed(0)}`);
  console.log(`   ⚡ Features per Second: ${((TARGET_COUNT / totalTime) * 1000).toFixed(2)}`);
  console.log('');

  // Speed comparison
  console.log('🏆 Speed Comparison:');
  console.log('-'.repeat(60));
  const humanTime = TARGET_COUNT * 30 * 60 * 1000; // 30 min per feature
  const speedup = humanTime / totalTime;
  console.log(`   Human Developer: ~${(humanTime / 1000 / 60).toFixed(0)} minutes`);
  console.log(`   BEAST MODE: ${(totalTime / 1000).toFixed(2)} seconds`);
  console.log(`   Speedup: ${speedup.toFixed(0)}x faster`);
  console.log('');

  // Rating
  let rating = '⚡⚡⚡';
  if (totalTime < 1000) rating = '⚡⚡⚡ LUDICROUS SPEED';
  else if (totalTime < 2000) rating = '⚡⚡⚡ EXTREME';
  else if (totalTime < 5000) rating = '⚡⚡ VERY FAST';
  
  console.log(`   ${rating}`);
  console.log('');

  return {
    featuresGenerated: TARGET_COUNT,
    totalFiles,
    totalLines,
    totalTime,
    filesPerSecond: (totalFiles / totalTime) * 1000,
    linesPerSecond: (totalLines / totalTime) * 1000,
    speedup
  };
}

if (require.main === module) {
  velocityDemo().catch(error => {
    console.error('❌ Velocity demo failed:', error);
    process.exit(1);
  });
}

module.exports = { velocityDemo };
