import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules
let multiFileEditor: any;
try {
  multiFileEditor = require('../../../../lib/mlops/multiFileEditor');
} catch (error) {
  console.error('[Multi-File Editor API] Failed to load modules:', error);
}

/**
 * Multi-File Editor API
 * 
 * Handles editing multiple files simultaneously with dependency tracking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, files, filePath, newContent, options } = body;

    if (!multiFileEditor) {
      return NextResponse.json(
        { error: 'Multi-file editor not available' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'start':
        if (!files || !Array.isArray(files)) {
          return NextResponse.json(
            { error: 'Files array is required' },
            { status: 400 }
          );
        }
        const session = await multiFileEditor.startSession(
          sessionId || `session-${Date.now()}`,
          files,
          options || {}
        );
        return NextResponse.json({ success: true, ...session });

      case 'update':
        if (!sessionId || !filePath || !newContent) {
          return NextResponse.json(
            { error: 'Session ID, file path, and new content are required' },
            { status: 400 }
          );
        }
        const updateResult = multiFileEditor.updateFile(sessionId, filePath, newContent);
        return NextResponse.json({ success: true, ...updateResult });

      case 'apply':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
          );
        }
        const applyResult = await multiFileEditor.applyChanges(sessionId, options || {});
        return NextResponse.json({ success: true, ...applyResult });

      case 'status':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
          );
        }
        const status = multiFileEditor.getSessionStatus(sessionId);
        if (!status) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, ...status });

      case 'cancel':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
          );
        }
        const cancelResult = multiFileEditor.cancelSession(sessionId);
        return NextResponse.json({ success: true, ...cancelResult });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, update, apply, status, or cancel' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[Multi-File Editor API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}

