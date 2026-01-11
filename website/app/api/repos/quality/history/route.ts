import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules
let qualitySupabase: any;
try {
  qualitySupabase = require('@/lib/mlops/qualitySupabaseIntegration');
} catch (error) {
  console.error('[Quality History API] Failed to load module:', error);
}

/**
 * Quality Improvement History API
 * 
 * Retrieves quality improvement history, trends, and snapshots from Supabase.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const type = searchParams.get('type'); // 'history', 'snapshots', 'trends', 'plans'
    const days = parseInt(searchParams.get('days') || '30');
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }
    
    if (!qualitySupabase) {
      return NextResponse.json(
        { error: 'Quality Supabase integration not available' },
        { status: 500 }
      );
    }
    
    await qualitySupabase.initialize();
    
    let data;
    
    switch (type) {
      case 'history':
        data = await qualitySupabase.getImprovementHistory(repo, 50);
        break;
      
      case 'snapshots':
        data = await qualitySupabase.getQualitySnapshots(repo, 30);
        break;
      
      case 'trends':
        data = await qualitySupabase.getQualityTrends(repo, days);
        break;
      
      case 'plans':
        data = await qualitySupabase.getImprovementPlans(repo, 10);
        break;
      
      case 'files':
        data = await qualitySupabase.getFileQualityScores(repo, 100);
        break;
      
      case 'generated':
        const status = searchParams.get('status');
        data = await qualitySupabase.getGeneratedCodeFiles(repo, status, 50);
        break;
      
      default:
        // Return all data
        const [history, snapshots, trends, plans, files, generated] = await Promise.all([
          qualitySupabase.getImprovementHistory(repo, 50),
          qualitySupabase.getQualitySnapshots(repo, 30),
          qualitySupabase.getQualityTrends(repo, days),
          qualitySupabase.getImprovementPlans(repo, 10),
          qualitySupabase.getFileQualityScores(repo, 100),
          qualitySupabase.getGeneratedCodeFiles(repo, null, 50),
        ]);
        
        data = {
          history,
          snapshots,
          trends,
          plans,
          files,
          generated,
        };
    }
    
    return NextResponse.json({
      repo,
      type: type || 'all',
      data,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('[Quality History API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality history', details: error.message },
      { status: 500 }
    );
  }
}

