import { NextRequest, NextResponse } from 'next/server';
import { fetchRepository, fetchRepositoryContents, octokit } from '../../../../lib/github';
import cache, { cacheKeys, cacheTTL } from '../../../../lib/cache';
import queryOptimizer from '../../../../lib/query-optimizer';

/**
 * GitHub Repository Scanning API
 * 
 * Scans a GitHub repository for code quality issues using GitHub API
 */
export async function POST(request: NextRequest) {
  try {
    const { repo, url } = await request.json();

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository is required' },
        { status: 400 }
      );
    }

    const [owner, repoName] = repo.split('/');

    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Invalid repository format. Use: owner/repo' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = cacheKeys.scanResult(repo);
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Use real GitHub API if configured
    if (octokit) {
      try {
        // Fetch repository metadata
        const repoData = await fetchRepository(owner, repoName);

        // Fetch repository languages
        const { data: languages } = await octokit.repos.listLanguages({
          owner,
          repo: repoName
        });

        // Calculate quality score based on repository metrics
        const stars = repoData.stargazers_count || 0;
        const forks = repoData.forks_count || 0;
        const openIssues = repoData.open_issues_count || 0;
        const hasLicense = repoData.license ? 1 : 0;
        const hasDescription = repoData.description ? 1 : 0;
        const hasTopics = (repoData.topics?.length || 0) > 0 ? 1 : 0;
        // Check for README by trying to fetch it
        let hasReadme = 0;
        try {
          await fetchRepositoryContents(owner, repoName, 'README.md');
          hasReadme = 1;
        } catch {
          // No README found
        }

        // Fetch repository tree to analyze structure
        let fileCount = 0;
        let codeFileCount = 0;
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php'];
        let hasTests = false;
        let hasCI = false;
        let hasDocker = false;
        let hasConfig = false;

        try {
          const { data: tree } = await octokit.git.getTree({
            owner,
            repo: repoName,
            tree_sha: repoData.default_branch,
            recursive: '1'
          });

          if (tree.tree) {
            fileCount = tree.tree.filter((item: any) => item.type === 'blob').length;
            codeFileCount = tree.tree.filter((item: any) => {
              const ext = item.path?.split('.').pop()?.toLowerCase();
              return codeExtensions.includes(`.${ext}`);
            }).length;
            
            // Check for common files
            const paths = tree.tree.map((item: any) => item.path?.toLowerCase() || '');
            hasTests = paths.some((p: string) => p.includes('test') || p.includes('spec') || p.includes('__tests__'));
            hasCI = paths.some((p: string) => p.includes('.github/workflows') || p.includes('.gitlab-ci') || p.includes('ci.yml'));
            hasDocker = paths.some((p: string) => p.includes('dockerfile') || p.includes('docker-compose'));
            hasConfig = paths.some((p: string) => 
              p.includes('package.json') || 
              p.includes('requirements.txt') || 
              p.includes('pom.xml') || 
              p.includes('cargo.toml') ||
              p.includes('go.mod')
            );
          }
        } catch (treeError) {
          // Tree fetch failed, use defaults
          console.warn('Could not fetch repository tree:', treeError);
        }

        // Calculate comprehensive quality score (0-100)
        const baseScore = 50;
        const starScore = Math.min(stars / 100, 15); // Up to 15 points
        const forkScore = Math.min(forks / 50, 5); // Up to 5 points
        const structureScore = Math.min((fileCount || 0) / 20, 10); // Up to 10 points for good structure
        const codeRatio = (codeFileCount || 0) > 0 && (fileCount || 0) > 0 ? Math.min(((codeFileCount || 0) / (fileCount || 1)) * 10, 10) : 0; // Code file ratio
        const qualityScore = 
          (hasLicense ? 5 : 0) + 
          (hasDescription ? 5 : 0) + 
          (hasTopics ? 3 : 0) + 
          (hasReadme ? 3 : 0) +
          (hasTests ? 8 : 0) + // Tests are important
          (hasCI ? 5 : 0) + // CI/CD shows maturity
          (hasDocker ? 3 : 0) + // Docker shows deployment readiness
          (hasConfig ? 2 : 0); // Config files show proper setup
        
        const issuePenalty = Math.min(openIssues / 5, 15); // Penalty for open issues
        
        const score = Math.min(100, Math.max(30,
          baseScore +
          starScore +
          forkScore +
          structureScore +
          codeRatio +
          qualityScore -
          issuePenalty
        ));

        // Generate detected issues (problems found)
        const detectedIssues = [];
        if (!hasReadme) detectedIssues.push({ 
          title: 'Missing README.md',
          description: 'A README file helps users understand your project quickly. Add documentation about installation, usage, and features.',
          priority: 'high', 
          category: 'documentation',
          type: 'missing_file'
        });
        if (!hasLicense) detectedIssues.push({ 
          title: 'Missing LICENSE File',
          description: 'Specify a license to clarify how others can use your code. Consider MIT, Apache 2.0, or GPL.',
          priority: 'high', 
          category: 'legal',
          type: 'missing_file'
        });
        if (!hasTests) detectedIssues.push({ 
          title: 'No Test Suite Found',
          description: 'Tests improve code reliability and prevent regressions. Consider adding unit tests, integration tests, or end-to-end tests.',
          priority: 'high', 
          category: 'quality',
          type: 'missing_tests'
        });
        if (!hasCI) detectedIssues.push({ 
          title: 'No CI/CD Pipeline',
          description: 'Automate your build and test process with CI/CD workflows. Set up GitHub Actions, GitLab CI, or similar.',
          priority: 'medium', 
          category: 'devops',
          type: 'missing_ci'
        });
        if (!hasDocker) detectedIssues.push({ 
          title: 'Missing Dockerfile',
          description: 'Containerize your application for consistent deployment environments. This makes it easier to deploy and scale.',
          priority: 'low', 
          category: 'devops',
          type: 'missing_docker'
        });
        if (!hasConfig) detectedIssues.push({ 
          title: 'Missing Configuration Files',
          description: 'Standard configuration files (e.g., package.json, tsconfig.json) are crucial for project setup and tooling.',
          priority: 'medium', 
          category: 'setup',
          type: 'missing_config'
        });
        if (!hasDescription) detectedIssues.push({ 
          title: 'Missing Repository Description',
          description: 'A clear description helps others discover and understand your project. Include key features and use cases.',
          priority: 'low', 
          category: 'documentation',
          type: 'missing_description'
        });
        if (codeFileCount < 5 && fileCount > 10) detectedIssues.push({ 
          title: 'Poor Code Organization',
          description: 'Consider organizing code files into logical directories. This improves maintainability and developer experience.',
          priority: 'low', 
          category: 'structure',
          type: 'structure'
        });
        if (openIssues > 10) detectedIssues.push({ 
          title: `High Number of Open Issues (${openIssues})`,
          description: `You have ${openIssues} open issues. Consider prioritizing and resolving them to improve project health and maintainability.`,
          priority: 'medium', 
          category: 'maintenance',
          type: 'open_issues',
          count: openIssues
        });
        if (fileCount === 0 || codeFileCount === 0) detectedIssues.push({ 
          title: 'No Code Files Detected',
          description: 'Unable to detect code files in the repository. This may indicate an empty repository or access issues.',
          priority: 'high', 
          category: 'structure',
          type: 'no_code'
        });

        // Generate actionable recommendations (improvements)
        const recommendations = [];
        if (!hasReadme) recommendations.push({ 
          title: 'Add a README.md',
          description: 'A good README helps users understand your project quickly. Include installation instructions, usage examples, and feature overview.',
          priority: 'high', 
          category: 'documentation',
          message: 'Add a README.md file to help users understand your project'
        });
        if (!hasLicense) recommendations.push({ 
          title: 'Add a LICENSE file',
          description: 'Specify a license to clarify how others can use your code. Consider MIT, Apache 2.0, or GPL depending on your needs.',
          priority: 'high', 
          category: 'legal',
          message: 'Add a LICENSE file to clarify usage rights'
        });
        if (!hasTests) recommendations.push({ 
          title: 'Implement unit/integration tests',
          description: 'Tests improve code reliability and prevent regressions. Start with critical paths and gradually increase coverage.',
          priority: 'high', 
          category: 'quality',
          message: 'Add test files to improve code reliability'
        });
        if (!hasCI) recommendations.push({ 
          title: 'Set up Continuous Integration (CI)',
          description: 'Automate your build and test process with CI/CD workflows. Use GitHub Actions, GitLab CI, or similar tools.',
          priority: 'medium', 
          category: 'devops',
          message: 'Set up CI/CD workflows for automated testing and deployment'
        });
        if (!hasDocker) recommendations.push({ 
          title: 'Add a Dockerfile',
          description: 'Containerize your application for consistent deployment environments. This makes it easier to deploy and scale.',
          priority: 'low', 
          category: 'devops',
          message: 'Add Dockerfile for containerized deployments'
        });
        if (openIssues > 10) recommendations.push({ 
          title: `Address open issues (${openIssues})`,
          description: `You have ${openIssues} open issues. Prioritize and resolve them to improve project health and maintainability.`,
          priority: 'medium', 
          category: 'issues',
          message: `Address ${openIssues} open issues to improve project health`
        });
        if (!hasDescription) recommendations.push({ 
          title: 'Add repository description',
          description: 'A clear description helps others discover and understand your project. Include key features and use cases.',
          priority: 'low', 
          category: 'documentation',
          message: 'Add a repository description to improve discoverability'
        });
        if (!hasConfig) recommendations.push({ 
          title: 'Ensure proper configuration files',
          description: 'Standard configuration files (e.g., package.json, tsconfig.json) are crucial for project setup and tooling.',
          priority: 'medium', 
          category: 'setup',
          message: 'Ensure proper configuration files are present'
        });
        if (codeFileCount < 5 && fileCount > 10) recommendations.push({ 
          title: 'Organize code structure',
          description: 'Consider organizing code files into logical directories. This improves maintainability and developer experience.',
          priority: 'low', 
          category: 'structure',
          message: 'Consider organizing code files better'
        });

        const issues = detectedIssues.length;
        const improvements = recommendations.length;

        const response = {
          repo,
          url: url || repoData.html_url,
          score: Math.round(score),
          issues,
          improvements,
          detectedIssues,
          recommendations,
          metrics: {
            stars,
            forks,
            openIssues,
            fileCount,
            codeFileCount,
            language: Object.keys(languages)[0] || 'Unknown',
            languages: Object.keys(languages),
            complexity: (Object.keys(languages).length * 0.5 + 1).toFixed(1),
            coverage: hasTests ? Math.min(100, Math.max(70, 100 - (openIssues * 2))) : 0,
            maintainability: Math.min(100, Math.max(75, score)),
            hasTests,
            hasCI,
            hasDocker,
            hasReadme,
            hasLicense
          },
          repository: {
            name: repoData.name,
            description: repoData.description,
            language: repoData.language,
            createdAt: repoData.created_at,
            updatedAt: repoData.updated_at,
            defaultBranch: repoData.default_branch
          },
          timestamp: new Date().toISOString()
        };

        // Cache the response (30 minutes for scan results)
        const cacheKey = cacheKeys.scanResult(repo);
        cache.set(cacheKey, response, cacheTTL.long);

        return NextResponse.json(response);
      } catch (githubError: any) {
        if (githubError.message === 'Repository not found') {
          return NextResponse.json(
            { error: 'Repository not found or is private' },
            { status: 404 }
          );
        }
        throw githubError;
      }
    }

    // Fallback: Mock data if GitHub token not configured
    console.warn('GitHub token not configured - using deterministic mock scan results');
    
    // Use deterministic hash of repo name for consistent mock data
    const hashRepo = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const repoHash = hashRepo(repo);
    const seed = repoHash % 1000;
    
    // Deterministic mock data based on repo name
    const score = 70 + (seed % 30);
    const mockHasReadme = (seed % 3) !== 0;
    const mockHasLicense = (seed % 4) !== 0;
    const mockHasTests = (seed % 5) !== 0;
    const mockHasCI = (seed % 6) !== 0;
    const mockHasDocker = (seed % 7) !== 0;
    const mockHasConfig = (seed % 2) === 0;
    const mockHasDescription = (seed % 3) !== 1;
    const mockOpenIssues = Math.floor(seed / 10);
    const mockFileCount = 50 + (seed % 200);
    const mockCodeFileCount = Math.floor(mockFileCount * 0.7);
    const mockStars = Math.floor(seed * 2.5);
    const mockForks = Math.floor(seed * 0.8);
    
    // Generate detected issues based on mock flags
    const mockDetectedIssues = [];
    if (!mockHasReadme) mockDetectedIssues.push({ 
      title: 'Missing README.md',
      description: 'A README file helps users understand your project quickly. Add documentation about installation, usage, and features.',
      priority: 'high', 
      category: 'documentation',
      type: 'missing_file'
    });
    if (!mockHasLicense) mockDetectedIssues.push({ 
      title: 'Missing LICENSE File',
      description: 'Specify a license to clarify how others can use your code. Consider MIT, Apache 2.0, or GPL.',
      priority: 'high', 
      category: 'legal',
      type: 'missing_file'
    });
    if (!mockHasTests) mockDetectedIssues.push({ 
      title: 'No Test Suite Found',
      description: 'Tests improve code reliability and prevent regressions. Consider adding unit tests, integration tests, or end-to-end tests.',
      priority: 'high', 
      category: 'quality',
      type: 'missing_tests'
    });
    if (!mockHasCI) mockDetectedIssues.push({ 
      title: 'No CI/CD Pipeline',
      description: 'Automate your build and test process with CI/CD workflows. Set up GitHub Actions, GitLab CI, or similar.',
      priority: 'medium', 
      category: 'devops',
      type: 'missing_ci'
    });
    if (!mockHasDocker) mockDetectedIssues.push({ 
      title: 'Missing Dockerfile',
      description: 'Containerize your application for consistent deployment environments. This makes it easier to deploy and scale.',
      priority: 'low', 
      category: 'devops',
      type: 'missing_docker'
    });
    if (!mockHasConfig) mockDetectedIssues.push({ 
      title: 'Missing Configuration Files',
      description: 'Standard configuration files (e.g., package.json, tsconfig.json) are crucial for project setup and tooling.',
      priority: 'medium', 
      category: 'setup',
      type: 'missing_config'
    });
    if (!mockHasDescription) mockDetectedIssues.push({ 
      title: 'Missing Repository Description',
      description: 'A clear description helps others discover and understand your project. Include key features and use cases.',
      priority: 'low', 
      category: 'documentation',
      type: 'missing_description'
    });
    if (mockOpenIssues > 10) mockDetectedIssues.push({ 
      title: `High Number of Open Issues (${mockOpenIssues})`,
      description: `You have ${mockOpenIssues} open issues. Consider prioritizing and resolving them to improve project health and maintainability.`,
      priority: 'medium', 
      category: 'maintenance',
      type: 'open_issues',
      count: mockOpenIssues
    });
    
    // Generate recommendations
    const mockRecommendations = [];
    if (!mockHasReadme) mockRecommendations.push({ 
      title: 'Add a README.md',
      description: 'A good README helps users understand your project quickly. Include installation instructions, usage examples, and feature overview.',
      priority: 'high', 
      category: 'documentation',
      message: 'Add a README.md file to help users understand your project'
    });
    if (!mockHasLicense) mockRecommendations.push({ 
      title: 'Add a LICENSE file',
      description: 'Specify a license to clarify how others can use your code. Consider MIT, Apache 2.0, or GPL depending on your needs.',
      priority: 'high', 
      category: 'legal',
      message: 'Add a LICENSE file to clarify usage rights'
    });
    if (!mockHasTests) mockRecommendations.push({ 
      title: 'Implement unit/integration tests',
      description: 'Tests improve code reliability and prevent regressions. Start with critical paths and gradually increase coverage.',
      priority: 'high', 
      category: 'quality',
      message: 'Add test files to improve code reliability'
    });
    if (!mockHasCI) mockRecommendations.push({ 
      title: 'Set up Continuous Integration (CI)',
      description: 'Automate your build and test process with CI/CD workflows. Use GitHub Actions, GitLab CI, or similar tools.',
      priority: 'medium', 
      category: 'devops',
      message: 'Set up CI/CD workflows for automated testing and deployment'
    });
    if (!mockHasDocker) mockRecommendations.push({ 
      title: 'Add a Dockerfile',
      description: 'Containerize your application for consistent deployment environments. This makes it easier to deploy and scale.',
      priority: 'low', 
      category: 'devops',
      message: 'Add Dockerfile for containerized deployments'
    });
    if (mockOpenIssues > 10) mockRecommendations.push({ 
      title: `Address open issues (${mockOpenIssues})`,
      description: `You have ${mockOpenIssues} open issues. Prioritize and resolve them to improve project health and maintainability.`,
      priority: 'medium', 
      category: 'issues',
      message: `Address ${mockOpenIssues} open issues to improve project health`
    });

    const response = {
      repo,
      url,
      score,
      issues: mockDetectedIssues.length,
      improvements: mockRecommendations.length,
      detectedIssues: mockDetectedIssues,
      recommendations: mockRecommendations,
      metrics: {
        stars: mockStars,
        forks: mockForks,
        openIssues: mockOpenIssues,
        fileCount: mockFileCount,
        codeFileCount: mockCodeFileCount,
        language: seed % 3 === 0 ? 'TypeScript' : seed % 3 === 1 ? 'JavaScript' : 'Python',
        languages: seed % 3 === 0 ? ['TypeScript', 'JavaScript'] : seed % 3 === 1 ? ['JavaScript'] : ['Python'],
        complexity: (1 + (seed % 20) / 10).toFixed(1),
        coverage: mockHasTests ? Math.min(100, Math.max(70, 100 - (mockOpenIssues * 2))) : 0,
        maintainability: Math.min(100, Math.max(75, score)),
        hasTests: mockHasTests,
        hasCI: mockHasCI,
        hasDocker: mockHasDocker,
        hasReadme: mockHasReadme,
        hasLicense: mockHasLicense,
        hasConfig: mockHasConfig
      },
      timestamp: new Date().toISOString(),
      note: 'Mock data - configure GITHUB_TOKEN for real scanning. Results are deterministic based on repository name.'
    };

    // Cache the response (30 minutes for scan results)
    cache.set(cacheKey, response, cacheTTL.long);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('GitHub scan error:', error);
    // Return more helpful error messages
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = error.status || 500;
    
    return NextResponse.json(
      { 
        error: 'Failed to scan repository', 
        details: errorMessage,
        message: errorMessage.includes('not found') 
          ? 'Repository not found or is private. Make sure the repository exists and is public, or configure a GitHub token for private repos.'
          : errorMessage.includes('token')
          ? 'GitHub token not configured. Add GITHUB_TOKEN to your environment variables for real scanning.'
          : 'An error occurred while scanning the repository. Please try again or check the repository URL.'
      },
      { status: statusCode }
    );
  }
}

