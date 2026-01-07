/**
 * GitHub File Fetcher
 * 
 * Fetches repository files from GitHub API for quality analysis.
 * Supports both public and private repos (with user tokens).
 */

const { Octokit } = require('@octokit/rest');

class GitHubFileFetcher {
  constructor() {
    this.octokit = null;
    this.userOctokit = null;
  }

  /**
   * Initialize with GitHub token
   */
  initialize(token = null) {
    // Use provided token or fall back to env
    const githubToken = token || process.env.GITHUB_TOKEN;
    
    if (githubToken) {
      this.octokit = new Octokit({ auth: githubToken });
    } else {
      // Try to create unauthenticated client (rate limited)
      this.octokit = new Octokit();
    }
  }

  /**
   * Initialize with user's token (for private repos)
   */
  initializeUserToken(userToken) {
    if (userToken) {
      this.userOctokit = new Octokit({ auth: userToken });
    }
  }

  /**
   * Fetch all code files from a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Fetch options
   * @returns {Promise<Array>} Array of {path, content} objects
   */
  async fetchRepositoryFiles(owner, repo, options = {}) {
    const {
      maxFiles = 100,
      maxFileSize = 100000, // 100KB max per file
      extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php'],
      excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'target', '__pycache__', '.venv', 'vendor'],
      branch = null,
    } = options;

    const octokit = this.userOctokit || this.octokit;
    if (!octokit) {
      throw new Error('GitHub client not initialized');
    }

    try {
      // Get default branch if not specified
      let defaultBranch = branch;
      if (!defaultBranch) {
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        defaultBranch = repoData.default_branch || 'main';
      }

      // Get tree for default branch (recursive)
      const { data: branchData } = await octokit.repos.getBranch({
        owner,
        repo,
        branch: defaultBranch,
      });

      const treeSha = branchData.commit.sha;

      const { data: treeData } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: '1',
      });

      // Filter for code files
      const codeFiles = treeData.tree
        .filter(item => {
          if (item.type !== 'blob') return false;
          if (!item.path) return false;

          // Check extension
          const ext = this.getFileExtension(item.path);
          if (!extensions.includes(ext)) return false;

          // Check excluded directories
          if (excludeDirs.some(dir => item.path.includes(`/${dir}/`) || item.path.startsWith(`${dir}/`))) {
            return false;
          }

          // Check file size (if available)
          if (item.size && item.size > maxFileSize) return false;

          return true;
        })
        .slice(0, maxFiles);

      // Fetch file contents
      const files = [];
      for (const file of codeFiles) {
        try {
          const content = await this.fetchFileContent(owner, repo, file.sha, octokit);
          if (content) {
            files.push({
              path: file.path,
              content: content,
              size: file.size || 0,
            });
          }
        } catch (error) {
          console.warn(`[File Fetcher] Failed to fetch ${file.path}:`, error.message);
          // Continue with other files
        }
      }

      return files;
    } catch (error) {
      console.error(`[File Fetcher] Error fetching files from ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Fetch content of a single file
   */
  async fetchFileContent(owner, repo, sha, octokit = null) {
    const client = octokit || this.userOctokit || this.octokit;
    if (!client) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const { data: blob } = await client.git.getBlob({
        owner,
        repo,
        file_sha: sha,
      });

      if (blob.encoding === 'base64') {
        return Buffer.from(blob.content, 'base64').toString('utf-8');
      } else {
        return blob.content;
      }
    } catch (error) {
      console.error(`[File Fetcher] Error fetching file content:`, error);
      throw error;
    }
  }

  /**
   * Get file extension
   */
  getFileExtension(filePath) {
    const parts = filePath.split('.');
    if (parts.length < 2) return '';
    return '.' + parts[parts.length - 1].toLowerCase();
  }

  /**
   * Fetch files with caching support
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Fetch options
   * @param {Object} cache - Cache instance (optional)
   * @returns {Promise<Array>} Array of {path, content} objects
   */
  async fetchRepositoryFilesWithCache(owner, repo, options = {}, cache = null) {
    const cacheKey = `github_files:${owner}/${repo}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (cache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from GitHub
    const files = await this.fetchRepositoryFiles(owner, repo, options);

    // Store in cache
    if (cache) {
      cache.set(cacheKey, files, 60 * 60 * 1000); // 1 hour cache
    }

    return files;
  }
}

module.exports = new GitHubFileFetcher();

