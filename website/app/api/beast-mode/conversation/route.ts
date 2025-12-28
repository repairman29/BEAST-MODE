import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Conversational AI API Route
 *
 * Processes natural language commands and returns AI-powered responses
 */
export async function POST(request: NextRequest) {
  try {
    const { message, context = {} } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if BEAST MODE is available
    if (!global.beastMode || !global.beastMode.conversationalAI) {
      return NextResponse.json(
        {
          response: "❌ BEAST MODE Conversational AI not available. Please ensure BEAST MODE is properly initialized.",
          intent: 'error',
          error: true
        },
        { status: 503 }
      );
    }

    // Process the message through BEAST MODE conversational AI
    const result = await global.beastMode.processMessage(message, {
      userId: context.userId || 'anonymous',
      sessionId: context.sessionId || 'web-session',
      timestamp: new Date().toISOString(),
      ...context
    });

    return NextResponse.json({
      response: result.response,
      intent: result.intent,
      entities: result.entities,
      sentiment: result.sentiment,
      context: result.context,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json(
      {
        response: "❌ Sorry, I encountered an error processing your request. Please try again.",
        intent: 'error',
        error: true
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for conversation health check
 */
export async function GET() {
  try {
    const isAvailable = global.beastMode && global.beastMode.conversationalAI;

    return NextResponse.json({
      status: isAvailable ? 'operational' : 'unavailable',
      message: isAvailable
        ? 'BEAST MODE Conversational AI is ready'
        : 'BEAST MODE Conversational AI not initialized',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}
