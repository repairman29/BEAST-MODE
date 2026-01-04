import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../../../lib/github-token';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

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
    const supabase = await getSupabaseClientOrNull();
    
    let summary = {
      totalSessions: 0,
      cliSessions: 0,
      apiCalls: 0,
      cursorSessions: 0,
      webSessions: 0,
      totalScans: 0,
      totalFixes: 0,
      totalMissions: 0,
    };

    let sessions = {
      cli: [] as any[],
      api: [] as any[],
      cursor: [] as any[],
      web: [] as any[],
    };

    let activity = {
      today: [] as any[],
      thisWeek: [] as any[],
      thisMonth: [] as any[],
    };

    if (supabase) {
      try {
        // Query ml_predictions table for session events
        let query = supabase
          .from('ml_predictions')
          .select('*')
          .eq('service_name', 'unified-analytics')
          .eq('prediction_type', 'session_event');

        // Filter by user - try to match by githubUsername or githubUserId in context
        if (githubUsername) {
          query = query.ilike('context->>githubUsername', `%${githubUsername}%`);
        } else if (githubUserId) {
          query = query.eq('context->>githubUserId', githubUserId.toString());
        } else {
          query = query.ilike('context->>githubUsername', `%${oauthUserId}%`);
        }

        const { data: predictions, error } = await query
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!error && predictions) {
          // Process predictions into sessions
          const sessionMap = new Map<string, any>();
          
          predictions.forEach((pred: any) => {
            const context = pred.context || {};
            const sessionType = context.sessionType || 'web';
            const sessionId = context.sessionId || pred.id;
            const event = context.event || 'unknown';

            // Aggregate by session type
            if (!sessionMap.has(sessionId)) {
              sessionMap.set(sessionId, {
                id: sessionId,
                type: sessionType,
                startTime: pred.created_at,
                endTime: pred.created_at,
                events: [],
                repo: context.repo || context.context?.repo,
                command: context.command || context.context?.command,
              });
            }

            const session = sessionMap.get(sessionId)!;
            session.events.push({
              event,
              timestamp: pred.created_at,
              metadata: context.metadata || {},
            });
            session.endTime = pred.created_at;

            // Update summary
            if (sessionType === 'cli') summary.cliSessions++;
            else if (sessionType === 'api') summary.apiCalls++;
            else if (sessionType === 'cursor' || sessionType === 'ide') summary.cursorSessions++;
            else summary.webSessions++;

            if (event.includes('scan')) summary.totalScans++;
            if (event.includes('fix')) summary.totalFixes++;
            if (event.includes('mission')) summary.totalMissions++;
          });

          // Group sessions by type
          sessionMap.forEach((session) => {
            if (session.type === 'cli') sessions.cli.push(session);
            else if (session.type === 'api') sessions.api.push(session);
            else if (session.type === 'cursor' || session.type === 'ide') sessions.cursor.push(session);
            else sessions.web.push(session);
          });

          summary.totalSessions = sessionMap.size;

          // Get activity by time period
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

          predictions.forEach((pred: any) => {
            const predDate = new Date(pred.created_at);
            if (predDate >= today) {
              activity.today.push({
                event: pred.context?.event,
                timestamp: pred.created_at,
                type: pred.context?.sessionType,
              });
            }
            if (predDate >= weekAgo) {
              activity.thisWeek.push({
                event: pred.context?.event,
                timestamp: pred.created_at,
                type: pred.context?.sessionType,
              });
            }
            if (predDate >= monthAgo) {
              activity.thisMonth.push({
                event: pred.context?.event,
                timestamp: pred.created_at,
                type: pred.context?.sessionType,
              });
            }
          });
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Continue with empty data
      }
    }

    // Calculate insights
    const allSessions = [...sessions.cli, ...sessions.api, ...sessions.cursor, ...sessions.web];
    const mostUsedCommand = allSessions
      .map(s => s.command)
      .filter(Boolean)
      .reduce((acc: any, cmd: string) => {
        acc[cmd] = (acc[cmd] || 0) + 1;
        return acc;
      }, {});
    const mostUsedCmd = Object.entries(mostUsedCommand).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || null;

    const repos = allSessions
      .map(s => s.repo)
      .filter(Boolean);
    const mostScannedRepo = repos.reduce((acc: any, repo: string) => {
      acc[repo] = (acc[repo] || 0) + 1;
      return acc;
    }, {});
    const mostScanned = Object.entries(mostScannedRepo).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || null;

    const analytics = {
      userId: oauthUserId,
      githubUsername,
      githubUserId,
      summary,
      sessions,
      activity,
      insights: {
        mostUsedCommand: mostUsedCmd,
        mostScannedRepo: mostScanned,
        averageQualityScore: null, // Would need quality score data
        productivityTrend: activity.thisWeek.length > activity.thisMonth.length / 4 ? 'increasing' : 'stable',
      },
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



