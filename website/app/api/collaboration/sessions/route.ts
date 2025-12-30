import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Real-Time Collaboration API
 * 
 * Manages live code review sessions and team workspaces
 */

// In-memory storage (would be database + Redis in production)
declare global {
  var collaborationSessions: Map<string, any> | undefined;
  var sessionParticipants: Map<string, Set<string>> | undefined;
}

const getSessionsStore = () => {
  if (!global.collaborationSessions) {
    global.collaborationSessions = new Map();
  }
  return global.collaborationSessions;
};

const getParticipantsStore = () => {
  if (!global.sessionParticipants) {
    global.sessionParticipants = new Map();
  }
  return global.sessionParticipants;
};

/**
 * POST /api/collaboration/sessions
 * Create a new collaboration session
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, repoUrl, sessionType = 'code-review', title } = await request.json();

    if (!userId || !repoUrl) {
      return NextResponse.json(
        { error: 'User ID and repository URL are required' },
        { status: 400 }
      );
    }

    const sessions = getSessionsStore();
    const participants = getParticipantsStore();

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      userId,
      repoUrl,
      sessionType, // 'code-review', 'workspace', 'pair-programming'
      title: title || `${sessionType} - ${repoUrl}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      participants: [userId],
      annotations: [],
      cursorPositions: {},
      sharedFiles: []
    };

    sessions.set(sessionId, session);
    participants.set(sessionId, new Set([userId]));

    return NextResponse.json({
      success: true,
      session,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Collaboration Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/collaboration/sessions
 * Get collaboration sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    const sessions = getSessionsStore();

    if (sessionId) {
      // Get specific session
      const session = sessions.get(sessionId);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    if (userId) {
      // Get user's sessions
      const userSessions = Array.from(sessions.values()).filter(
        (s: any) => s.participants.includes(userId) || s.userId === userId
      );
      return NextResponse.json({
        sessions: userSessions,
        count: userSessions.length
      });
    }

    // Get all active sessions
    const allSessions = Array.from(sessions.values()).filter(
      (s: any) => s.status === 'active'
    );
    return NextResponse.json({
      sessions: allSessions,
      count: allSessions.length
    });

  } catch (error: any) {
    console.error('Collaboration Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/collaboration/sessions
 * Update a collaboration session
 */
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, updates } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const sessions = getSessionsStore();
    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    sessions.set(sessionId, updatedSession);

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error: any) {
    console.error('Collaboration Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to update session', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collaboration/sessions
 * End a collaboration session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const sessions = getSessionsStore();
    const participants = getParticipantsStore();

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Mark as ended instead of deleting (for history)
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    sessions.set(sessionId, session);
    participants.delete(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session ended'
    });

  } catch (error: any) {
    console.error('Collaboration Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to end session', details: error.message },
      { status: 500 }
    );
  }
}

