import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '@/lib/github-token';
import path from 'path';

// Dynamic require for Node.js modules (server-side only)
// Use dynamic import to prevent webpack from analyzing at build time
let codebaseChat: any;
async function loadCodebaseChat() {
  if (codebaseChat) return codebaseChat;
  
  try {
    // Use dynamic require to prevent webpack from parsing at build time
    // This is a server-side only module
    const codebaseChatModule = await import('@/lib/mlops/codebaseChat').catch(() => {
      // Fallback to require if import fails (CommonJS)
      try {
        return require('@/lib/mlops/codebaseChat');
      } catch (e) {
        return null;
      }
    });
    
    if (!codebaseChatModule) {
      throw new Error('Failed to load codebaseChat module');
    }
    
    // Handle both singleton instance and class export
    codebaseChat = codebaseChatModule.default || codebaseChatModule;
    // If it's a class, we might need to instantiate it, but check if it has processMessage first
    if (codebaseChat && typeof codebaseChat.processMessage !== 'function') {
      // Try to get the instance if it's exported
      codebaseChat = codebaseChatModule.getCodebaseChat?.() || codebaseChat;
    }
    
    return codebaseChat;
  } catch (error) {
    console.error('[Chat API] Failed to load modules:', error);
    return null;
  }
}

/**
 * Codebase Chat API
 * 
 * Conversational interface for code generation and assistance.
 * Similar to Cursor's chat feature.
 */
export async function POST(request: NextRequest) {
  try {
    // Load codebaseChat module (server-side only, loaded at runtime)
    const chatModule = await loadCodebaseChat();
    if (!chatModule) {
      return NextResponse.json(
        { error: 'Codebase chat service unavailable', success: false },
        { status: 503 }
      );
    }
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', success: false },
        { status: 400 }
      );
    }
    
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
        { error: 'Session ID and message are required', success: false },
        { status: 400 }
      );
    }

    // Get user ID
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    // Smart model selection: auto-detect best model for user (zero-config!)
    let requestedModel = model || null;
    
    if (!requestedModel && userId) {
      try {
        // Try to load smart model selector, but don't fail if it's not available
        // Use website/lib/mlops path (copied from root lib/mlops)
        const smartModelSelectorModule = await import('@/lib/mlops/smartModelSelector').catch(() => {
          try {
            return require('@/lib/mlops/smartModelSelector');
          } catch (e) {
            // Fallback to relative path
            try {
              return require('../../lib/mlops/smartModelSelector');
            } catch (e2) {
              return null;
            }
          }
        });
        
        if (smartModelSelectorModule) {
          const { getSmartModelSelector } = smartModelSelectorModule;
          const selector = getSmartModelSelector();
          const selection = await selector.selectModel(userId, requestedModel);
          requestedModel = selection.modelId;
          
          // Log helpful message for user
          const message = selector.getModelMessage(selection);
          console.log(`[Codebase Chat] ${message.message} - ${message.submessage}`);
        } else {
          // Fallback to default if smart selector not available
          requestedModel = 'openai:gpt-3.5-turbo';
        }
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
        // Load model router at runtime (server-side only)
        // Use @/ alias for website/lib/mlops (copied from root lib/mlops)
        const modelRouterModule = await import('@/lib/mlops/modelRouter').catch(() => {
          // Fallback to require if import fails (CommonJS)
          try {
            return require('@/lib/mlops/modelRouter');
          } catch (e) {
            // Fallback to relative path
            try {
              return require('../../lib/mlops/modelRouter');
            } catch (e2) {
              return null;
            }
          }
        });
        
        if (!modelRouterModule) {
          throw new Error('Model router not available');
        }
        
        const getModelRouter = modelRouterModule.getModelRouter || modelRouterModule.default?.getModelRouter;
        const modelRouter = getModelRouter ? getModelRouter() : modelRouterModule;
        
        // Get conversation history for context
        const history = await chatModule.getHistory(sessionId) || [];
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
        chatModule.addToHistory(sessionId, {
          role: 'user',
          message
        });
        chatModule.addToHistory(sessionId, {
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
        // If custom model fails, fall back to regular chat processing
        // Don't return error - let it fall through to regular processing
        if (error.message?.includes('not found') || error.message?.includes('authentication')) {
          // Custom model not available - fall through to regular processing
          requestedModel = null;
        } else {
          // Other errors - fall back to regular processing instead of failing
          console.warn('[Chat API] Custom model error, falling back to regular processing:', error.message);
          requestedModel = null; // Fall through to regular processing
        }
      }
    }

    // Determine if this is a custom model
    const isCustomModel = model?.startsWith('custom:');
    const customModelId = isCustomModel ? model : null;

    // Get user's API key if using LLM (provider models)
    let userApiKey = null;
    if (useLLM || model) {
      try {
        if (userId && !isCustomModel) {
          // Use the proper decryption library
          const { getUserApiKey } = require('../../../lib/api-keys-decrypt');
          
          // Determine provider from model
          const provider = model?.startsWith('anthropic:') ? 'anthropic' : 'openai';
          
          // Get and decrypt API key (only for provider models, not custom)
          userApiKey = await getUserApiKey(userId, provider);
          console.log(`[Chat API] Retrieved API key for ${provider}:`, userApiKey ? 'Found' : 'Not found');
        }
      } catch (error) {
        console.warn('[Chat API] Could not get user API key:', error);
      }
    }

          // Process chat message (existing flow)
          const response = await chatModule.processMessage(
            sessionId,
      message,
      {
        repo,
        files,
        currentFile,
        userApiKey,
        useLLM: useLLM || !!userApiKey || !!customModelId || (model && model.startsWith('custom:')) || !!model,
        model, // Pass model to codebaseChat if it supports it
        customModelId,
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
    // Return more detailed error for debugging, but still return JSON
    const errorMessage = error?.message || 'Unknown error';
    const errorStack = process.env.NODE_ENV === 'development' ? error?.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message', 
        details: errorMessage,
        success: false,
        ...(errorStack && { stack: errorStack })
      },
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

    const chatModule = await loadCodebaseChat();
    if (!chatModule) {
      return NextResponse.json(
        { error: 'Codebase chat service unavailable' },
        { status: 503 }
      );
    }

    const history = await chatModule.getHistory(sessionId);

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

    const chatModule = await loadCodebaseChat();
    if (!chatModule) {
      return NextResponse.json(
        { error: 'Codebase chat service unavailable' },
        { status: 503 }
      );
    }

    await chatModule.clearHistory(sessionId);

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

