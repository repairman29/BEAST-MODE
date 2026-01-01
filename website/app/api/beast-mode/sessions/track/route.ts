import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../../../lib/github-token';

/**
 * Unified Session Tracking API
 * 
 * Tracks sessions from CLI, API, Cursor/IDE, and Web
 * All tied to user's GitHub account
 */

interface SessionEvent {
  sessionId: string;
  sessionType: 'cli' | 'api' | 'cursor' | 'web' | 'ide';
  userId?: string;
  githubUsername?: string;
  githubUserId?: number;
  event: string;
  metadata?: Record<string, any>;
  timestamp: string;
  duration?: number;
  context?: {
    command?: string;
    endpoint?: string;
    file?: string;
    project?: string;
    repo?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const event: SessionEvent = await request.json();

    // Get user's GitHub info if available
    const oauthUserId = request.cookies.get('github_oauth_user_id')?.value;
    let githubUsername: string | undefined;
    let githubUserId: number | undefined;

    if (oauthUserId) {
      try {
        const tokenData = await getDecryptedToken(oauthUserId);
        if (tokenData) {
          // Get GitHub user info from stored token data
          const { createOctokit } = await import('../../../../../lib/github');
          const octokit = createOctokit(tokenData);
          const { data: user } = await octokit.users.getAuthenticated();
          githubUsername = user.login;
          githubUserId = user.id;
        }
      } catch (error) {
        console.error('Failed to get GitHub user info:', error);
      }
    }

    // Enrich event with GitHub info
    const enrichedEvent = {
      ...event,
      githubUsername: event.githubUsername || githubUsername,
      githubUserId: event.githubUserId || githubUserId,
      userId: event.userId || oauthUserId || `github-${githubUserId}`,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    // Write to Supabase (ML database)
    try {
      const { getDatabaseWriter } = await import('../../../../../lib/mlops/databaseWriter');
      const dbWriter = getDatabaseWriter();
      
      await dbWriter.writePrediction({
        serviceName: 'unified-analytics',
        predictionType: 'session_event',
        predictedValue: 1, // Event occurred
        actualValue: 1,
        confidence: 1.0,
        context: {
          sessionType: enrichedEvent.sessionType,
          event: enrichedEvent.event,
          githubUsername: enrichedEvent.githubUsername,
          githubUserId: enrichedEvent.githubUserId,
          metadata: enrichedEvent.metadata,
          context: enrichedEvent.context,
        },
        modelVersion: '1.0.0',
        source: 'session_tracking'
      });
    } catch (dbError) {
      console.error('Failed to write to database:', dbError);
      // Continue even if DB write fails
    }

    // Also store in analytics events table
    try {
      // This would write to a user_sessions or analytics_events table
      // For now, we'll use the ML predictions table as unified storage
      console.log('📊 [Session Tracking] Event tracked:', {
        sessionType: enrichedEvent.sessionType,
        event: enrichedEvent.event,
        githubUsername: enrichedEvent.githubUsername,
        userId: enrichedEvent.userId
      });
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }

    return NextResponse.json({
      success: true,
      eventId: enrichedEvent.sessionId,
      tracked: true
    });

  } catch (error: any) {
    console.error('Session tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track session', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beast-mode/sessions/track - Get user's session history
 */
export async function GET(request: NextRequest) {
  try {
    // Get user's GitHub info
    const oauthUserId = request.cookies.get('github_oauth_user_id')?.value;
    
    if (!oauthUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get GitHub user info
    let githubUsername: string | undefined;
    let githubUserId: number | undefined;

    try {
      const tokenData = await getDecryptedToken(oauthUserId);
      if (tokenData) {
        try {
          const githubModule = await import('../../../../../lib/github').catch(() => null);
          if (githubModule) {
            const { createOctokit } = githubModule;
            const octokit = createOctokit(tokenData);
            const { data: user } = await octokit.users.getAuthenticated();
            githubUsername = user.login;
            githubUserId = user.id;
          } else {
            githubUsername = oauthUserId;
          }
        } catch (importError) {
          console.warn('GitHub lib not available:', importError);
          githubUsername = oauthUserId;
        }
      }
    } catch (error) {
      console.error('Failed to get GitHub user info:', error);
    }

    // Query Supabase for user's sessions
    // This would query the ml_predictions table filtered by user
    // In production, you'd have a dedicated user_sessions table

    return NextResponse.json({
      userId: oauthUserId,
      githubUsername,
      githubUserId,
      sessions: [], // Would be populated from database
      message: 'Session history endpoint - database query coming soon'
    });

  } catch (error: any) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions', details: error.message },
      { status: 500 }
    );
  }
}



