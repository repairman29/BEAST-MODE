import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules
let automatedTesting: any;
try {
  automatedTesting = require('../../../../../lib/mlops/automatedTesting');
} catch (error) {
  console.error('[Test Generation API] Failed to load modules:', error);
}

/**
 * Automated Test Generation API
 * 
 * Generates tests for files automatically.
 * Unique differentiator - competitors don't have this.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      filePath,
      fileContent,
      testFramework = 'auto',
      coverageTarget = 0.8,
      useLLM = false,
    } = body;

    if (!filePath || !fileContent) {
      return NextResponse.json(
        { error: 'File path and content are required' },
        { status: 400 }
      );
    }

    if (!automatedTesting) {
      return NextResponse.json(
        { error: 'Automated testing not available' },
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
        console.warn('[Test Generation API] Could not get user API key:', error);
      }
    }

    // Generate tests
    const result = await automatedTesting.generateTests(
      filePath,
      fileContent,
      {
        testFramework,
        coverageTarget,
        useLLM: useLLM && !!userApiKey,
        userApiKey,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate tests', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      testFile: result.testFile,
      analysis: result.analysis,
      framework: result.framework,
      estimatedCoverage: result.estimatedCoverage,
    });

  } catch (error: any) {
    console.error('[Test Generation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tests', details: error.message },
      { status: 500 }
    );
  }
}

