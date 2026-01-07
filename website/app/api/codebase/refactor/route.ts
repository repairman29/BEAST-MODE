import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules
let automatedRefactoring: any;
try {
  automatedRefactoring = require('../../../../../lib/mlops/automatedRefactoring');
} catch (error) {
  console.error('[Refactoring API] Failed to load modules:', error);
}

/**
 * Automated Refactoring API
 * 
 * Analyzes and applies refactorings to improve code quality.
 * Unique differentiator - competitors don't have this.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      filePath,
      fileContent,
      opportunity,
      files,
      useLLM = false,
    } = body;

    if (!automatedRefactoring) {
      return NextResponse.json(
        { error: 'Automated refactoring not available' },
        { status: 500 }
      );
    }

    // Get user's API key if using LLM
    let userApiKey = null;
    if (useLLM) {
      try {
        const userId = request.cookies.get('github_oauth_user_id')?.value;
        if (userId) {
          const { getSupabaseClientOrNull } = require('../../../../lib/supabase');
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
        console.warn('[Refactoring API] Could not get user API key:', error);
      }
    }

    switch (action) {
      case 'analyze':
        if (!filePath || !fileContent) {
          return NextResponse.json(
            { error: 'File path and content are required' },
            { status: 400 }
          );
        }
        const analysis = await automatedRefactoring.analyzeRefactoring(
          filePath,
          fileContent,
          body.options || {}
        );
        return NextResponse.json({ success: true, ...analysis });

      case 'apply':
        if (!filePath || !fileContent || !opportunity) {
          return NextResponse.json(
            { error: 'File path, content, and opportunity are required' },
            { status: 400 }
          );
        }
        const result = await automatedRefactoring.applyRefactoring(
          filePath,
          fileContent,
          opportunity,
          {
            useLLM: useLLM && !!userApiKey,
            userApiKey,
          }
        );
        return NextResponse.json({ success: true, ...result });

      case 'batch':
        if (!files || !Array.isArray(files)) {
          return NextResponse.json(
            { error: 'Files array is required' },
            { status: 400 }
          );
        }
        const batchResult = await automatedRefactoring.batchRefactor(
          files,
          {
            useLLM: useLLM && !!userApiKey,
            userApiKey,
            ...body.options,
          }
        );
        return NextResponse.json({ success: true, ...batchResult });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze, apply, or batch' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[Refactoring API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process refactoring request', details: error.message },
      { status: 500 }
    );
  }
}

