import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '@/lib/github-token';

// Dynamic require for Node.js modules
let codebaseChat: any;
try {
  // Path: website/app/api/codebase/chat -> BEAST-MODE-PRODUCT/lib/mlops
  codebaseChat = require('../../../../../lib/mlops/codebaseChat');
} catch (error) {
  console.error('[Chat API] Failed to load modules:', error);
}

/**
 * Codebase Chat API
 * 
 * Conversational interface for code generation and assistance.
 * Similar to Cursor's chat feature.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      message,
      repo,
      files = [],
      currentFile = null,
      useLLM = false,
    } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    if (!codebaseChat) {
      return NextResponse.json(
        { error: 'Codebase chat not available' },
        { status: 500 }
      );
    }

    // Get user's API key if using LLM
    let userApiKey = null;
    if (useLLM) {
      try {
        const userId = request.cookies.get('github_oauth_user_id')?.value;
        if (userId) {
          const { getSupabaseClientOrNull } = require('../../../lib/supabase');
          const supabase = await getSupabaseClientOrNull();
          if (supabase) {
            const { data } = await supabase
              .from('user_api_keys')
              .select('decrypted_key')
              .eq('user_id', userId)
              .eq('provider', 'openai')
              .single();
            
            if (data?.decrypted_key) {
              userApiKey = data.decrypted_key;
            }
          }
        }
      } catch (error) {
        console.warn('[Chat API] Could not get user API key:', error);
      }
    }

    // Process chat message
    const response = await codebaseChat.processMessage(
      sessionId,
      message,
      {
        repo,
        files,
        currentFile,
        userApiKey,
        useLLM: useLLM && !!userApiKey,
      }
    );

    return NextResponse.json({
      success: response.success,
      message: response.message,
      code: response.code,
      files: response.files || [],
      suggestions: response.suggestions || [],
      context: response.context,
      error: response.error,
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!codebaseChat) {
      return NextResponse.json(
        { error: 'Codebase chat not available' },
        { status: 500 }
      );
    }

    const history = codebaseChat.getHistory(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      history,
      count: history.length,
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation history', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Clear conversation history
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!codebaseChat) {
      return NextResponse.json(
        { error: 'Codebase chat not available' },
        { status: 500 }
      );
    }

    codebaseChat.clearHistory(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared',
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversation history', details: error.message },
      { status: 500 }
    );
  }
}

