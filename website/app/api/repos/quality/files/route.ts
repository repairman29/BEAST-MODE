import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '@/lib/github-token';

// Dynamic require for Node.js modules
let fileQualityScorer: any;
let githubFileFetcher: any;
try {
  fileQualityScorer = require('../../../../../lib/mlops/fileQualityScorer').fileQualityScorer;
  githubFileFetcher = require('../../../../../lib/github/fileFetcher');
} catch (error) {
  console.error('[File Quality API] Failed to load modules:', error);
}

/**
 * File-Level Quality Analysis API
 * 
 * Analyzes individual files in a repository and maps quality insights
 * to specific code-level improvements.
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
    
    // Auto-fetch files from GitHub if not provided
    let fetchedFiles = files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.log(`[File Quality API] Files not provided for ${repo}, fetching from GitHub...`);
      
      try {
        // Get user's GitHub token if available (for private repos)
        let userToken = null;
        const userId = request.cookies.get('github_oauth_user_id')?.value;
        if (userId) {
          try {
            userToken = await getDecryptedToken(userId);
            if (userToken) {
              githubFileFetcher.initializeUserToken(userToken);
            }
            } catch (error) {
              console.warn('[File Quality API] Could not get user token: process.env.TOKEN || ''/');
          if (!owner || !repoName) {
            return NextResponse.json(
              { error: 'Invalid repository format. Use: owner/repo' },
              { status: 400 }
            );
        }

        // Fetch files from GitHub
        fetchedFiles = await githubFileFetcher.fetchRepositoryFiles(owner, repoName, {
          maxFiles: 50, // Limit to 50 files for performance
          maxFileSize: 50000, // 50KB max per file
        });

        if (!fetchedFiles || fetchedFiles.length === 0) {
          return NextResponse.json(
            { error: 'No code files found in repository' },
            { status: 404 }
          );
        }

        console.log(`[File Quality API] Fetched ${fetchedFiles.length} files from GitHub`);
      } catch (error: any) {
        console.error('[File Quality API] Error fetching files from GitHub:', error);
        return NextResponse.json(
          { error: 'Failed to fetch files from GitHub', details: error.message },
          { status: 500 }
        );
      }
    }
    
    // Get repository context (from quality API or scan)
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
      console.warn('[File Quality API] Could not fetch repo context:', error);
    }
    
    // Score all files (async now, stores in Supabase)
    const fileAnalysis = await fileQualityScorer.scoreRepository(fetchedFiles, repoContext, repo);
    
    // Get quality recommendations
    let qualityRecommendations = [];
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
        qualityRecommendations = qualityData.recommendations || [];
      }
    } catch (error) {
      console.warn('[File Quality API] Could not fetch recommendations:', error);
    }
    
    // Map quality recommendations to file-level improvements
    const mappedImprovements = fileQualityScorer.mapQualityToCode(
      qualityRecommendations,
      fileAnalysis
    );
    
    return NextResponse.json({
      repo,
      summary: {
        averageFileScore: fileAnalysis.averageScore,
        fileCount: fileAnalysis.fileCount,
        qualityDistribution: fileAnalysis.qualityDistribution,
      },
      fileScores: fileAnalysis.fileScores.map(f => ({
        path: f.filePath,
        score: f.score,
        qualityLevel: f.qualityLevel,
        language: f.language,
        factors: {
          hasTests: f.factors.hasTests,
          hasDocumentation: f.factors.hasDocumentation,
          complexity: f.factors.complexity.level,
          hasErrorHandling: f.factors.hasErrorHandling,
          hasTypeSafety: f.factors.hasTypeSafety,
        },
        improvements: f.improvements,
      })),
      topImprovements: fileAnalysis.topImprovements,
      filesNeedingImprovement: fileAnalysis.filesNeedingImprovement.map(f => ({
        path: f.filePath,
        score: f.score,
        qualityLevel: f.qualityLevel,
        improvements: f.improvements,
      })),
      mappedImprovements,
      recommendations: qualityRecommendations,
    });
    
  } catch (error: any) {
    console.error('[File Quality API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze file quality', details: error.message },
      { status: 500 }
    );
  }
}

