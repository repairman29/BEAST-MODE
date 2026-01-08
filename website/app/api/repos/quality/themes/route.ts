import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '@/lib/github-token';

// Dynamic require for Node.js modules
let patternAnalyzer: any;
let githubFileFetcher: any;
try {
  patternAnalyzer = require('../../../../../lib/mlops/patternAnalyzer');
  githubFileFetcher = require('../../../../../lib/github/fileFetcher');
} catch (error) {
  console.error('[Themes API] Failed to load modules:', error);
}

/**
 * Codebase Themes & Opportunities API
 * 
 * Analyzes codebase for bigger themes, opportunities, and architectural insights.
 * Goes beyond file-by-file to identify systemic patterns.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, files } = body;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }
    
    if (!patternAnalyzer) {
      return NextResponse.json(
        { error: 'Pattern analyzer not available' },
        { status: 500 }
      );
    }
    
    // Auto-fetch files if not provided
    let analyzedFiles = files;
    if (!analyzedFiles || !Array.isArray(analyzedFiles) || analyzedFiles.length === 0) {
      console.log(`[Themes API] Files not provided for ${repo}, fetching from GitHub...`);
      
      try {
        // Get user's GitHub token if available
        let userToken = null;
        const userId = request.cookies.get('github_oauth_user_id')?.value;
        if (userId) {
          try {
            userToken = await getDecryptedToken(userId);
            if (userToken) {
              githubFileFetcher.initializeUserToken(userToken);
            }
            } catch (error) {
              console.warn('[Themes API] Could not get user token:', error);
            }
          }

          const [owner, repoName] = repo.split('/');
          if (!owner || !repoName) {
            return NextResponse.json(
              { error: 'Invalid repository format. Use: owner/repo' },
              { status: 400 }
            );
          }

          analyzedFiles = await githubFileFetcher.fetchRepositoryFiles(owner, repoName, {
            maxFiles: 100, // More files for pattern analysis
            maxFileSize: 50000,
          });

          if (!analyzedFiles || analyzedFiles.length === 0) {
          return NextResponse.json(
            { error: 'No code files found in repository' },
            { status: 404 }
          );
        }

        console.log(`[Themes API] Fetched ${analyzedFiles.length} files from GitHub`);
      } catch (error: any) {
        console.error('[Themes API] Error fetching files from GitHub:', error);
        return NextResponse.json(
          { error: 'Failed to fetch files from GitHub', details: error.message },
          { status: 500 }
        );
      }
    }
    
    // Get repository context
    let repoContext = {};
    try {
      const qualityResponse = await fetch(`${request.nextUrl.origin}/api/repos/quality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ repo }),
      });
      
      if (qualityResponse.ok) {
        const qualityData = await qualityResponse.json();
        repoContext = {
          hasTests: qualityData.factors?.hasTests?.value > 0,
          hasCI: qualityData.factors?.hasCI?.value > 0,
          hasReadme: qualityData.factors?.hasReadme?.value > 0,
          quality: qualityData.quality,
          percentile: qualityData.percentile,
        };
      }
    } catch (error) {
      console.warn('[Themes API] Could not fetch repo context:', error);
    }
    
    // Analyze patterns and themes
    const patternAnalysis = await patternAnalyzer.analyzePatterns(analyzedFiles, repoContext);
    
    return NextResponse.json({
      repo,
      summary: {
        themesCount: patternAnalysis.themes.length,
        opportunitiesCount: patternAnalysis.opportunities.length,
        insightsCount: patternAnalysis.architecturalInsights.length,
        codebaseHealth: patternAnalysis.codebaseHealth,
      },
      themes: patternAnalysis.themes,
      opportunities: patternAnalysis.opportunities,
      patterns: patternAnalysis.patterns,
      architecturalInsights: patternAnalysis.architecturalInsights,
      codebaseHealth: patternAnalysis.codebaseHealth,
      recommendations: prioritizeRecommendations(patternAnalysis),
    });
    
  } catch (error: any) {
    console.error('[Themes API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze themes', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Prioritize recommendations based on impact and effort
 */
function prioritizeRecommendations(patternAnalysis: any) {
  const recommendations = [];
  
  // Combine themes and opportunities
  const allItems = [
    ...patternAnalysis.themes.map((t: any) => ({
      ...t,
      type: 'theme',
      priority: calculatePriority(t.severity, t.estimatedImpact, t.estimatedEffort),
    })),
    ...patternAnalysis.opportunities.map((o: any) => ({
      ...o,
      type: 'opportunity',
      priority: calculatePriority(o.impact, o.estimatedQualityGain, o.effort),
    })),
  ];
  
  // Sort by priority
  return allItems.sort((a, b) => b.priority - a.priority).slice(0, 10);
}

/**
 * Calculate priority score
 */
function calculatePriority(severity: string, impact: number, effort: string) {
  const severityMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const severityScore = severityMap[severity] || 2;
  const impactScore = impact || 0.1;
  const effortMap: Record<string, number> = { 'Low': 3, 'Medium': 2, 'High': 1 };
  const effortScore = effortMap[effort] || 2;
  
  return severityScore * impactScore * effortScore;
}

