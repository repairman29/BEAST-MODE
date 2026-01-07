/**
 * Public Repository Scanner for ML Training
 * 
 * Safely scans public GitHub repositories for ML training data
 * Respects opt-outs, licenses, and rate limits
 */

const { createLogger } = require('../utils/logger');
const { getAuditTrail } = require('./auditTrail');
const log = createLogger('PublicRepoScanner');

class PublicRepoScanner {
  constructor(octokit) {
    this.octokit = octokit;
    this.scannedRepos = new Set();
    this.optedOutRepos = new Set();
    this.rateLimitRemaining = 5000; // Start with GitHub's limit
    this.lastRateLimitCheck = Date.now();
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
   * Check if repository has opted out of AI training
   */
  async checkOptOut(owner, repo) {
    try {
      await this.octokit.repos.getContent({
        owner,
        repo,
        path: '.ai_exclude'
      });
      
      log.info(`⏭️  ${owner}/${repo} has opted out (`.ai_exclude` file found)`);
      this.optedOutRepos.add(`${owner}/${repo}`);
      
      // Audit log
      await this.initializeAudit();
      if (this.auditTrail) {
        await this.auditTrail.logOptOut(`${owner}/${repo}`, '.ai_exclude file found');
      }
      
      return true;
    } catch (error) {
      if (error.status === 404) {
        // No .ai_exclude file - OK to scan
        return false;
      }
      // Other error - log but don't block
      log.warn(`⚠️  Error checking opt-out for ${owner}/${repo}:`, error.message);
      return false;
    }
  }

  /**
   * Get repository license
   */
  async getLicense(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return {
        license: data.license?.spdx_id || 'None',
        licenseName: data.license?.name || 'No License',
        isPublic: data.private === false,
      };
    } catch (error) {
      log.warn(`⚠️  Error getting license for ${owner}/${repo}:`, error.message);
      return { license: 'Unknown', licenseName: 'Unknown', isPublic: false };
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit() {
    try {
      const { data } = await this.octokit.rateLimit.get();
      this.rateLimitRemaining = data.rate.remaining;
      this.lastRateLimitCheck = Date.now();
      
      if (this.rateLimitRemaining < 100) {
        log.warn(`⚠️  Rate limit low: ${this.rateLimitRemaining} requests remaining`);
        
        // Audit log
        await this.initializeAudit();
        if (this.auditTrail) {
          await this.auditTrail.logRateLimit('check', this.rateLimitRemaining, new Date(data.rate.reset * 1000).toISOString());
        }
        
        return false; // Should wait
      }
      
      return true; // OK to proceed
    } catch (error) {
      log.warn('⚠️  Error checking rate limit:', error.message);
      return true; // Continue anyway
    }
  }

  /**
   * Wait for rate limit reset
   */
  async waitForRateLimit() {
    try {
      const { data } = await this.octokit.rateLimit.get();
      const resetTime = new Date(data.rate.reset * 1000);
      const waitTime = resetTime - Date.now();
      
      if (waitTime > 0) {
        log.info(`⏳ Waiting ${Math.ceil(waitTime / 1000)}s for rate limit reset...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      log.warn('⚠️  Error waiting for rate limit:', error.message);
    }
  }

  /**
   * Scan public repository for ML training data (metadata only)
   */
  async scanPublicRepo(owner, repo) {
    const repoKey = `${owner}/${repo}`;
    
    // Skip if already scanned
    if (this.scannedRepos.has(repoKey)) {
      log.info(`⏭️  ${repoKey} already scanned`);
      return null;
    }

    // Check rate limit
    if (!(await this.checkRateLimit())) {
      await this.waitForRateLimit();
    }

    // Check opt-out
    if (await this.checkOptOut(owner, repo)) {
      return null; // Opted out
    }

    // Get license info
    const licenseInfo = await this.getLicense(owner, repo);
    
    // Only scan public repos
    if (!licenseInfo.isPublic) {
      log.info(`⏭️  ${repoKey} is private - skipping`);
      return null;
    }

    try {
      // Get repository metadata (no source code)
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      
      // Get languages
      const { data: languages } = await this.octokit.repos.listLanguages({ owner, repo });
      
      // Extract metadata only (no source code)
      const metadata = {
        repo: repoKey,
        url: repoData.html_url,
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        openIssues: repoData.open_issues_count || 0,
        hasLicense: repoData.license ? 1 : 0,
        hasDescription: repoData.description ? 1 : 0,
        hasTopics: (repoData.topics?.length || 0) > 0 ? 1 : 0,
        language: repoData.language || 'Unknown',
        languages: Object.keys(languages || {}),
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        license: licenseInfo.license,
        licenseName: licenseInfo.licenseName,
        isFork: repoData.fork || false,
        archived: repoData.archived || false,
        disabled: repoData.disabled || false,
      };

      // Get file structure (tree, not content)
      try {
        const { data: branchData } = await this.octokit.repos.getBranch({
          owner,
          repo,
          branch: repoData.default_branch || 'main'
        });

        const { data: treeData } = await this.octokit.git.getTree({
          owner,
          repo,
          tree_sha: branchData.commit.sha,
          recursive: '1'
        });

        // Count files (metadata only, no content)
        const files = treeData.tree.filter(item => item.type === 'blob');
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php'];
        const codeFiles = files.filter(file => {
          const ext = file.path.split('.').pop()?.toLowerCase();
          return codeExtensions.includes(`.${ext}`);
        });

        metadata.fileCount = files.length;
        metadata.codeFileCount = codeFiles.length;

        // Check for quality indicators (file paths only, no content)
        metadata.hasTests = files.some(f => 
          f.path.includes('test') || f.path.includes('spec') || f.path.includes('__tests__')
        ) ? 1 : 0;
        
        metadata.hasCI = files.some(f => 
          f.path.includes('.github/workflows') || f.path.includes('.gitlab-ci') || f.path.includes('ci.yml')
        ) ? 1 : 0;
        
        metadata.hasDocker = files.some(f => 
          f.path.includes('Dockerfile') || f.path.includes('docker-compose')
        ) ? 1 : 0;
        
        metadata.hasConfig = files.some(f => 
          f.path.includes('config') || f.path.includes('.config')
        ) ? 1 : 0;
        
        metadata.hasReadme = files.some(f => 
          f.path.toLowerCase().includes('readme')
        ) ? 1 : 0;
      } catch (error) {
        log.warn(`⚠️  Error getting file tree for ${repoKey}:`, error.message);
        // Continue with basic metadata
      }

      // Mark as scanned
      this.scannedRepos.add(repoKey);

      log.info(`✅ Scanned ${repoKey} (metadata only, no source code)`);

      // Audit log
      await this.initializeAudit();
      if (this.auditTrail) {
        await this.auditTrail.logRepositoryScan(repoKey, {
          metadata,
          source: 'public-repo',
          scannedAt: new Date().toISOString(),
          optedOut: false,
        });
      }

      return {
        metadata,
        source: 'public-repo',
        scannedAt: new Date().toISOString(),
        optedOut: false,
      };
    } catch (error) {
      log.error(`❌ Error scanning ${repoKey}:`, error.message);
      return null;
    }
  }

  /**
   * Batch scan multiple repositories
   */
  async batchScan(repositories, options = {}) {
    const {
      maxRepos = 100,
      delayBetweenScans = 1000, // 1 second delay
      onProgress = null,
    } = options;

    const results = [];
    const reposToScan = repositories.slice(0, maxRepos);

    log.info(`📊 Scanning ${reposToScan.length} public repositories...`);

    for (let i = 0; i < reposToScan.length; i++) {
      const repo = reposToScan[i];
      const [owner, repoName] = repo.split('/');

      if (!owner || !repoName) {
        log.warn(`⚠️  Invalid repo format: ${repo}`);
        continue;
      }

      const result = await this.scanPublicRepo(owner, repoName);
      
      if (result) {
        results.push(result);
      }

      // Progress callback
      if (onProgress) {
        onProgress(i + 1, reposToScan.length, results.length);
      }

      // Delay between scans (respect rate limits)
      if (i < reposToScan.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenScans));
      }
    }

    log.info(`✅ Scanned ${results.length} repositories (${this.optedOutRepos.size} opted out)`);

    return {
      results,
      totalScanned: reposToScan.length,
      successful: results.length,
      optedOut: this.optedOutRepos.size,
      optedOutRepos: Array.from(this.optedOutRepos),
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      scanned: this.scannedRepos.size,
      optedOut: this.optedOutRepos.size,
      rateLimitRemaining: this.rateLimitRemaining,
    };
  }
}

module.exports = {
  PublicRepoScanner,
};

