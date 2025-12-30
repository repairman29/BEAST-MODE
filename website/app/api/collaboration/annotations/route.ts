import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Collaboration Annotations API
 * 
 * Manages annotations (comments, suggestions) in code review sessions
 */

declare global {
  var sessionAnnotations: Map<string, any[]> | undefined;
}

const getAnnotationsStore = () => {
  if (!global.sessionAnnotations) {
    global.sessionAnnotations = new Map();
  }
  return global.sessionAnnotations;
};

/**
 * POST /api/collaboration/annotations
 * Add an annotation to a session
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, filePath, lineNumber, content, type = 'comment' } = await request.json();

    if (!sessionId || !userId || !filePath || !content) {
      return NextResponse.json(
        { error: 'Session ID, User ID, file path, and content are required' },
        { status: 400 }
      );
    }

    const annotations = getAnnotationsStore();

    if (!annotations.has(sessionId)) {
      annotations.set(sessionId, []);
    }

    const annotation = {
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      userId,
      filePath,
      lineNumber: lineNumber || null,
      content,
      type, // 'comment', 'suggestion', 'question', 'approval', 'rejection'
      createdAt: new Date().toISOString(),
      replies: [],
      resolved: false
    };

    annotations.get(sessionId)!.push(annotation);

    return NextResponse.json({
      success: true,
      annotation,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Collaboration Annotations API error:', error);
    return NextResponse.json(
      { error: 'Failed to add annotation', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/collaboration/annotations
 * Get annotations for a session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const filePath = searchParams.get('filePath');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const annotations = getAnnotationsStore();
    let sessionAnnotations = annotations.get(sessionId) || [];

    // Filter by file path if provided
    if (filePath) {
      sessionAnnotations = sessionAnnotations.filter(
        (a: any) => a.filePath === filePath
      );
    }

    return NextResponse.json({
      sessionId,
      annotations: sessionAnnotations,
      count: sessionAnnotations.length
    });

  } catch (error: any) {
    console.error('Collaboration Annotations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/collaboration/annotations
 * Update an annotation (resolve, reply, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, annotationId, updates } = await request.json();

    if (!sessionId || !annotationId) {
      return NextResponse.json(
        { error: 'Session ID and Annotation ID are required' },
        { status: 400 }
      );
    }

    const annotations = getAnnotationsStore();
    const sessionAnnotations = annotations.get(sessionId) || [];

    const annotationIndex = sessionAnnotations.findIndex(
      (a: any) => a.id === annotationId
    );

    if (annotationIndex === -1) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    const updatedAnnotation = {
      ...sessionAnnotations[annotationIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    sessionAnnotations[annotationIndex] = updatedAnnotation;
    annotations.set(sessionId, sessionAnnotations);

    return NextResponse.json({
      success: true,
      annotation: updatedAnnotation
    });

  } catch (error: any) {
    console.error('Collaboration Annotations API error:', error);
    return NextResponse.json(
      { error: 'Failed to update annotation', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collaboration/annotations
 * Delete an annotation
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const annotationId = searchParams.get('annotationId');

    if (!sessionId || !annotationId) {
      return NextResponse.json(
        { error: 'Session ID and Annotation ID are required' },
        { status: 400 }
      );
    }

    const annotations = getAnnotationsStore();
    const sessionAnnotations = annotations.get(sessionId) || [];

    const filtered = sessionAnnotations.filter(
      (a: any) => a.id !== annotationId
    );

    annotations.set(sessionId, filtered);

    return NextResponse.json({
      success: true,
      message: 'Annotation deleted'
    });

  } catch (error: any) {
    console.error('Collaboration Annotations API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation', details: error.message },
      { status: 500 }
    );
  }
}

