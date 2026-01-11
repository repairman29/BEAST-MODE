import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '@/lib/supabase';

/**
 * Cursor Proxy API
 * 
 * Proxies Cursor's AI requests to BEAST MODE's custom models
 * Provides OpenAI-compatible interface for Cursor
 */

// Dynamic require for model router (server-side only, loaded at runtime)
async function loadModelRouter() {
  try {
    // Use dynamic import to prevent webpack from analyzing at build time
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
      return null;
    }
    
    // Handle both default export and named export
    return modelRouterModule.default || modelRouterModule.getModelRouter?.() || modelRouterModule;
  } catch (error) {
    console.error('[Cursor Proxy] Failed to load model router:', error);
    return null;
  }
}

/**
 * Handle OpenAI-compatible chat completions
 * This is what Cursor sends
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // OpenAI-compatible request format
    const {
      model, // e.g., "gpt-4", "custom:my-model"
      messages,
      temperature = 0.7,
      max_tokens = 4000,
      stream = false,
      // ... other OpenAI params
    } = body;

    if (!model || !messages) {
      return NextResponse.json(
        { error: 'model and messages are required' },
        { status: 400 }
      );
    }

    // Get user ID from auth
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Load model router at runtime (server-side only)
    const modelRouter = await loadModelRouter();
    if (!modelRouter) {
      return NextResponse.json(
        { error: 'Model router not available' },
        { status: 503 }
      );
    }

    // Get router instance
    const router = typeof modelRouter.getModelRouter === 'function' 
      ? modelRouter.getModelRouter() 
      : modelRouter;

    try {
      // Route request to appropriate model
      const response = await router.route(model, {
        messages,
        temperature,
        maxTokens: max_tokens,
        stream
      }, userId);

      // Return OpenAI-compatible response
      return NextResponse.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: response.model || model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: response.content || ''
            },
            finish_reason: 'stop'
          }
        ],
        usage: response.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      });
    } catch (error: any) {
      console.error('[Cursor Proxy] Model routing error:', error);
      
      // Return OpenAI-compatible error format
      return NextResponse.json(
        {
          error: {
            message: error.message || 'Model request failed',
            type: 'model_error',
            code: 'model_unavailable'
          }
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Cursor Proxy] Error:', error);
    return NextResponse.json(
      {
        error: {
          message: error.message || 'Internal server error',
          type: 'server_error',
          code: 'internal_error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Handle streaming responses (if needed)
 */
export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    status: 'ok',
    service: 'cursor-proxy',
    version: '1.0.0'
  });
}
