import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../../../lib/github-token';

/**
 * Unified Analytics API
 * 
 * Provides comprehensive analytics view across:
 * - CLI sessions
 * - API usage
 * - Cursor/IDE sessions
 * - Web dashboard usage
 * 
 * All tied to user's GitHub account
 */

export async function GET(request: NextRequest) {
  try {
    // Get user's GitHub info
    const oauthUserId = request.cookies.get('github_oauth_user_id')?.value;
    
    if (!oauthUserId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please connect your GitHub account.' },
        { status: 401 }
      );
    }

    // Get GitHub user info
    let githubUsername: string | undefined;
    let githubUserId: number | undefined;

    try {
      const tokenData = await getDecryptedToken(oauthUserId);
      if (tokenData) {
        // Try to import github lib, but handle gracefully if not available
        try {
          const { createOctokit } = await import('../../../../../lib/github');
          const octokit = createOctokit(tokenData);
          const { data: user } = await octokit.users.getAuthenticated();
          githubUsername = user.login;
          githubUserId = user.id;
        } catch (importError) {
          console.warn('GitHub lib not available, using fallback:', importError);
          // Fallback: use oauthUserId as username
          githubUsername = oauthUserId;
        }
      }
    } catch (error) {
      console.error('Failed to get GitHub user info:', error);
      // Continue without GitHub info - not critical for analytics
    }

    // Query Supabase for unified analytics
    // This would aggregate data from:
    // - ml_predictions (session events)
    // - user_sessions (if we create that table)
    // - analytics_events (web dashboard)
    
    // For now, return structure with placeholders
    // In production, this would query the database

    const analytics = {
      userId: oauthUserId,
      githubUsername,
      githubUserId,
      summary: {
        totalSessions: 0,
        cliSessions: 0,
        apiCalls: 0,
        cursorSessions: 0,
        webSessions: 0,
        totalScans: 0,
        totalFixes: 0,
        totalMissions: 0,
      },
      sessions: {
        cli: [],
        api: [],
        cursor: [],
        web: [],
      },
      activity: {
        today: [],
        thisWeek: [],
        thisMonth: [],
      },
      insights: {
        mostUsedCommand: null,
        mostScannedRepo: null,
        averageQualityScore: null,
        productivityTrend: 'stable',
      },
      message: 'Unified analytics - database integration coming soon'
    };

    return NextResponse.json(analytics);

  } catch (error: any) {
    console.error('Unified analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error.message },
      { status: 500 }
    );
  }
}



