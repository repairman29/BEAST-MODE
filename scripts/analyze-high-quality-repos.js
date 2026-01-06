#!/usr/bin/env node

/**
 * Analyze High-Quality Repositories
 * 
 * Identifies the highest quality repos from existing data
 * and uses them to discover similar high-quality projects
 */

const fs = require('fs-extra');
const path = require('path');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');

/**
 * Load all scanned repositories
 */
function loadAllRepos() {
  const files = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No scanned repository files found');
  }

  const allRepos = [];
  const seenRepos = new Set();
  
  for (const file of files) {
    const filePath = path.join(SCANNED_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const repos = data.trainingData || [];
    
    for (const repo of repos) {
      const repoKey = repo.repo || repo.url || JSON.stringify(repo.features || {});
      if (!seenRepos.has(repoKey)) {
        seenRepos.add(repoKey);
        allRepos.push(repo);
      }
    }
  }

  return allRepos;
}

/**
 * Enhanced quality calculation focusing on notable/high-quality indicators
 */
function calculateNotableQuality(repo) {
  const f = repo.features || {};
  
  // High engagement indicators (notable projects have high engagement)
  const stars = f.stars || 0;
  const forks = f.forks || 0;
  const openIssues = f.openIssues || 0;
  const totalEngagement = f.totalEngagement || (stars + forks * 2 + openIssues);
  
  // Engagement score (log scale for stars, linear for others)
  const starsScore = Math.min(1, Math.log10(stars + 1) / 6); // 1M stars = 1.0
  const forksScore = Math.min(1, Math.log10(forks + 1) / 5); // 100K forks = 1.0
  const engagementScore = (starsScore * 0.4 + forksScore * 0.3 + Math.min(1, openIssues / 1000) * 0.1);
  
  // Quality indicators (well-maintained projects)
  const hasTests = (f.hasTests || 0) * 0.15;
  const hasCI = (f.hasCI || 0) * 0.12;
  const hasReadme = (f.hasReadme || 0) * 0.05;
  const hasLicense = (f.hasLicense || 0) * 0.05;
  const hasDocker = (f.hasDocker || 0) * 0.03;
  const qualityIndicators = hasTests + hasCI + hasReadme + hasLicense + hasDocker;
  
  // Code quality metrics
  const codeQuality = (f.codeQualityScore || 0) * 0.1;
  const codeFileRatio = Math.min(1, (f.codeFileRatio || 0) * 2); // Prefer repos with more code
  const structureScore = codeFileRatio * 0.1;
  
  // Activity and maintenance (active projects are higher quality)
  const repoAgeDays = f.repoAgeDays || 0;
  const isActive = f.isActive || 0;
  const activityScore = isActive * 0.1 + Math.min(1, repoAgeDays / 3650) * 0.05; // Older = more established
  
  // Community health
  const communityHealth = (f.communityHealth || 0) * 0.05;
  
  // Calculate base quality
  let quality = engagementScore + qualityIndicators + activityScore + 
                communityHealth + codeQuality + structureScore;
  
  // Bonus for very high engagement (notable projects)
  if (stars > 10000) quality += 0.1;
  if (stars > 50000) quality += 0.1;
  if (stars > 100000) quality += 0.15;
  
  // Penalty for low engagement (not notable)
  if (stars < 100 && forks < 20) quality -= 0.2;
  if (stars < 50) quality -= 0.3;
  
  // Penalty for too many open issues relative to stars (maintenance issues)
  if (stars > 0 && openIssues > 0) {
    const issueRatio = openIssues / stars;
    if (issueRatio > 0.5) quality -= 0.15; // More than 50% issue ratio
    if (issueRatio > 1.0) quality -= 0.25; // More issues than stars
  }
  
  return Math.max(0.0, Math.min(1.0, quality));
}

/**
 * Analyze and rank repositories
 */
function analyzeRepos() {
  console.log('🔍 Analyzing High-Quality Repositories\n');
  console.log('='.repeat(60));
  
  const repos = loadAllRepos();
  console.log(`✅ Loaded ${repos.length} repositories\n`);
  
  // Calculate quality scores
  const scoredRepos = repos.map(repo => ({
    ...repo,
    quality: calculateNotableQuality(repo),
    features: repo.features || {}
  }));
  
  // Sort by quality (highest first)
  scoredRepos.sort((a, b) => b.quality - a.quality);
  
  // Statistics
  const qualities = scoredRepos.map(r => r.quality);
  const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
  const std = Math.sqrt(qualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qualities.length);
  
  console.log('📊 Quality Distribution:');
  console.log(`   Min: ${Math.min(...qualities).toFixed(3)}`);
  console.log(`   Max: ${Math.max(...qualities).toFixed(3)}`);
  console.log(`   Mean: ${mean.toFixed(3)}`);
  console.log(`   Std Dev: ${std.toFixed(3)}\n`);
  
  // Top 50 highest quality repos
  const top50 = scoredRepos.slice(0, 50);
  const top100 = scoredRepos.slice(0, 100);
  const top200 = scoredRepos.slice(0, 200);
  
  console.log('🏆 Top 50 Highest Quality Repositories:\n');
  top50.forEach((repo, i) => {
    const f = repo.features || {};
    const repoName = repo.repo || repo.url || 'Unknown';
    console.log(`${(i + 1).toString().padStart(2)}. ${repoName}`);
    console.log(`    Quality: ${repo.quality.toFixed(3)} | Stars: ${(f.stars || 0).toLocaleString()} | Forks: ${(f.forks || 0).toLocaleString()} | Age: ${Math.floor((f.repoAgeDays || 0) / 365)}y`);
  });
  
  // Language distribution of top repos
  const topLanguages = {};
  top100.forEach(repo => {
    const lang = repo.features?.primaryLanguage || 'Unknown';
    topLanguages[lang] = (topLanguages[lang] || 0) + 1;
  });
  
  console.log('\n📊 Language Distribution (Top 100):');
  Object.entries(topLanguages)
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} repos`);
    });
  
  // Save results
  const output = {
    metadata: {
      totalRepos: repos.length,
      analyzedAt: new Date().toISOString(),
      qualityStats: {
        min: Math.min(...qualities),
        max: Math.max(...qualities),
        mean,
        std
      }
    },
    top50: top50.map(r => ({
      repo: r.repo || r.url,
      quality: r.quality,
      stars: r.features?.stars || 0,
      forks: r.features?.forks || 0,
      language: r.features?.primaryLanguage || 'Unknown',
      ageDays: r.features?.repoAgeDays || 0
    })),
    top100: top100.map(r => ({
      repo: r.repo || r.url,
      quality: r.quality,
      stars: r.features?.stars || 0,
      forks: r.features?.forks || 0,
      language: r.features?.primaryLanguage || 'Unknown'
    })),
    top200: top200.map(r => ({
      repo: r.repo || r.url,
      quality: r.quality,
      stars: r.features?.stars || 0,
      forks: r.features?.forks || 0,
      language: r.features?.primaryLanguage || 'Unknown'
    })),
    allRepos: scoredRepos.map(r => ({
      repo: r.repo || r.url,
      quality: r.quality,
      stars: r.features?.stars || 0,
      forks: r.features?.forks || 0,
      language: r.features?.primaryLanguage || 'Unknown'
    }))
  };
  
  const outputPath = path.join(OUTPUT_DIR, 'high-quality-repos-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n💾 Saved analysis to: ${outputPath}`);
  console.log(`\n📋 Summary:`);
  console.log(`   Top 50 repos: Quality >= ${top50[top50.length - 1].quality.toFixed(3)}`);
  console.log(`   Top 100 repos: Quality >= ${top100[top100.length - 1].quality.toFixed(3)}`);
  console.log(`   Top 200 repos: Quality >= ${top200[top200.length - 1].quality.toFixed(3)}`);
  
  return {
    top50,
    top100,
    top200,
    allScored: scoredRepos
  };
}

if (require.main === module) {
  analyzeRepos();
}

module.exports = { analyzeRepos, calculateNotableQuality, loadAllRepos };


