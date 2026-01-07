/**
 * Repository Discovery & Scoring System
 * 
 * Discovers high-quality repositories from GitHub based on criteria:
 * - Quality indicators (stars, forks, tests, CI, etc.)
 * - Language diversity
 * - Repository type diversity
 * - Activity level
 * - License compliance
 */

const { createLogger } = require('../utils/logger');
const { getAuditTrail } = require('./auditTrail');
const { Octokit } = require('@octokit/rest');
const log = createLogger('RepositoryDiscovery');

class RepositoryDiscovery {
  constructor(octokit) {
    this.octokit = octokit;
    this.auditTrail = null;
  }

  /**
   * Initialize audit trail
   */
  async initializeAudit() {
    if (!this.auditTrail) {
      this.auditTrail = await getAuditTrail();
    }
  }

  /**
   * Search GitHub repositories with criteria
   */
  async searchRepositories(criteria = {}) {
    const {
      languages = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp'],
      minStars = 10,
      maxStars = 100000,
      minForks = 5,
      hasLicense = true,
      sort = 'stars',
      order = 'desc',
      perPage = 100,
      maxResults = 5000, // Scan many to find best
    } = criteria;

    await this.initializeAudit();
    await this.auditTrail.log('repository_discovery_start', {
      criteria,
      maxResults,
    });

    const allRepos = [];
    const languageCounts = {};

    log.info(`🔍 Discovering repositories across ${languages.length} languages...`);
    log.info(`   Target: ${maxResults} repositories to evaluate\n`);

    // Search each language
    for (const language of languages) {
      try {
        log.info(`📡 Searching ${language} repositories...`);

        let page = 1;
        let found = 0;
        const targetPerLanguage = Math.ceil(maxResults / languages.length);

        while (found < targetPerLanguage && allRepos.length < maxResults) {
          const query = this.buildSearchQuery({
            language,
            minStars,
            maxStars,
            minForks,
            hasLicense,
          });

          const { data } = await this.octokit.search.repos({
            q: query,
            sort,
            order,
            per_page: Math.min(perPage, targetPerLanguage - found),
            page,
          });

          if (data.items.length === 0) break;

          // Add repos with metadata
          data.items.forEach(item => {
            allRepos.push({
              fullName: `${item.owner.login}/${item.name}`,
              owner: item.owner.login,
              name: item.name,
              url: item.html_url,
              description: item.description || '',
              stars: item.stargazers_count || 0,
              forks: item.forks_count || 0,
              language: item.language || language,
              license: item.license?.spdx_id || 'None',
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              pushedAt: item.pushed_at,
              topics: item.topics || [],
              isFork: item.fork || false,
              archived: item.archived || false,
              disabled: item.disabled || false,
              openIssues: item.open_issues_count || 0,
              score: 0, // Will be calculated
            });

            languageCounts[language] = (languageCounts[language] || 0) + 1;
            found++;
          });

          log.info(`   Found ${found} ${language} repos (${allRepos.length} total)...`);

          page++;
          
          // Rate limit delay (longer to avoid secondary rate limits)
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        log.info(`✅ ${language}: ${languageCounts[language]} repositories\n`);
      } catch (error) {
        if (error.status === 403 && error.message.includes('secondary rate limit')) {
          log.warn(`⚠️  Rate limit hit for ${language} - waiting 60 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
          // Continue with next language
        } else {
          log.error(`❌ Error searching ${language}:`, error.message);
        }
      }
    }

    log.info(`📊 Discovery complete: ${allRepos.length} repositories found\n`);

    await this.auditTrail.log('repository_discovery_complete', {
      totalFound: allRepos.length,
      byLanguage: languageCounts,
    });

    return allRepos;
  }

  /**
   * Build GitHub search query
   */
  buildSearchQuery(criteria) {
    const parts = [];

    if (criteria.language) {
      parts.push(`language:${criteria.language}`);
    }

    if (criteria.minStars) {
      parts.push(`stars:>=${criteria.minStars}`);
    }

    if (criteria.maxStars) {
      parts.push(`stars:<=${criteria.maxStars}`);
    }

    if (criteria.minForks) {
      parts.push(`forks:>=${criteria.minForks}`);
    }

    // Note: GitHub doesn't support 'license:any' - we'll filter after search
    // Instead, we can search for specific licenses or remove this filter

    // Exclude archived, disabled, forks
    parts.push('archived:false');
    parts.push('is:public');
    parts.push('fork:false');

    return parts.join(' ');
  }

  /**
   * Score repository quality
   */
  async scoreRepository(repo) {
    let score = 0;

    // 1. Engagement (0-30 points)
    const engagementScore = this.scoreEngagement(repo);
    score += engagementScore;

    // 2. Activity (0-20 points)
    const activityScore = this.scoreActivity(repo);
    score += activityScore;

    // 3. Quality Indicators (0-30 points)
    // Will be enhanced after detailed scan
    const qualityScore = this.scoreQualityIndicators(repo);
    score += qualityScore;

    // 4. Documentation (0-10 points)
    const docScore = this.scoreDocumentation(repo);
    score += docScore;

    // 5. Community (0-10 points)
    const communityScore = this.scoreCommunity(repo);
    score += communityScore;

    repo.score = score;
    repo.scoreBreakdown = {
      engagement: engagementScore,
      activity: activityScore,
      quality: qualityScore,
      documentation: docScore,
      community: communityScore,
      total: score,
    };

    return score;
  }

  /**
   * Score engagement (stars, forks)
   */
  scoreEngagement(repo) {
    let score = 0;

    // Stars (0-15 points)
    if (repo.stars >= 1000) score += 15;
    else if (repo.stars >= 500) score += 12;
    else if (repo.stars >= 100) score += 10;
    else if (repo.stars >= 50) score += 7;
    else if (repo.stars >= 10) score += 5;

    // Forks (0-10 points)
    if (repo.forks >= 100) score += 10;
    else if (repo.forks >= 50) score += 8;
    else if (repo.forks >= 20) score += 6;
    else if (repo.forks >= 10) score += 4;
    else if (repo.forks >= 5) score += 2;

    // Stars/Forks ratio (0-5 points) - indicates quality
    if (repo.forks > 0) {
      const ratio = repo.stars / repo.forks;
      if (ratio > 10) score += 5; // Very popular
      else if (ratio > 5) score += 3;
      else if (ratio > 2) score += 1;
    }

    return Math.min(30, score);
  }

  /**
   * Score activity (recent updates)
   */
  scoreActivity(repo) {
    let score = 0;

    if (!repo.pushedAt) return 0;

    const daysSincePush = (Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24);

    // Recent activity (0-10 points)
    if (daysSincePush < 7) score += 10; // Very active
    else if (daysSincePush < 30) score += 8;
    else if (daysSincePush < 90) score += 6;
    else if (daysSincePush < 180) score += 4;
    else if (daysSincePush < 365) score += 2;

    // Repository age (0-5 points) - older = more stable
    if (repo.createdAt) {
      const ageDays = (Date.now() - new Date(repo.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > 365 * 2) score += 5; // 2+ years old
      else if (ageDays > 365) score += 3;
      else if (ageDays > 180) score += 1;
    }

    // Update frequency (0-5 points)
    if (repo.createdAt && repo.pushedAt) {
      const totalAge = (Date.now() - new Date(repo.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const timeSincePush = daysSincePush;
      const activityRatio = 1 - (timeSincePush / totalAge);
      if (activityRatio > 0.8) score += 5; // Very active
      else if (activityRatio > 0.5) score += 3;
      else if (activityRatio > 0.2) score += 1;
    }

    return Math.min(20, score);
  }

  /**
   * Score quality indicators (from basic metadata)
   */
  scoreQualityIndicators(repo) {
    let score = 0;

    // Has license (0-5 points)
    if (repo.license && repo.license !== 'None') {
      score += 5;
    }

    // Has description (0-5 points)
    if (repo.description && repo.description.length > 20) {
      score += 5;
    }

    // Has topics (0-5 points)
    if (repo.topics && repo.topics.length > 0) {
      score += Math.min(5, repo.topics.length);
    }

    // Low issue ratio (0-5 points) - fewer issues = better maintained
    if (repo.stars > 0) {
      const issueRatio = repo.openIssues / repo.stars;
      if (issueRatio < 0.1) score += 5; // Well maintained
      else if (issueRatio < 0.2) score += 3;
      else if (issueRatio < 0.5) score += 1;
    }

    // Not archived/disabled (0-10 points)
    if (!repo.archived && !repo.disabled) {
      score += 10;
    }

    return Math.min(30, score);
  }

  /**
   * Score documentation
   */
  scoreDocumentation(repo) {
    let score = 0;

    // Has description (0-5 points)
    if (repo.description && repo.description.length > 50) {
      score += 5;
    }

    // Has topics (0-5 points)
    if (repo.topics && repo.topics.length >= 3) {
      score += 5;
    }

    return Math.min(10, score);
  }

  /**
   * Score community
   */
  scoreCommunity(repo) {
    let score = 0;

    // Stars indicate community interest
    if (repo.stars >= 100) score += 5;
    else if (repo.stars >= 50) score += 3;
    else if (repo.stars >= 10) score += 1;

    // Forks indicate community engagement
    if (repo.forks >= 20) score += 5;
    else if (repo.forks >= 10) score += 3;
    else if (repo.forks >= 5) score += 1;

    return Math.min(10, score);
  }

  /**
   * Score all repositories
   */
  async scoreRepositories(repos) {
    log.info(`📊 Scoring ${repos.length} repositories...\n`);

    for (let i = 0; i < repos.length; i++) {
      await this.scoreRepository(repos[i]);

      if ((i + 1) % 100 === 0) {
        log.info(`   Scored ${i + 1}/${repos.length}...`);
      }
    }

    log.info(`✅ Scored ${repos.length} repositories\n`);

    return repos;
  }

  /**
   * Select diverse top repositories
   */
  selectDiverseTopRepos(repos, targetCount = 500, diversityCriteria = {}) {
    const {
      minPerLanguage = 20,
      maxPerLanguage = 100,
      languageDistribution = 'balanced', // 'balanced' or 'proportional'
    } = diversityCriteria;

    log.info(`🎯 Selecting ${targetCount} diverse high-quality repositories...\n`);

    // Sort by score (highest first)
    const sorted = repos.sort((a, b) => b.score - a.score);

    // Group by language
    const byLanguage = {};
    sorted.forEach(repo => {
      const lang = repo.language || 'Unknown';
      if (!byLanguage[lang]) {
        byLanguage[lang] = [];
      }
      byLanguage[lang].push(repo);
    });

    log.info(`📊 Language distribution:`);
    Object.keys(byLanguage).forEach(lang => {
      log.info(`   ${lang}: ${byLanguage[lang].length} repos`);
    });
    log.info('');

    // Select diverse set
    const selected = [];
    const selectedByLanguage = {};

    // Strategy: Take top repos from each language
    const languages = Object.keys(byLanguage).sort((a, b) => 
      byLanguage[b].length - byLanguage[a].length
    );

    if (languageDistribution === 'balanced') {
      // Balanced: Equal representation
      const perLanguage = Math.floor(targetCount / languages.length);
      
      languages.forEach(lang => {
        const available = byLanguage[lang];
        const take = Math.min(perLanguage, available.length, maxPerLanguage);
        const takeMin = Math.max(minPerLanguage, take);
        
        for (let i = 0; i < Math.min(takeMin, available.length) && selected.length < targetCount; i++) {
          selected.push(available[i]);
          selectedByLanguage[lang] = (selectedByLanguage[lang] || 0) + 1;
        }
      });
    } else {
      // Proportional: Based on availability
      const total = sorted.length;
      languages.forEach(lang => {
        const available = byLanguage[lang];
        const proportion = available.length / total;
        const take = Math.floor(targetCount * proportion);
        const takeMin = Math.max(minPerLanguage, Math.min(take, maxPerLanguage));
        
        for (let i = 0; i < Math.min(takeMin, available.length) && selected.length < targetCount; i++) {
          selected.push(available[i]);
          selectedByLanguage[lang] = (selectedByLanguage[lang] || 0) + 1;
        }
      });
    }

    // Fill remaining slots with highest scores
    const remaining = targetCount - selected.length;
    if (remaining > 0) {
      const selectedNames = new Set(selected.map(r => r.fullName));
      for (const repo of sorted) {
        if (selected.length >= targetCount) break;
        if (!selectedNames.has(repo.fullName)) {
          selected.push(repo);
          selectedByLanguage[repo.language || 'Unknown'] = (selectedByLanguage[repo.language || 'Unknown'] || 0) + 1;
        }
      }
    }

    log.info(`✅ Selected ${selected.length} repositories:`);
    Object.keys(selectedByLanguage).forEach(lang => {
      log.info(`   ${lang}: ${selectedByLanguage[lang]} repos`);
    });
    log.info('');

    // Calculate statistics
    const avgScore = selected.reduce((sum, r) => sum + r.score, 0) / selected.length;
    const minScore = Math.min(...selected.map(r => r.score));
    const maxScore = Math.max(...selected.map(r => r.score));

    log.info(`📊 Selection Statistics:`);
    log.info(`   Average score: ${avgScore.toFixed(2)}`);
    log.info(`   Score range: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);
    log.info(`   Languages: ${Object.keys(selectedByLanguage).length}\n`);

    return {
      repositories: selected,
      statistics: {
        total: selected.length,
        byLanguage: selectedByLanguage,
        avgScore,
        minScore,
        maxScore,
      },
    };
  }

  /**
   * Complete discovery and selection pipeline
   */
  async discoverAndSelect(criteria = {}) {
    const {
      targetCount = 500,
      searchCriteria = {},
      diversityCriteria = {},
    } = criteria;

    await this.initializeAudit();
    await this.auditTrail.log('discovery_pipeline_start', {
      targetCount,
      searchCriteria,
      diversityCriteria,
    });

    // 1. Search repositories
    const allRepos = await this.searchRepositories({
      maxResults: 5000, // Search many
      ...searchCriteria,
    });

    // 2. Score repositories
    const scoredRepos = await this.scoreRepositories(allRepos);

    // 3. Select diverse top repos
    const selection = this.selectDiverseTopRepos(
      scoredRepos,
      targetCount,
      diversityCriteria
    );

    await this.auditTrail.log('discovery_pipeline_complete', {
      searched: allRepos.length,
      selected: selection.repositories.length,
      statistics: selection.statistics,
    });

    return selection;
  }
}

module.exports = {
  RepositoryDiscovery,
};

