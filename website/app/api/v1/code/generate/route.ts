import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Backend API v1 - Code Generation
 * 
 * This is the galaxy's best vibe-coder's oasis.
 * Generates code using BEAST MODE's own models and infrastructure.
 * 
 * Uses LLMCodeGenerator per BEAST_MODE_EXPERT_ONBOARDING.md
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate with BEAST MODE API key
    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-beast-mode-api-key');
    const beastModeApiKey = apiKeyHeader || 
                            authHeader?.replace('Bearer ', '') ||
                            process.env.BEAST_MODE_API_KEY ||
                            process.env.BM_LIVE_API_KEY;

    if (!beastModeApiKey) {
      return NextResponse.json({
        error: 'BEAST MODE API key is required',
        message: 'Please provide a BEAST MODE API key in the Authorization header or X-BEAST-MODE-API-KEY header',
      }, { status: 401 });
    }

    // Validate API key format
    if (!beastModeApiKey.startsWith('bm_live_') && !beastModeApiKey.startsWith('bm_test_')) {
      return NextResponse.json({
        error: 'Invalid BEAST MODE API key format',
        message: 'BEAST MODE API keys should start with bm_live_ or bm_test_',
      }, { status: 401 });
    }

    // Parse request body
    const { prompt, language = 'typescript', context = {}, userId = 'system' } = await request.json();

    if (!prompt) {
      return NextResponse.json({
        error: 'Prompt is required',
        message: 'Please provide a prompt describing what code to generate',
      }, { status: 400 });
    }

    console.log('[BEAST MODE Backend] Generating code:', {
      userId,
      language,
      promptLength: prompt.length,
      hasContext: !!context.description,
    });

    // Build enhanced prompt for BEAST MODE
    const enhancedPrompt = `You are BEAST MODE, the galaxy's best vibe-coder. Generate COMPLETE, PRODUCTION-READY code.

USER REQUEST: ${prompt}

${context.description ? `CONTEXT: ${context.description}` : ''}
${context.techStack ? `TECH STACK: ${context.techStack.join(', ')}` : ''}

CRITICAL REQUIREMENTS:
1. Generate ACTUAL, COMPLETE implementation code - NOT placeholders, NOT examples, NOT templates
2. The code must solve the SPECIFIC problem: "${prompt}"
3. Include error handling, type safety, and proper structure
4. Use modern best practices for ${language}
5. Return ONLY the code, wrapped in markdown code blocks with language identifier
6. Make it production-ready and beautiful

RESPONSE FORMAT:
\`\`\`${language}
// Complete, production-ready implementation
export function myFunction() {
  // Real, working code that solves the problem
}
\`\`\`

ABSOLUTELY FORBIDDEN:
- DO NOT return placeholder code
- DO NOT return example code or templates
- DO NOT return TODO comments as implementation
- DO NOT return conversational text before or after the code
- The code must be production-ready and complete

Generate the code now:`;

    // Use BEAST MODE's LLMCodeGenerator - this is the proper way per expert onboarding
    let generatedCode = null;
    let modelUsed = null;

    try {
      // Load dependencies for LLMCodeGenerator
      const modelRouterModule = require('@/lib/mlops/modelRouter');
      const knowledgeRAGModule = require('@/lib/mlops/knowledgeRAG');
      
      const getModelRouter = modelRouterModule.getModelRouter;
      const getKnowledgeRAG = knowledgeRAGModule.getKnowledgeRAG;
      
      if (typeof getModelRouter !== 'function' || typeof getKnowledgeRAG !== 'function') {
        throw new Error('Model router or knowledge RAG not available');
      }
      
      // Create LLMCodeGenerator instance with dependencies injected
      const LLMCodeGenerator = require('@/lib/mlops/llmCodeGenerator');
      const generator = new LLMCodeGenerator({
        getModelRouter,
        getKnowledgeRAG,
      });
      
      // Initialize model router
      await generator.initializeModelRouter();
      
      console.log('[BEAST MODE Backend] Using LLMCodeGenerator for code generation');
      
      // Use smart model selector to find the best model
      // LLMCodeGenerator will automatically use the best available model via model router
      const systemPrompt = `You are BEAST MODE, the galaxy's best vibe-coder. Generate COMPLETE, PRODUCTION-READY code. Return ONLY the code in markdown code blocks, no explanations. Make it beautiful, efficient, and production-ready.`;
      
      // Try custom model first, model router will auto-fallback to any available model
      const result = await generator.generateWithModelRouter(enhancedPrompt, {
        model: 'custom:beast-mode-code-generator', // Will auto-fallback to any available custom model
        temperature: 0.3,
        maxTokens: 4000,
        systemPrompt,
        userId,
        useKnowledgeRAG: true, // Use knowledge RAG for better context
        codebaseContext: context.description || '',
      });
      
      // generateWithModelRouter returns a string (the content)
      if (result && typeof result === 'string' && result.length > 50) {
        // Extract code from markdown blocks
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
        const matches: string[] = [];
        let match: RegExpExecArray | null;
        
        while ((match = codeBlockRegex.exec(result)) !== null) {
          matches.push(match[1].trim());
        }
        
        if (matches.length > 0) {
          // Return the longest match (likely the main code)
          generatedCode = matches.reduce((a, b) => a.length > b.length ? a : b);
          modelUsed = 'custom:beast-mode-code-generator'; // Model router will have used the best available
        } else if (result.length > 100 && 
                   (result.includes('export') || 
                    result.includes('function') || 
                    result.includes('const') || 
                    result.includes('class'))) {
          // If no code blocks but looks like code, use it
          generatedCode = result.trim();
          modelUsed = 'custom:beast-mode-code-generator';
        }
      }

    } catch (generatorError: any) {
      console.error('[BEAST MODE Backend] LLMCodeGenerator failed:', generatorError.message);
      
      // Return helpful error instead of throwing
      return NextResponse.json({
        success: false,
        error: 'Code generation failed',
        message: generatorError.message || 'BEAST MODE was unable to generate code. Please check model configuration.',
        details: 'Ensure custom models are configured in Supabase custom_models table with is_active=true and a valid endpoint_url.',
      }, { status: 503 });
    }

    // If we got code, return it
    if (generatedCode && generatedCode.length > 50) {
      console.log('[BEAST MODE Backend] ✅ Code generated successfully:', {
        codeLength: generatedCode.length,
        model: modelUsed,
        language,
      });

      return NextResponse.json({
        success: true,
        code: generatedCode,
        language,
        model: modelUsed,
        timestamp: new Date().toISOString(),
        source: 'beast-mode-backend',
      });
    }

    // If no code generated, return helpful error
    return NextResponse.json({
      success: false,
      error: 'Code generation failed',
      message: 'BEAST MODE was unable to generate code. Please check model configuration.',
      details: modelUsed ? `Model ${modelUsed} did not return valid code` : 'No BEAST MODE models available',
    }, { status: 503 });

  } catch (error: any) {
    console.error('[BEAST MODE Backend] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    }, { status: 500 });
  }
}
