import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules
let qualityToCodeMapper: any;
let codeGenerator: any;
try {
  qualityToCodeMapper = require('../../../../../lib/mlops/qualityToCodeMapper');
  codeGenerator = require('../../../../../lib/mlops/codeGenerator');
} catch (error) {
  console.error('[Code Generation API] Failed to load modules:', error);
}

/**
 * Quality-Driven Code Generation API
 * 
 * Generates code (tests, CI/CD, docs) based on quality recommendations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, recommendation, files } = body;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }
    
    if (!recommendation) {
      return NextResponse.json(
        { error: 'Quality recommendation is required' },
        { status: 400 }
      );
    }
    
    if (!qualityToCodeMapper || !codeGenerator) {
      return NextResponse.json(
        { error: 'Code generation services not available' },
        { status: 500 }
      );
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
          repo,
          language: qualityData.factors?.language?.value || 'Unknown',
          hasTests: qualityData.factors?.hasTests?.value > 0,
          hasCI: qualityData.factors?.hasCI?.value > 0,
          quality: qualityData.quality,
        };
      }
    } catch (error) {
      console.warn('[Code Generation API] Could not fetch repo context:', error);
    }
    
    // Map recommendation to file actions
    const fileActions = qualityToCodeMapper.mapRecommendationToFiles(
      recommendation,
      files || [],
      repoContext
    );
    
    // Generate code for each action
    const generatedFiles = codeGenerator.generateFromMappings(fileActions);
    
    return NextResponse.json({
      repo,
      recommendation: recommendation.action,
      fileActions,
      generatedFiles,
      summary: {
        totalActions: fileActions.length,
        totalGenerated: generatedFiles.length,
        estimatedQualityImprovement: fileActions.reduce((sum, a) => sum + (a.estimatedImpact || 0), 0),
      },
    });
    
  } catch (error: any) {
    console.error('[Code Generation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code', details: error.message },
      { status: 500 }
    );
  }
}

