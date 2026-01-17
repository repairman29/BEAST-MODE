import { NextRequest, NextResponse } from 'next/server';

/**
 * Direct Code Generation API
 * 
 * Bypasses chat system to directly generate code using LLM
 * This ensures we get actual code, not conversational responses
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, language = 'typescript', context = {} } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build explicit code generation prompt
    const codeGenerationPrompt = `You are an expert software developer. Generate COMPLETE, PRODUCTION-READY code.

USER REQUEST: ${prompt}

${context.description ? `CONTEXT: ${context.description}` : ''}
${context.techStack ? `TECH STACK: ${context.techStack.join(', ')}` : ''}

CRITICAL REQUIREMENTS:
1. Generate ACTUAL, COMPLETE implementation code - NOT placeholders, NOT examples, NOT templates
2. The code must solve the SPECIFIC problem: "${prompt}"
3. Include error handling, type safety, and proper structure
4. Use modern best practices for ${language}
5. Return ONLY the code, wrapped in markdown code blocks with language identifier

RESPONSE FORMAT:
\`\`\`${language}
// Complete implementation here
export function myFunction() {
  // Real, working code
}
\`\`\`

ABSOLUTELY FORBIDDEN:
- DO NOT return placeholder code like "export function add(a, b) { return a + b; }"
- DO NOT return example code or templates
- DO NOT return TODO comments as implementation
- DO NOT return conversational text before or after the code
- The code must be production-ready and complete
- Minimum 100 lines for complex features

Generate the code now:`;

    // Get user ID for API key retrieval
    let userId = request.cookies.get('github_oauth_user_id')?.value || request.headers.get('x-user-id') || 'system';
    
    // BEAST MODE uses its own API key - no external providers!
    const beastModeApiKey = request.headers.get('x-beast-mode-api-key') || 
                            request.headers.get('authorization')?.replace('Bearer ', '') ||
                            process.env.BEAST_MODE_API_KEY ||
                            process.env.BM_LIVE_API_KEY;

    if (!beastModeApiKey) {
      return NextResponse.json({
        success: false,
        error: 'BEAST MODE API key is required for code generation',
        message: 'Please provide a BEAST MODE API key in the X-BEAST-MODE-API-KEY header or BEAST_MODE_API_KEY environment variable',
      }, { status: 401 });
    }

    // BEAST MODE uses its own backend API for code generation
    // This is the galaxy's best vibe-coder's oasis - no external providers!
    let generatedCode = null;
    
    try {
      // Use BEAST MODE backend API (local first, then external)
      const beastModeApiUrl = process.env.BEAST_MODE_API_URL || 
                             process.env.NEXT_PUBLIC_BEAST_MODE_API_URL;
      
      // Try local backend API first (same server)
      const localBackendUrl = `${request.nextUrl.origin}/api/v1/code/generate`;
      const externalBackendUrl = beastModeApiUrl ? `${beastModeApiUrl}/api/v1/code/generate` : null;
      
      const backendUrl = localBackendUrl; // Always use local first
      
      console.log('[BEAST MODE] Generating code via BEAST MODE backend:', backendUrl);
      
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${beastModeApiKey}`,
          'X-BEAST-MODE-API-KEY': beastModeApiKey,
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          prompt: codeGenerationPrompt,
          language,
          context,
          userId,
        }),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        if (backendData.code || backendData.response) {
          generatedCode = backendData.code || extractCodeFromResponse(backendData.response || '');
          if (generatedCode && generatedCode.length > 50) {
            console.log('[BEAST MODE] ✅ Code generated successfully:', generatedCode.length, 'characters');
            return NextResponse.json({
              success: true,
              code: generatedCode,
              language: backendData.language || language,
              timestamp: new Date().toISOString(),
              source: 'beast-mode-backend',
            });
          }
        }
      } else {
        const errorData = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[BEAST MODE] Backend API error:', backendResponse.status, errorData);
        throw new Error(`BEAST MODE backend returned ${backendResponse.status}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (backendError: any) {
      console.error('[BEAST MODE] Backend API failed:', backendError.message);
      
      // Fallback to local BEAST MODE custom model if backend is unavailable
      try {
        console.log('[BEAST MODE] Trying local custom model as fallback...');
        const modelRouterModule = require('@/lib/mlops/modelRouter');
        const getModelRouter = modelRouterModule.getModelRouter;
        const router = await getModelRouter();
        await router.initialize();
        
        // Try to use BEAST MODE custom model
        const response = await router.route({
          model: 'custom:beast-mode-code-generator', // BEAST MODE's own model
          messages: [
            { role: 'system', content: 'You are BEAST MODE, the galaxy\'s best vibe-coder. Generate COMPLETE, PRODUCTION-READY code. Return ONLY the code in markdown code blocks, no explanations.' },
            { role: 'user', content: codeGenerationPrompt },
          ],
          temperature: 0.3,
          maxTokens: 4000,
          userId,
        });
        
        if (response && response.content) {
          generatedCode = extractCodeFromResponse(response.content);
          if (generatedCode && generatedCode.length > 50) {
            console.log('[BEAST MODE] ✅ Code generated via local custom model:', generatedCode.length, 'characters');
            return NextResponse.json({
              success: true,
              code: generatedCode,
              language,
              timestamp: new Date().toISOString(),
              source: 'beast-mode-local-model',
            });
          }
        }
      } catch (localError: any) {
        console.error('[BEAST MODE] Local model also failed:', localError.message);
      }
      
      // If all else fails, return helpful error
      return NextResponse.json({
        success: false,
        error: 'BEAST MODE code generation is currently unavailable',
        details: backendError.message,
        message: 'Please check your BEAST MODE API key and backend connectivity',
      }, { status: 503 });
    }

    // This should never be reached if backend/local model worked
    return NextResponse.json({
      success: false,
      error: 'BEAST MODE code generation failed',
      message: 'Unable to generate code. Please check BEAST MODE backend status.',
    }, { status: 500 });

  } catch (error: any) {
    console.error('[Code Generation] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate code',
    }, { status: 500 });
  }
}

/**
 * Extract code from markdown code blocks
 */
function extractCodeFromResponse(text: string): string | null {
  // Match code blocks: ```language\ncode\n```
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  
  // Return the longest match (likely the main code)
  if (matches.length > 0) {
    return matches.reduce((a, b) => a.length > b.length ? a : b);
  }
  
  // If no code blocks, check if entire response is code-like
  if (text.length > 100 && (text.includes('export') || text.includes('function') || text.includes('const') || text.includes('class'))) {
    return text.trim();
  }
  
  return null;
}

/**
 * Detect programming language from code
 */
function detectLanguage(code: string): string {
  if (code.includes('import React') || code.includes('from "react"') || code.includes('.tsx')) {
    return 'typescript';
  }
  if (code.includes('export default') || code.includes('export function')) {
    return 'typescript';
  }
  if (code.includes('def ') || code.includes('import ')) {
    return 'python';
  }
  if (code.includes('function ') && code.includes('const ')) {
    return 'javascript';
  }
  return 'typescript';
}
