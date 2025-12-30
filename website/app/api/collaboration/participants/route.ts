import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Collaboration Participants API
 * 
 * Manages participants in collaboration sessions
 */

const getParticipantsStore = () => {
  if (!global.sessionParticipants) {
    global.sessionParticipants = new Map();
  }
  return global.sessionParticipants;
};

const getSessionsStore = () => {
  if (!global.collaborationSessions) {
    global.collaborationSessions = new Map();
  }
  return global.collaborationSessions;
};

/**
 * POST /api/collaboration/participants
 * Add a participant to a session
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    const participants = getParticipantsStore();
    const sessions = getSessionsStore();

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Add participant
    if (!participants.has(sessionId)) {
      participants.set(sessionId, new Set());
    }
    participants.get(sessionId)!.add(userId);

    // Update session
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      session.updatedAt = new Date().toISOString();
      sessions.set(sessionId, session);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      userId,
      participants: Array.from(participants.get(sessionId)!),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Collaboration Participants API error:', error);
    return NextResponse.json(
      { error: 'Failed to add participant', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/collaboration/participants
 * Get participants for a session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const participants = getParticipantsStore();
    const sessionParticipants = participants.get(sessionId);

    if (!sessionParticipants) {
      return NextResponse.json({
        sessionId,
        participants: [],
        count: 0
      });
    }

    return NextResponse.json({
      sessionId,
      participants: Array.from(sessionParticipants),
      count: sessionParticipants.size
    });

  } catch (error: any) {
    console.error('Collaboration Participants API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collaboration/participants
 * Remove a participant from a session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    const participants = getParticipantsStore();
    const sessions = getSessionsStore();

    const sessionParticipants = participants.get(sessionId);
    if (sessionParticipants) {
      sessionParticipants.delete(userId);
    }

    // Update session
    const session = sessions.get(sessionId);
    if (session) {
      session.participants = session.participants.filter((id: string) => id !== userId);
      session.updatedAt = new Date().toISOString();
      sessions.set(sessionId, session);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      userId,
      participants: sessionParticipants ? Array.from(sessionParticipants) : []
    });

  } catch (error: any) {
    console.error('Collaboration Participants API error:', error);
    return NextResponse.json(
      { error: 'Failed to remove participant', details: error.message },
      { status: 500 }
    );
  }
}

