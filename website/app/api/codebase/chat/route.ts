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
      model, // Optional: model ID (e.g., "custom:my-model" or "openai:gpt-4")
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

    // Get user ID
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    // Smart model selection: auto-detect best model for user (zero-config!)
    let requestedModel = model || null;
    
    if (!requestedModel && userId) {
      try {
        const { getSmartModelSelector } = require('../../../../../lib/mlops/smartModelSelector');
        const selector = getSmartModelSelector();
        const selection = await selector.selectModel(userId, requestedModel);
        requestedModel = selection.modelId;
        
        // Log helpful message for user
        const message = selector.getModelMessage(selection);
        console.log(`[Codebase Chat] ${message.message} - ${message.submessage}`);
      } catch (error) {
        // Fallback to default if auto-selection fails (non-critical)
        console.warn('[Codebase Chat] Auto-selection failed, using default:', error.message);
        requestedModel = requestedModel || 'openai:gpt-3.5-turbo';
      }
    } else {
      requestedModel = requestedModel || 'openai:gpt-3.5-turbo';
    }

    // If custom model is specified, use model router
    if (requestedModel && requestedModel.startsWith('custom:')) {
      try {
        const { getModelRouter } = require('../../../../../lib/mlops/modelRouter');
        const modelRouter = getModelRouter();
        
        // Get conversation history for context
        const history = codebaseChat.getHistory(sessionId) || [];
        const messages = [
          ...history.map((h: any) => ({
            role: h.role || 'user',
            content: h.message || h.content
          })),
          { role: 'user', content: message }
        ];

        // Route to custom model
        const modelResponse = await modelRouter.route(requestedModel, {
          messages,
          temperature: 0.7,
          maxTokens: 4000
        }, userId || '');

        // Save to conversation history
        codebaseChat.addToHistory(sessionId, {
          role: 'user',
          message
        });
        codebaseChat.addToHistory(sessionId, {
          role: 'assistant',
          message: modelResponse.content
        });

        return NextResponse.json({
          success: true,
          message: modelResponse.content,
          model: modelResponse.model || model,
          usage: modelResponse.usage,
          context: { repo, files, currentFile }
        });
      } catch (error: any) {
        console.error('[Chat API] Custom model error:', error);
        return NextResponse.json(
          { error: 'Failed to use custom model', details: error.message },
          { status: 500 }
        );
      }
    }

    // Get user's API key if using LLM (provider models)
    let userApiKey = null;
    if (useLLM) {
      try {
        if (userId) {
          const { getSupabaseClientOrNull } = require('../../../lib/supabase');
          const supabase = await getSupabaseClientOrNull();
          if (supabase) {
            // Determine provider from model
            const provider = model?.startsWith('anthropic:') ? 'anthropic' : 'openai';
            const { data } = await supabase
              .from('user_api_keys')
              .select('decrypted_key')
              .eq('user_id', userId)
              .eq('provider', provider)
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

    // Process chat message (existing flow)
    const response = await codebaseChat.processMessage(
      sessionId,
      message,
      {
        repo,
        files,
        currentFile,
        userApiKey,
        useLLM: useLLM && !!userApiKey,
        model, // Pass model to codebaseChat if it supports it
        customModelId: model?.startsWith('custom:') ? model : null,
        userId: userId || '',
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

