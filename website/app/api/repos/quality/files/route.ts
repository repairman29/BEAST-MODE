import { NextRequest, NextResponse } from 'next/server';
import { fileQualityScorer } from '../../../../../lib/mlops/fileQualityScorer';

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
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Files array is required with file paths and content' },
        { status: 400 }
      );
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
    
    // Score all files
    const fileAnalysis = fileQualityScorer.scoreRepository(files, repoContext);
    
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

