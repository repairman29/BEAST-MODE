import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../../lib/github-token';

/**
 * Cursor/IDE Session Tracking API
 * 
 * Tracks Cursor IDE sessions and activity
 * Can be called from Cursor extension or webhook
 */

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    // Get user's GitHub info if available
    const oauthUserId = request.cookies.get('github_oauth_user_id')?.value;
    let githubUsername: string | undefined;
    let githubUserId: number | undefined;

    if (oauthUserId) {
      try {
        const tokenData = await getDecryptedToken(oauthUserId);
        if (tokenData) {
      try {
        const { createOctokit } = await import('../../../../lib/github');
        const octokit = createOctokit(tokenData);
        const { data: user } = await octokit.users.getAuthenticated();
        githubUsername = user.login;
        githubUserId = user.id;
      } catch (importError) {
        console.warn('GitHub lib not available:', importError);
        githubUsername = oauthUserId;
      }
        }
      } catch (error) {
        console.error('Failed to get GitHub user info:', error);
      }
    }

    // Enrich session data
    const enriched = {
      sessionId: sessionData.sessionId || `cursor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionType: 'cursor' as const,
      event: sessionData.event || 'cursor_session',
      githubUsername: sessionData.githubUsername || githubUsername,
      githubUserId: sessionData.githubUserId || githubUserId,
      userId: sessionData.userId || oauthUserId || `github-${githubUserId}`,
      metadata: {
        ...sessionData.metadata,
        ide: 'cursor',
        version: sessionData.version,
        project: sessionData.project,
        files: sessionData.files,
      },
      context: {
        file: sessionData.file,
        project: sessionData.project,
        repo: sessionData.repo,
      },
      timestamp: sessionData.timestamp || new Date().toISOString(),
    };

    // Write to unified analytics
    try {
      // Try to import databaseWriter, but handle gracefully if not available
      try {
        const { getDatabaseWriter } = await import('../../../../lib/mlops/databaseWriter');
        const dbWriter = getDatabaseWriter();
        
        await dbWriter.writePrediction({
        serviceName: 'unified-analytics',
        predictionType: 'session_event',
        predictedValue: 1,
        actualValue: 1,
        confidence: 1.0,
        context: {
          sessionType: 'cursor',
          event: enriched.event,
          githubUsername: enriched.githubUsername,
          githubUserId: enriched.githubUserId,
          metadata: enriched.metadata,
        },
        modelVersion: '1.0.0',
        source: 'cursor_tracking'
      });
    } catch (dbError) {
      console.error('Failed to write Cursor session:', dbError);
    }

    return NextResponse.json({
      success: true,
      sessionId: enriched.sessionId,
      tracked: true
    });

  } catch (error: any) {
    console.error('Cursor session tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track Cursor session', details: error.message },
      { status: 500 }
    );
  }
}



