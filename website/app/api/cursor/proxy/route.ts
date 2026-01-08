import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '@/lib/supabase';

/**
 * Cursor Proxy API
 * 
 * Proxies Cursor's AI requests to BEAST MODE's custom models
 * Provides OpenAI-compatible interface for Cursor
 */

// Dynamic require for model router
let modelRouter: any;
try {
  modelRouter = require('../../../../../lib/mlops/modelRouter');
} catch (error) {
  console.error('[Cursor Proxy] Failed to load model router:', error);
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

    // If model router not available, return error
    if (!modelRouter) {
      return NextResponse.json(
        { error: 'Model router not available' },
        { status: 500 }
      );
    }

    const router = modelRouter.getModelRouter();

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
