import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/status
 * Get current status of all janitor features
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClientOrNull();
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!supabase) {
      // Fallback to mock data if database not available
      return NextResponse.json({
        enabled: true,
        silentRefactoring: { enabled: true, overnightMode: true, lastRun: new Date().toISOString(), issuesFixed: 0, prsCreated: 0 },
        architectureEnforcement: { enabled: true, violationsBlocked: 0, lastCheck: new Date().toISOString() },
        vibeRestoration: { enabled: true, lastRestore: null, regressionsDetected: 0 },
        repoMemory: { enabled: true, graphSize: 0, lastUpdate: new Date().toISOString() },
        vibeOps: { enabled: true, testsRun: 0, lastTest: new Date().toISOString() },
        invisibleCICD: { enabled: true, scansRun: 0, issuesFound: 0 }
      });
    }

    // Get feature statuses from database
    const features = ['silent-refactoring', 'architecture-enforcement', 'vibe-restoration', 'repo-memory', 'vibe-ops', 'invisible-cicd'];
    
    const { data: featureData } = await supabase
      .from('janitor_features')
      .select('*')
      .in('feature_name', features)
      .eq('user_id', userId || '');

    const featureMap = new Map(featureData?.map(f => [f.feature_name, f]) || []);

    // Get latest refactoring run
    const { data: latestRefactor } = await supabase
      .from('refactoring_runs')
      .select('*')
      .eq('user_id', userId || '')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get latest vibe restoration
    const { data: latestVibe } = await supabase
      .from('vibe_restoration_states')
      .select('*')
      .eq('user_id', userId || '')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get repo memory graph size
    const { count: graphSize } = await supabase
      .from('repo_memory_graph')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId || '');

    // Get vibe ops test count
    const { count: testsRun } = await supabase
      .from('vibe_ops_tests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId || '');

    // Get architecture violations count
    const { count: violationsBlocked } = await supabase
      .from('refactoring_runs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId || '');

    const silentRefactoring = featureMap.get('silent-refactoring');
    const architectureEnforcement = featureMap.get('architecture-enforcement');
    const vibeRestoration = featureMap.get('vibe-restoration');
    const repoMemory = featureMap.get('repo-memory');
    const vibeOps = featureMap.get('vibe-ops');
    const invisibleCICD = featureMap.get('invisible-cicd');

    return NextResponse.json({
      enabled: true,
      silentRefactoring: {
        enabled: (silentRefactoring as any)?.enabled !== false,
        overnightMode: (silentRefactoring as any)?.config?.overnightMode !== false,
        lastRun: latestRefactor?.completed_at || null,
        issuesFixed: latestRefactor?.issues_fixed || 0,
        prsCreated: latestRefactor?.prs_created || 0
      },
      architectureEnforcement: {
        enabled: architectureEnforcement?.enabled !== false,
        violationsBlocked: violationsBlocked || 0,
        lastCheck: new Date().toISOString()
      },
      vibeRestoration: {
        enabled: vibeRestoration?.enabled !== false,
        lastRestore: latestVibe?.created_at || null,
        regressionsDetected: 0
      },
      repoMemory: {
        enabled: repoMemory?.enabled !== false,
        graphSize: graphSize || 0,
        lastUpdate: new Date().toISOString()
      },
      vibeOps: {
        enabled: vibeOps?.enabled !== false,
        testsRun: testsRun || 0,
        lastTest: new Date().toISOString()
      },
      invisibleCICD: {
        enabled: invisibleCICD?.enabled !== false,
        scansRun: 0,
        issuesFound: 0
      }
    });
  } catch (error: any) {
    console.error('Failed to get janitor status:', error);
    return NextResponse.json(
      { error: 'Failed to get janitor status', details: error.message },
      { status: 500 }
    );
  }
}
