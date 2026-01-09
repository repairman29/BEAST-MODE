/**
 * Project Analyzer
 * 
 * Analyzes repository structure to detect:
 * - Programming languages
 * - Frameworks and tools
 * - Project type
 * - Build system
 * - Dependencies
 */

const fs = require('fs').promises;
const path = require('path');

class ProjectAnalyzer {
  constructor() {
    this.languageMap = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.rs': 'Rust',
      '.go': 'Go',
      '.java': 'Java',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
    };

    this.frameworkIndicators = {
      'next': 'Next.js',
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'express': 'Express',
      'fastapi': 'FastAPI',
      'django': 'Django',
      'flask': 'Flask',
      'spring': 'Spring',
      'nestjs': 'NestJS',
    };
  }

  /**
   * Analyze repository to extract project context
   * @param {string} repoPath - Path to repository
   * @param {string} repoName - Repository name (owner/repo)
   * @returns {Object} Project context
   */
  async analyzeProject(repoPath, repoName) {
    const context = {
      repo: repoName,
      name: repoName.split('/').pop(),
      languages: [],
      primaryLanguage: 'Unknown',
      frameworks: [],
      buildSystem: null,
      packageManager: null,
      hasTests: false,
      hasCI: false,
      dependencies: {},
      scripts: {},
      description: '',
      version: '',
      type: 'library', // library, application, monorepo
    };

    try {
      // Read package.json if it exists
      const packageJsonPath = path.join(repoPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        context.description = packageJson.description || '';
        context.version = packageJson.version || '';
        context.scripts = packageJson.scripts || {};
        context.dependencies = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {}),
        };

        // Detect package manager
        if (await this.fileExists(path.join(repoPath, 'package-lock.json'))) {
          context.packageManager = 'npm';
        } else if (await this.fileExists(path.join(repoPath, 'yarn.lock'))) {
          context.packageManager = 'yarn';
        } else if (await this.fileExists(path.join(repoPath, 'pnpm-lock.yaml'))) {
          context.packageManager = 'pnpm';
        }

        // Detect frameworks from dependencies
        for (const [dep, version] of Object.entries(context.dependencies)) {
          const depLower = dep.toLowerCase();
          for (const [indicator, framework] of Object.entries(this.frameworkIndicators)) {
            if (depLower.includes(indicator)) {
              if (!context.frameworks.includes(framework)) {
                context.frameworks.push(framework);
              }
            }
          }
        }

        // Detect project type
        if (packageJson.workspaces || packageJson.workspace) {
          context.type = 'monorepo';
        } else if (context.frameworks.includes('Next.js') || context.frameworks.includes('React')) {
          context.type = 'application';
        } else if (packageJson.main || packageJson.module) {
          context.type = 'library';
        }
      } catch (e) {
        // No package.json or invalid JSON
      }

      // Analyze file structure
      const fileAnalysis = await this.analyzeFiles(repoPath);
      context.languages = fileAnalysis.languages;
      context.primaryLanguage = fileAnalysis.primaryLanguage;
      context.hasTests = fileAnalysis.hasTests;
      context.hasCI = fileAnalysis.hasCI;

      // Detect build system
      if (await this.fileExists(path.join(repoPath, 'tsconfig.json'))) {
        context.buildSystem = 'TypeScript';
      } else if (await this.fileExists(path.join(repoPath, 'webpack.config.js'))) {
        context.buildSystem = 'Webpack';
      } else if (await this.fileExists(path.join(repoPath, 'vite.config.js'))) {
        context.buildSystem = 'Vite';
      } else if (await this.fileExists(path.join(repoPath, 'rollup.config.js'))) {
        context.buildSystem = 'Rollup';
      }

    } catch (error) {
      console.error(`[ProjectAnalyzer] Error analyzing ${repoPath}:`, error.message);
    }

    return context;
  }

  /**
   * Analyze files in repository
   */
  async analyzeFiles(repoPath, maxDepth = 3, currentDepth = 0) {
    const languages = {};
    let hasTests = false;
    let hasCI = false;

    if (currentDepth >= maxDepth) {
      return { languages: [], primaryLanguage: 'Unknown', hasTests: false, hasCI: false };
    }

    try {
      const entries = await fs.readdir(repoPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files and node_modules
        if (entry.name.startsWith('.') && entry.name !== '.github') {
          continue;
        }
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
          continue;
        }

        const fullPath = path.join(repoPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively analyze subdirectories
          const subAnalysis = await this.analyzeFiles(fullPath, maxDepth, currentDepth + 1);
          Object.keys(subAnalysis.languages).forEach(lang => {
            languages[lang] = (languages[lang] || 0) + subAnalysis.languages[lang];
          });
          hasTests = hasTests || subAnalysis.hasTests;
          hasCI = hasCI || subAnalysis.hasCI;
        } else {
          // Analyze file
          const ext = path.extname(entry.name).toLowerCase();
          const language = this.languageMap[ext];
          if (language) {
            languages[language] = (languages[language] || 0) + 1;
          }

          // Check for test files
          if (entry.name.includes('.test.') || entry.name.includes('.spec.') || 
              entry.name.includes('_test') || entry.name.includes('test_')) {
            hasTests = true;
          }

          // Check for CI
          if (entry.name === 'ci.yml' || entry.name === 'ci.yaml' || 
              fullPath.includes('.github/workflows')) {
            hasCI = true;
          }
        }
      }
    } catch (error) {
      // Can't read directory
    }

    // Determine primary language
    const primaryLanguage = Object.keys(languages).length > 0
      ? Object.entries(languages).sort((a, b) => b[1] - a[1])[0][0]
      : 'Unknown';

    return {
      languages: Object.keys(languages),
      primaryLanguage,
      hasTests,
      hasCI,
    };
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get build command from package.json scripts
   */
  getBuildCommand(context) {
    if (context.scripts.build) {
      return context.scripts.build;
    }
    if (context.buildSystem === 'TypeScript') {
      return 'tsc';
    }
    if (context.packageManager === 'npm') {
      return 'npm run build';
    }
    return 'npm run build';
  }

  /**
   * Get test command from package.json scripts
   */
  getTestCommand(context) {
    if (context.scripts.test) {
      return context.scripts.test;
    }
    if (context.primaryLanguage === 'JavaScript' || context.primaryLanguage === 'TypeScript') {
      return 'npm test';
    }
    if (context.primaryLanguage === 'Python') {
      return 'pytest';
    }
    return 'npm test';
  }

  /**
   * Get install command based on package manager
   */
  getInstallCommand(context) {
    if (context.packageManager === 'yarn') {
      return 'yarn install';
    }
    if (context.packageManager === 'pnpm') {
      return 'pnpm install';
    }
    return 'npm install';
  }
}

module.exports = { ProjectAnalyzer };
