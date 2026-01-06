#!/usr/bin/env node

/**
 * Analyze Language Coverage in Training Dataset
 * 
 * Identifies gaps in language representation and creates strategy
 * for comprehensive coverage
 */

const fs = require('fs-extra');
const path = require('path');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');

/**
 * Target languages for comprehensive coverage
 */
const TARGET_LANGUAGES = {
  // Web Development
  'JavaScript': { priority: 'critical', minRepos: 100, category: 'web' },
  'TypeScript': { priority: 'critical', minRepos: 100, category: 'web' },
  'HTML': { priority: 'high', minRepos: 50, category: 'web' },
  'CSS': { priority: 'high', minRepos: 50, category: 'web' },
  
  // Backend & Systems
  'Python': { priority: 'critical', minRepos: 100, category: 'backend' },
  'Java': { priority: 'critical', minRepos: 100, category: 'backend' },
  'Go': { priority: 'high', minRepos: 80, category: 'backend' },
  'Rust': { priority: 'high', minRepos: 80, category: 'backend' },
  'C++': { priority: 'high', minRepos: 80, category: 'systems' },
  'C': { priority: 'medium', minRepos: 50, category: 'systems' },
  'C#': { priority: 'high', minRepos: 80, category: 'backend' },
  'PHP': { priority: 'high', minRepos: 80, category: 'backend' },
  'Ruby': { priority: 'high', minRepos: 80, category: 'backend' },
  'Scala': { priority: 'medium', minRepos: 50, category: 'backend' },
  
  // Mobile
  'Swift': { priority: 'high', minRepos: 80, category: 'mobile' },
  'Kotlin': { priority: 'high', minRepos: 80, category: 'mobile' },
  'Dart': { priority: 'medium', minRepos: 50, category: 'mobile' },
  'Objective-C': { priority: 'low', minRepos: 30, category: 'mobile' },
  
  // Data & ML
  'R': { priority: 'medium', minRepos: 50, category: 'data' },
  'Julia': { priority: 'low', minRepos: 30, category: 'data' },
  'MATLAB': { priority: 'low', minRepos: 20, category: 'data' },
  
  // Functional & Specialized
  'Haskell': { priority: 'medium', minRepos: 50, category: 'functional' },
  'Elixir': { priority: 'medium', minRepos: 50, category: 'functional' },
  'Clojure': { priority: 'low', minRepos: 30, category: 'functional' },
  'Erlang': { priority: 'low', minRepos: 20, category: 'functional' },
  'F#': { priority: 'low', minRepos: 20, category: 'functional' },
  
  // Scripting & Automation
  'Shell': { priority: 'medium', minRepos: 50, category: 'scripting' },
  'PowerShell': { priority: 'low', minRepos: 30, category: 'scripting' },
  'Lua': { priority: 'low', minRepos: 30, category: 'scripting' },
  
  // Configuration & Markup
  'YAML': { priority: 'low', minRepos: 20, category: 'config' },
  'JSON': { priority: 'low', minRepos: 20, category: 'config' },
  'TOML': { priority: 'low', minRepos: 10, category: 'config' },
  
  // Other Important
  'Vue': { priority: 'high', minRepos: 50, category: 'web' },
  'React': { priority: 'high', minRepos: 50, category: 'web' },
  'Angular': { priority: 'medium', minRepos: 30, category: 'web' },
  'Svelte': { priority: 'low', minRepos: 20, category: 'web' },
};

/**
 * Load all scanned repositories
 */
function loadAllScannedRepos() {
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
 * Extract language from repo data
 */
function getRepoLanguage(repo) {
  // Try multiple sources
  const f = repo.features?.metadata || repo.features || {};
  return f.language || 
         f.primaryLanguage || 
         repo.language || 
         (f.languages && Object.keys(f.languages).length > 0 ? Object.keys(f.languages)[0] : null) ||
         'Unknown';
}

/**
 * Analyze language coverage
 */
function analyzeLanguageCoverage(repos) {
  const coverage = {
    total: repos.length,
    byLanguage: {},
    byCategory: {},
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
    gaps: [],
    recommendations: []
  };

  // Count repos by language
  repos.forEach(repo => {
    const lang = getRepoLanguage(repo);
    coverage.byLanguage[lang] = (coverage.byLanguage[lang] || 0) + 1;
  });

  // Analyze against targets
  for (const [lang, target] of Object.entries(TARGET_LANGUAGES)) {
    const current = coverage.byLanguage[lang] || 0;
    const gap = Math.max(0, target.minRepos - current);
    const percent = target.minRepos > 0 ? (current / target.minRepos * 100) : 0;

    // Track by category
    if (!coverage.byCategory[target.category]) {
      coverage.byCategory[target.category] = { total: 0, languages: {} };
    }
    coverage.byCategory[target.category].total += current;
    coverage.byCategory[target.category].languages[lang] = current;

    // Track by priority
    if (current > 0) {
      coverage.byPriority[target.priority]++;
    }

    // Identify gaps
    if (gap > 0) {
      coverage.gaps.push({
        language: lang,
        current,
        target: target.minRepos,
        gap,
        percent: percent.toFixed(1),
        priority: target.priority,
        category: target.category
      });
    }
  }

  // Count "Unknown" repos
  const unknown = coverage.byLanguage['Unknown'] || 0;
  if (unknown > 0) {
    coverage.gaps.push({
      language: 'Unknown',
      current: unknown,
      target: 0,
      gap: unknown,
      percent: 'N/A',
      priority: 'critical',
      category: 'data-quality',
      issue: 'Missing language data - needs fixing'
    });
  }

  // Generate recommendations
  const criticalGaps = coverage.gaps.filter(g => g.priority === 'critical' && g.gap > 0);
  const highGaps = coverage.gaps.filter(g => g.priority === 'high' && g.gap > 0);

  if (criticalGaps.length > 0) {
    coverage.recommendations.push({
      priority: 'critical',
      action: `Add ${criticalGaps.reduce((sum, g) => sum + g.gap, 0)} repos for critical languages`,
      languages: criticalGaps.map(g => g.language)
    });
  }

  if (highGaps.length > 0) {
    coverage.recommendations.push({
      priority: 'high',
      action: `Add ${highGaps.reduce((sum, g) => sum + g.gap, 0)} repos for high-priority languages`,
      languages: highGaps.map(g => g.language)
    });
  }

  if (unknown > 0) {
    coverage.recommendations.push({
      priority: 'critical',
      action: `Fix ${unknown} repos with missing language data`,
      languages: ['Unknown']
    });
  }

  return coverage;
}

/**
 * Generate coverage report
 */
function generateCoverageReport(coverage) {
  let report = `# Language Coverage Analysis
**Date:** ${new Date().toISOString()}
**Total Repositories:** ${coverage.total}

---

## 📊 Current Coverage

### By Priority
- **Critical Languages:** ${coverage.byPriority.critical} covered
- **High Priority:** ${coverage.byPriority.high} covered
- **Medium Priority:** ${coverage.byPriority.medium} covered
- **Low Priority:** ${coverage.byPriority.low} covered

### By Category
`;

  for (const [category, data] of Object.entries(coverage.byCategory)) {
    report += `\n**${category.toUpperCase()}:** ${data.total} repos\n`;
    const sorted = Object.entries(data.languages).sort((a, b) => b[1] - a[1]);
    sorted.slice(0, 5).forEach(([lang, count]) => {
      report += `- ${lang}: ${count} repos\n`;
    });
  }

  report += `\n---\n\n## ⚠️ Coverage Gaps\n\n`;

  // Sort gaps by priority and gap size
  const sortedGaps = coverage.gaps
    .filter(g => g.language !== 'Unknown' || g.issue)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.gap - a.gap;
    });

  if (sortedGaps.length === 0) {
    report += `✅ **No gaps found!** All target languages have sufficient coverage.\n\n`;
  } else {
    report += `| Language | Current | Target | Gap | Priority | Category |\n`;
    report += `|----------|---------|--------|-----|----------|----------|\n`;
    
    sortedGaps.forEach(gap => {
      report += `| ${gap.language} | ${gap.current} | ${gap.target} | ${gap.gap} | ${gap.priority} | ${gap.category} |\n`;
    });
  }

  report += `\n---\n\n## 🎯 Recommendations\n\n`;

  coverage.recommendations.forEach((rec, idx) => {
    report += `### ${idx + 1}. ${rec.action} (${rec.priority} priority)\n`;
    report += `   Languages: ${rec.languages.join(', ')}\n\n`;
  });

  report += `---\n\n## 📋 Action Plan\n\n`;

  // Generate action plan
  const criticalGaps = sortedGaps.filter(g => g.priority === 'critical');
  const highGaps = sortedGaps.filter(g => g.priority === 'high');

  if (criticalGaps.length > 0) {
    report += `### Immediate (This Week)\n`;
    report += `1. Fix "Unknown" language data (${coverage.byLanguage['Unknown'] || 0} repos)\n`;
    report += `2. Add repos for critical languages:\n`;
    criticalGaps.slice(0, 5).forEach(gap => {
      report += `   - ${gap.language}: Need ${gap.gap} more repos\n`;
    });
    report += `\n`;
  }

  if (highGaps.length > 0) {
    report += `### Short-term (Next 2 Weeks)\n`;
    report += `1. Add repos for high-priority languages:\n`;
    highGaps.slice(0, 5).forEach(gap => {
      report += `   - ${gap.language}: Need ${gap.gap} more repos\n`;
    });
    report += `\n`;
  }

  report += `### Medium-term (Next Month)\n`;
  report += `1. Add repos for medium/low priority languages\n`;
  report += `2. Ensure quality distribution across all languages\n`;
  report += `3. Add lower quality repos (0.0-0.4 range) for each language\n\n`;

  return report;
}

/**
 * Main function
 */
async function main() {
  console.log('🌍 Analyzing Language Coverage\n');
  console.log('='.repeat(60));

  const repos = loadAllScannedRepos();
  console.log(`✅ Loaded ${repos.length} repositories\n`);

  console.log('📊 Analyzing coverage...\n');
  const coverage = analyzeLanguageCoverage(repos);

  // Display summary
  console.log('📋 Coverage Summary:');
  console.log(`   Total Repos: ${coverage.total}`);
  console.log(`   Languages Found: ${Object.keys(coverage.byLanguage).length}`);
  console.log(`   Unknown Language: ${coverage.byLanguage['Unknown'] || 0} (${((coverage.byLanguage['Unknown'] || 0) / coverage.total * 100).toFixed(1)}%)`);
  console.log(`   Coverage Gaps: ${coverage.gaps.length}\n`);

  console.log('🔝 Top Languages:');
  Object.entries(coverage.byLanguage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([lang, count]) => {
      const percent = (count / coverage.total * 100).toFixed(1);
      console.log(`   ${lang}: ${count} (${percent}%)`);
    });

  console.log('\n⚠️  Critical Gaps:');
  const criticalGaps = coverage.gaps.filter(g => g.priority === 'critical').slice(0, 5);
  if (criticalGaps.length > 0) {
    criticalGaps.forEach(gap => {
      console.log(`   ${gap.language}: ${gap.current}/${gap.target} (need ${gap.gap} more)`);
    });
  } else {
    console.log('   ✅ No critical gaps!');
  }

  // Generate and save report
  const report = generateCoverageReport(coverage);
  const reportPath = path.join(OUTPUT_DIR, 'LANGUAGE_COVERAGE_ANALYSIS.md');
  await fs.writeFile(reportPath, report);

  console.log(`\n✅ Report saved to: ${reportPath}\n`);

  // Generate discovery script recommendations
  const discoveryScript = generateDiscoveryScript(coverage);
  const scriptPath = path.join(__dirname, 'discover-missing-languages.js');
  await fs.writeFile(scriptPath, discoveryScript);
  console.log(`✅ Discovery script created: ${scriptPath}\n`);

  console.log('='.repeat(60));
  console.log('✅ Analysis complete!\n');
}

/**
 * Generate discovery script for missing languages
 */
function generateDiscoveryScript(coverage) {
  const criticalGaps = coverage.gaps.filter(g => g.priority === 'critical' && g.language !== 'Unknown');
  const highGaps = coverage.gaps.filter(g => g.priority === 'high');

  const languagesToDiscover = [
    ...criticalGaps.map(g => ({ lang: g.language.toLowerCase(), count: g.gap, priority: 'critical' })),
    ...highGaps.slice(0, 10).map(g => ({ lang: g.language.toLowerCase(), count: Math.min(g.gap, 50), priority: 'high' }))
  ];

  return `#!/usr/bin/env node

/**
 * Discover Repositories for Missing Languages
 * Auto-generated based on coverage analysis
 */

const { discoverNotableRepos } = require('./discover-notable-repos');

const LANGUAGES_TO_DISCOVER = ${JSON.stringify(languagesToDiscover, null, 2)};

async function main() {
  console.log('🌍 Discovering Repos for Missing Languages\\n');
  
  for (const { lang, count, priority } of LANGUAGES_TO_DISCOVER) {
    console.log(\`\\n📡 Discovering \${count} \${lang} repos (priority: \${priority})...\`);
    // Implementation here
  }
}

if (require.main === module) {
  main().catch(console.error);
}
`;
}

if (require.main === module) {
  main().catch(console.error);
}

