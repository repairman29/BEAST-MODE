#!/usr/bin/env node

/**
 * Enhanced Feature Engineering
 * 
 * Adds interaction and composite features to improve model R²
 */

const fs = require('fs-extra');
const path = require('path');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');

/**
 * Enhanced feature extraction with interactions and composites
 */
function extractEnhancedFeatures(repo) {
  const f = repo.features?.metadata || repo.features || {};
  
  // Base values
  const stars = f.stars || 0;
  const forks = f.forks || 0;
  const openIssues = f.openIssues || 0;
  const fileCount = f.fileCount || f.totalFiles || 0;
  const codeFileCount = f.codeFileCount || 0;
  const repoAgeDays = f.repoAgeDays || 0;
  const daysSincePush = f.daysSincePush || 365;
  const isActive = f.isActive ? 1 : 0;
  const hasTests = f.hasTests ? 1 : 0;
  const hasCI = f.hasCI ? 1 : 0;
  const codeFileRatio = f.codeFileRatio || (fileCount > 0 ? codeFileCount / fileCount : 0);
  const communityHealth = f.communityHealth || 0;
  const codeQuality = f.codeQualityScore || 0;
  
  // Base features
  const base = {
    stars, forks, openIssues,
    fileCount, codeFileCount, repoAgeDays,
    daysSincePush, daysSinceUpdate: f.daysSinceUpdate || daysSincePush,
    isActive, hasTests, hasCI,
    hasReadme: f.hasReadme ? 1 : 0,
    hasLicense: f.hasLicense ? 1 : 0,
    hasDocker: f.hasDocker ? 1 : 0,
    hasDescription: f.hasDescription ? 1 : 0,
    hasTopics: f.hasTopics ? 1 : 0,
    codeFileRatio, communityHealth, codeQuality,
    starsForksRatio: forks > 0 ? stars / forks : 0,
    starsPerFile: fileCount > 0 ? stars / fileCount : 0,
    engagementPerIssue: openIssues > 0 ? (stars + forks) / openIssues : 0,
  };
  
  // INTERACTION FEATURES (often significantly improve R²)
  const interactions = {
    // Engagement × Activity
    starsTimesActivity: stars * isActive,
    forksTimesActivity: forks * isActive,
    starsTimesAge: stars * Math.log10(repoAgeDays + 1),
    forksTimesAge: forks * Math.log10(repoAgeDays + 1),
    
    // Quality × Engagement
    testsTimesStars: hasTests * stars,
    ciTimesStars: hasCI * stars,
    testsTimesForks: hasTests * forks,
    ciTimesForks: hasCI * forks,
    
    // Structure × Engagement
    codeRatioTimesStars: codeFileRatio * stars,
    fileCountTimesStars: fileCount * Math.log10(stars + 1),
    
    // Health × Engagement
    healthTimesStars: communityHealth * stars,
    healthTimesForks: communityHealth * forks,
    
    // Activity × Quality
    activeTimesTests: isActive * hasTests,
    activeTimesCI: isActive * hasCI,
  };
  
  // COMPOSITE FEATURES
  const composites = {
    // Engagement score (normalized log scale)
    engagementScore: Math.min(1, Math.log10(stars + 1) / 6 + Math.log10(forks + 1) / 5),
    
    // Quality indicator count
    qualityIndicatorCount: hasTests + hasCI + (f.hasReadme ? 1 : 0) + 
                           (f.hasLicense ? 1 : 0) + (f.hasDocker ? 1 : 0),
    
    // Maintenance score
    maintenanceScore: isActive * 0.5 + Math.min(1, (365 - daysSincePush) / 365) * 0.5,
    
    // Health score (composite)
    healthScore: communityHealth * 0.4 + codeFileRatio * 0.3 + codeQuality * 0.3,
    
    // Popularity score (log scale)
    popularityScore: Math.min(1, Math.log10(stars + 1) / 6),
    
    // Activity freshness
    freshnessScore: Math.max(0, 1 - (daysSincePush / 365)),
    
    // Engagement per file
    engagementPerFile: fileCount > 0 ? (stars + forks) / fileCount : 0,
  };
  
  // Language features (expanded)
  const lang = f.primaryLanguage || f.language || 'Unknown';
  const languages = {
    language_js: (lang === 'JavaScript' || lang === 'TypeScript') ? 1 : 0,
    language_py: lang === 'Python' ? 1 : 0,
    language_rust: lang === 'Rust' ? 1 : 0,
    language_go: lang === 'Go' ? 1 : 0,
    language_java: lang === 'Java' ? 1 : 0,
    language_cpp: lang === 'C++' ? 1 : 0,
    language_php: lang === 'PHP' ? 1 : 0,
    language_ruby: lang === 'Ruby' ? 1 : 0,
    language_swift: lang === 'Swift' ? 1 : 0,
    language_kotlin: lang === 'Kotlin' ? 1 : 0,
    language_csharp: lang === 'C#' ? 1 : 0,
  };
  
  return {
    ...base,
    ...interactions,
    ...composites,
    ...languages,
  };
}

/**
 * Load and enhance all repos
 */
function enhanceAllRepos() {
  const files = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

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

  console.log(`✅ Loaded ${allRepos.length} repositories\n`);

  // Enhance features
  const enhanced = allRepos.map(repo => ({
    ...repo,
    features: extractEnhancedFeatures(repo)
  }));

  // Count features
  const featureCount = Object.keys(enhanced[0].features).length;
  console.log(`📊 Enhanced Features: ${featureCount} features per repo\n`);

  return enhanced;
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Enhancing Features with Interactions & Composites\n');
  console.log('='.repeat(60));

  const enhanced = enhanceAllRepos();

  // Save enhanced data
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(OUTPUT_DIR, `enhanced-features-${timestamp}.json`);
  
  await fs.writeJson(outputPath, {
    metadata: {
      createdAt: new Date().toISOString(),
      source: 'enhanced-feature-engineering',
      totalRepos: enhanced.length,
      featureCount: Object.keys(enhanced[0].features).length
    },
    trainingData: enhanced
  }, { spaces: 2 });

  console.log(`✅ Enhanced features saved: ${outputPath}\n`);
  console.log('💡 Next: Retrain model with enhanced features');
  console.log('   node scripts/retrain-with-notable-quality.js\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractEnhancedFeatures };

