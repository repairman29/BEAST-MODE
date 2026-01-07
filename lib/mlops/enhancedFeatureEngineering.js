/**
 * Enhanced Feature Engineering
 * 
 * Creates advanced features from repository data:
 * - Code embeddings (semantic features)
 * - Interaction features (combinations)
 * - Time-based features (temporal)
 * - Language-specific features
 * - Architecture features
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('EnhancedFeatureEngineering');

class EnhancedFeatureEngineering {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize feature engineering
   */
  async initialize() {
    if (this.initialized) return;
    
    // Load embedding service if available
    try {
      const { getCodeEmbeddingsService } = require('../features/codeEmbeddings');
      this.embeddingsService = await getCodeEmbeddingsService();
      log.info('✅ Embeddings service available');
    } catch (error) {
      log.warn('⚠️  Embeddings service not available:', error.message);
      this.embeddingsService = null;
    }

    this.initialized = true;
  }

  /**
   * Extract enhanced features from repository data
   */
  async extractEnhancedFeatures(repoData) {
    await this.initialize();

    const features = {
      // Basic features (from original)
      ...this.extractBasicFeatures(repoData),

      // Interaction features
      ...this.extractInteractionFeatures(repoData),

      // Time-based features
      ...this.extractTimeBasedFeatures(repoData),

      // Language features
      ...this.extractLanguageFeatures(repoData),

      // Architecture features
      ...this.extractArchitectureFeatures(repoData),

      // Code quality features
      ...this.extractCodeQualityFeatures(repoData),

      // Community features
      ...this.extractCommunityFeatures(repoData),
    };

    // Add embeddings if available
    if (this.embeddingsService && repoData.description) {
      try {
        const embedding = await this.embeddingsService.generateEmbedding(
          repoData.description,
          { useOllama: true }
        );
        if (embedding) {
          features.descriptionEmbedding = embedding.slice(0, 10); // First 10 dims for speed
        }
      } catch (error) {
        log.warn('Failed to generate embedding:', error.message);
      }
    }

    return features;
  }

  /**
   * Extract basic features (original)
   */
  extractBasicFeatures(repoData) {
    const features = repoData.features || {};
    
    return {
      stars: features.stars || 0,
      forks: features.forks || 0,
      openIssues: features.openIssues || 0,
      fileCount: features.fileCount || 0,
      codeFileCount: features.codeFileCount || 0,
      hasLicense: features.hasLicense ? 1 : 0,
      hasDescription: features.hasDescription ? 1 : 0,
      hasTopics: features.hasTopics ? 1 : 0,
      hasReadme: features.hasReadme ? 1 : 0,
      hasTests: features.hasTests ? 1 : 0,
      hasCI: features.hasCI ? 1 : 0,
      hasDocker: features.hasDocker ? 1 : 0,
      hasConfig: features.hasConfig ? 1 : 0,
    };
  }

  /**
   * Extract interaction features (combinations)
   */
  extractInteractionFeatures(repoData) {
    const f = repoData.features || {};

    return {
      // Engagement interactions
      starsForksRatio: f.forks > 0 ? (f.stars || 0) / f.forks : 0,
      starsPerFile: f.fileCount > 0 ? (f.stars || 0) / f.fileCount : 0,
      forksPerFile: f.fileCount > 0 ? (f.forks || 0) / f.fileCount : 0,

      // Quality interactions
      testsAndCI: (f.hasTests ? 1 : 0) * (f.hasCI ? 1 : 0),
      testsAndDocker: (f.hasTests ? 1 : 0) * (f.hasDocker ? 1 : 0),
      ciAndDocker: (f.hasCI ? 1 : 0) * (f.hasDocker ? 1 : 0),

      // Documentation interactions
      readmeAndLicense: (f.hasReadme ? 1 : 0) * (f.hasLicense ? 1 : 0),
      readmeAndDescription: (f.hasReadme ? 1 : 0) * (f.hasDescription ? 1 : 0),
      descriptionAndTopics: (f.hasDescription ? 1 : 0) * (f.hasTopics ? 1 : 0),

      // Code quality score (composite)
      codeQualityScore: (
        (f.hasTests ? 1 : 0) * 0.3 +
        (f.hasCI ? 1 : 0) * 0.3 +
        (f.hasDocker ? 1 : 0) * 0.2 +
        (f.hasReadme ? 1 : 0) * 0.2
      ),
    };
  }

  /**
   * Extract time-based features
   */
  extractTimeBasedFeatures(repoData) {
    const now = new Date();
    const createdAt = repoData.created_at ? new Date(repoData.created_at) : null;
    const updatedAt = repoData.updated_at ? new Date(repoData.updated_at) : null;
    const pushedAt = repoData.pushed_at ? new Date(repoData.pushed_at) : null;

    const features = {};

    if (createdAt) {
      const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      features.repoAgeDays = ageDays;
      features.repoAgeMonths = ageDays / 30;
      features.repoAgeYears = ageDays / 365;
    }

    if (updatedAt) {
      const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
      features.daysSinceUpdate = daysSinceUpdate;
      features.isActive = daysSinceUpdate < 30 ? 1 : 0; // Active if updated in last 30 days
    }

    if (pushedAt) {
      const daysSincePush = (now - pushedAt) / (1000 * 60 * 60 * 24);
      features.daysSincePush = daysSincePush;
      features.recentlyPushed = daysSincePush < 7 ? 1 : 0; // Pushed in last week
    }

    // Activity score (based on recency)
    if (updatedAt && createdAt) {
      const totalAge = (now - createdAt) / (1000 * 60 * 60 * 24);
      const timeSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
      features.activityScore = totalAge > 0 ? 1 - (timeSinceUpdate / totalAge) : 0;
    }

    return features;
  }

  /**
   * Extract language-specific features
   */
  extractLanguageFeatures(repoData) {
    const f = repoData.features || {};
    const languages = f.languages || [];
    const primaryLanguage = f.primaryLanguage || 'Unknown';

    const languageFeatures = {
      languageCount: languages.length,
      hasTypeScript: languages.includes('TypeScript') ? 1 : 0,
      hasJavaScript: languages.includes('JavaScript') ? 1 : 0,
      hasPython: languages.includes('Python') ? 1 : 0,
      hasRust: languages.includes('Rust') ? 1 : 0,
      hasGo: languages.includes('Go') ? 1 : 0,
      hasJava: languages.includes('Java') ? 1 : 0,
      hasMultipleLanguages: languages.length > 1 ? 1 : 0,
    };

    // Primary language encoding (one-hot style)
    const primaryLangMap = {
      'TypeScript': 'primaryTypeScript',
      'JavaScript': 'primaryJavaScript',
      'Python': 'primaryPython',
      'Rust': 'primaryRust',
      'Go': 'primaryGo',
      'Java': 'primaryJava',
    };

    Object.keys(primaryLangMap).forEach(lang => {
      languageFeatures[primaryLangMap[lang]] = primaryLanguage === lang ? 1 : 0;
    });

    return languageFeatures;
  }

  /**
   * Extract architecture features
   */
  extractArchitectureFeatures(repoData) {
    const f = repoData.features || {};
    const repoName = repoData.repo || '';
    const url = repoData.url || '';

    // Heuristics for architecture detection
    const isMonorepo = repoName.includes('monorepo') || 
                      repoName.includes('workspace') ||
                      (f.fileCount || 0) > 1000;

    const isMicroservice = repoName.includes('service') ||
                          repoName.includes('microservice') ||
                          url.includes('/services/');

    const isLibrary = repoName.includes('lib') ||
                     repoName.includes('sdk') ||
                     repoName.includes('package');

    const isApp = repoName.includes('app') ||
                  repoName.includes('web') ||
                  repoName.includes('frontend') ||
                  repoName.includes('backend');

    return {
      isMonorepo: isMonorepo ? 1 : 0,
      isMicroservice: isMicroservice ? 1 : 0,
      isLibrary: isLibrary ? 1 : 0,
      isApp: isApp ? 1 : 0,
      complexityScore: (
        (isMonorepo ? 1 : 0) * 0.4 +
        (isMicroservice ? 1 : 0) * 0.3 +
        (f.fileCount || 0) / 1000 * 0.3
      ),
    };
  }

  /**
   * Extract code quality features
   */
  extractCodeQualityFeatures(repoData) {
    const f = repoData.features || {};

    // Code file ratio
    const codeFileRatio = f.fileCount > 0 
      ? (f.codeFileCount || 0) / f.fileCount 
      : 0;

    // Quality indicators count
    const qualityIndicators = [
      f.hasTests,
      f.hasCI,
      f.hasDocker,
      f.hasReadme,
      f.hasLicense,
      f.hasDescription,
    ].filter(Boolean).length;

    return {
      codeFileRatio,
      qualityIndicatorsCount: qualityIndicators,
      qualityIndicatorsRatio: qualityIndicators / 6, // 6 total indicators
      hasAllQualityIndicators: qualityIndicators === 6 ? 1 : 0,
    };
  }

  /**
   * Extract community features
   */
  extractCommunityFeatures(repoData) {
    const f = repoData.features || {};

    // Engagement metrics
    const totalEngagement = (f.stars || 0) + (f.forks || 0);
    const engagementPerIssue = f.openIssues > 0 
      ? totalEngagement / f.openIssues 
      : 0;

    // Community health score
    const communityHealth = (
      (f.stars || 0) > 10 ? 0.3 : 0 +
      (f.forks || 0) > 5 ? 0.2 : 0 +
      (f.hasTopics ? 1 : 0) * 0.2 +
      (f.hasDescription ? 1 : 0) * 0.3
    );

    return {
      totalEngagement,
      engagementPerIssue,
      communityHealth,
      hasCommunity: (f.stars || 0) > 0 || (f.forks || 0) > 0 ? 1 : 0,
      isPopular: (f.stars || 0) > 100 ? 1 : 0,
    };
  }

  /**
   * Batch process multiple repositories
   */
  async batchExtractFeatures(repositories) {
    await this.initialize();

    log.info(`📊 Extracting enhanced features from ${repositories.length} repositories...`);

    const results = [];
    for (let i = 0; i < repositories.length; i++) {
      const repo = repositories[i];
      try {
        const features = await this.extractEnhancedFeatures(repo);
        results.push({
          repo: repo.repo || repo.url,
          features,
          originalQuality: repo.quality || repo.features?.qualityScore || 0,
        });

        if ((i + 1) % 10 === 0) {
          log.info(`   Processed ${i + 1}/${repositories.length} repositories...`);
        }
      } catch (error) {
        log.warn(`⚠️  Failed to extract features from ${repo.repo || repo.url}:`, error.message);
      }
    }

    log.info(`✅ Extracted features from ${results.length} repositories`);

    return results;
  }

  /**
   * Get feature importance (for explainability)
   */
  getFeatureCategories() {
    return {
      basic: [
        'stars', 'forks', 'openIssues', 'fileCount', 'codeFileCount',
        'hasLicense', 'hasDescription', 'hasTopics', 'hasReadme',
        'hasTests', 'hasCI', 'hasDocker', 'hasConfig',
      ],
      interaction: [
        'starsForksRatio', 'starsPerFile', 'forksPerFile',
        'testsAndCI', 'testsAndDocker', 'ciAndDocker',
        'readmeAndLicense', 'readmeAndDescription', 'descriptionAndTopics',
        'codeQualityScore',
      ],
      temporal: [
        'repoAgeDays', 'repoAgeMonths', 'repoAgeYears',
        'daysSinceUpdate', 'isActive', 'daysSincePush',
        'recentlyPushed', 'activityScore',
      ],
      language: [
        'languageCount', 'hasTypeScript', 'hasJavaScript', 'hasPython',
        'hasRust', 'hasGo', 'hasJava', 'hasMultipleLanguages',
        'primaryTypeScript', 'primaryJavaScript', 'primaryPython',
        'primaryRust', 'primaryGo', 'primaryJava',
      ],
      architecture: [
        'isMonorepo', 'isMicroservice', 'isLibrary', 'isApp', 'complexityScore',
      ],
      quality: [
        'codeFileRatio', 'qualityIndicatorsCount', 'qualityIndicatorsRatio',
        'hasAllQualityIndicators',
      ],
      community: [
        'totalEngagement', 'engagementPerIssue', 'communityHealth',
        'hasCommunity', 'isPopular',
      ],
    };
  }
}

// Singleton instance
let instance = null;

async function getEnhancedFeatureEngineering() {
  if (!instance) {
    instance = new EnhancedFeatureEngineering();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  EnhancedFeatureEngineering,
  getEnhancedFeatureEngineering,
};

