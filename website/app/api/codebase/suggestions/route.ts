import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '@/lib/github-token';

// Dynamic require for Node.js modules
let realtimeSuggestions: any;
let codebaseIndexer: any;
try {
  // Path: website/app/api/codebase/suggestions -> BEAST-MODE-PRODUCT/lib/mlops
  realtimeSuggestions = require('@/lib/mlops/realtimeSuggestions');
  codebaseIndexer = require('@/lib/mlops/codebaseIndexer');
} catch (error) {
  console.error('[Suggestions API] Failed to load modules:', error);
}

/**
 * Real-Time Code Suggestions API
 * 
 * Provides inline code completion and suggestions.
 * Similar to GitHub Copilot.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      repo,
      filePath,
      content,
      cursorLine,
      cursorColumn,
      useLLM = false,
    } = body;

    if (!repo || !filePath || !content) {
      return NextResponse.json(
        { error: 'Repository, file path, and content are required' },
        { status: 400 }
      );
    }

    if (!realtimeSuggestions) {
      return NextResponse.json(
        { error: 'Real-time suggestions not available' },
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
        console.warn('[Suggestions API] Could not get user API key:', error);
      }
    }

    // Ensure codebase is indexed
    // In production, this would be done asynchronously
    // For now, we'll do a quick index check
    const stats = codebaseIndexer.getStats();
    if (stats.filesIndexed === 0) {
      // Quick index (in production, this would be cached)
      console.log('[Suggestions API] Indexing codebase...');
      // Would index here in production
    }

    // Get suggestions
    const suggestions = await realtimeSuggestions.getSuggestions(
      filePath,
      content,
      cursorLine || 1,
      cursorColumn || 0,
      {
        useLLM: useLLM && !!userApiKey,
        userApiKey,
        maxSuggestions: 5,
      }
    );

    // Get quality hint
    const qualityHint = await realtimeSuggestions.getQualityHint(
      filePath,
      content,
      cursorLine || 1,
      cursorColumn || 0
    );

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map(s => ({
        text: s.text,
        type: s.type,
        score: s.score,
        source: s.source,
      })),
      qualityHint,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Suggestions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions', details: error.message },
      { status: 500 }
    );
  }
}

