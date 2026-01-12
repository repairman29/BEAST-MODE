import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Conversation API
 *
 * Handles AI conversation requests
 */
export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if this is a code generation request
    if (context?.type === 'code_generation' || context?.task === 'generate_code') {
      try {
        console.log('[BEAST MODE] Code generation request detected');
        // Use the existing /api/codebase/chat endpoint which already works
        // This avoids module resolution issues by using HTTP instead of direct imports
        const bounty = context.bounty || {};
        const repo = context.repo || {};
        const dossier = context.dossier || {};
        
        let codePrompt = message;
        if (message.startsWith('CODE GENERATION TASK: ')) {
          codePrompt = message.substring('CODE GENERATION TASK: '.length);
        }
        
        // Get improved prompt based on error analysis
        // CRITICAL: Make the prompt extremely explicit about generating REAL code, not placeholders
        let basePrompt = `You are an expert software developer. Generate a COMPLETE, PRODUCTION-READY code solution for this specific bounty.

BOUNTY DETAILS:
${bounty.title ? `Title: ${bounty.title}` : ''}
${bounty.description ? `Description: ${bounty.description}` : ''}
${bounty.tech_stack ? `Tech Stack: ${bounty.tech_stack.join(', ')}` : ''}

${codePrompt}

CRITICAL REQUIREMENTS:
1. Generate ACTUAL, COMPLETE implementation code - NOT placeholders, NOT examples, NOT templates
2. The code must solve the SPECIFIC problem described in the bounty
3. Include error handling, type safety, and proper structure
4. Use the specified tech stack
5. Return ONLY valid JSON - no markdown, no explanations, no code blocks

REQUIRED JSON FORMAT:
{
  "files": [
    {
      "path": "src/path/to/actual-solution.ts",
      "content": "// Complete implementation that solves: ${bounty.title || 'the bounty'}\nexport function solveBounty() {\n  // REAL implementation code here - not placeholder\n  // Must actually solve the problem\n}",
      "language": "typescript"
    }
  ],
  "summary": "Brief description of what this solution does",
  "test_files": [
    {
      "path": "tests/path/to/test.ts",
      "content": "describe('solution', () => {\n  it('should solve the bounty', () => {\n    // Real test code\n  });\n});",
      "language": "typescript"
    }
  ]
}

IMPORTANT: 
- The "content" field MUST contain REAL, COMPLETE code that solves "${bounty.title || 'this bounty'}"
- DO NOT return placeholder code like "export function add(a, b) { return a + b; }"
- DO NOT return example code
- Generate code that SPECIFICALLY addresses: ${bounty.description?.substring(0, 200) || codePrompt.substring(0, 200)}
- The code must be production-ready and complete`;

        // Get improved prompt from error analysis (learns from failures)
        let enhancedPrompt = basePrompt;
        try {
          const { getErrorAnalysis } = require('@/lib/mlops/errorAnalysis');
          const errorAnalysis = getErrorAnalysis();
          enhancedPrompt = await errorAnalysis.generateImprovedPrompt(basePrompt, {
            bounty,
            repo,
            dossier
          });
        } catch (error) {
          // Non-critical - use original prompt if error analysis fails
          console.warn('[BEAST MODE] Error analysis unavailable, using original prompt:', error.message);
          enhancedPrompt = basePrompt;
        }

        // Use LLMCodeGenerator directly for code generation
        // This is the proper way to generate code with BEAST MODE
        let generator: any;
        try {
          // Load dependencies first
          const modelRouterModule = require('@/lib/mlops/modelRouter');
          const knowledgeRAGModule = require('@/lib/mlops/knowledgeRAG');
          
          // Get the factory functions
          const getModelRouter = modelRouterModule.getModelRouter;
          const getKnowledgeRAG = knowledgeRAGModule.getKnowledgeRAG;
          
          // Verify they are functions
          if (typeof getModelRouter !== 'function') {
            throw new Error(`getModelRouter is not a function, got: ${typeof getModelRouter}`);
          }
          if (typeof getKnowledgeRAG !== 'function') {
            throw new Error(`getKnowledgeRAG is not a function, got: ${typeof getKnowledgeRAG}`);
          }
          
          // Create generator instance with dependencies injected
          const LLMCodeGenerator = require('@/lib/mlops/llmCodeGenerator');
          generator = new LLMCodeGenerator({
            getModelRouter,
            getKnowledgeRAG,
          });
          
          // Initialize model router
          await generator.initializeModelRouter();
        } catch (importError: any) {
          console.error('[BEAST MODE] Failed to import LLMCodeGenerator:', importError.message);
          console.error('[BEAST MODE] Import error stack:', importError.stack);
          throw new Error(`Failed to load code generator: ${importError.message}`);
        }
        
        const userId = request.headers.get('x-user-id') || 'system';
        
        // Generate code using model router
        // Ensure all parameters are properly formatted
        const techStack = Array.isArray(bounty.tech_stack) ? bounty.tech_stack : (bounty.tech_stack ? [bounty.tech_stack] : []);
        const repoString = repo.owner && repo.repo ? `${repo.owner}/${repo.repo}` : null;
        
        console.log('[BEAST MODE] Generating code with params:', {
          userId,
          repo: repoString,
          techStack,
          hasPrompt: !!enhancedPrompt,
          promptLength: enhancedPrompt?.length,
        });
        
        let generatedResult: any;
        try {
          // Build a much more explicit and detailed prompt
          const detailedPrompt = `${enhancedPrompt}

YOU MUST GENERATE REAL CODE THAT SOLVES THIS SPECIFIC PROBLEM:
"${bounty.title || 'the bounty'}"

PROBLEM DESCRIPTION:
${bounty.description || 'See above'}

TECHNICAL REQUIREMENTS:
${bounty.tech_stack ? `- Use these technologies: ${bounty.tech_stack.join(', ')}` : ''}
- Generate COMPLETE, WORKING implementation
- Include proper error handling
- Use appropriate design patterns
- Follow best practices for ${bounty.tech_stack?.[0] || 'the language'}

ABSOLUTELY FORBIDDEN:
- DO NOT return "export function add(a: number, b: number) { return a + b; }"
- DO NOT return placeholder code
- DO NOT return example code
- DO NOT return template code
- DO NOT return TODO comments as implementation

YOU MUST:
- Generate code that SPECIFICALLY solves "${bounty.title || 'this bounty'}"
- Make the code production-ready and complete
- Include all necessary imports, types, and error handling
- The code must be at least 200+ lines if it's a complex solution
- The code must actually implement the functionality described

Return ONLY valid JSON with the files array containing REAL implementation code.`;

          generatedResult = await generator.generateWithModelRouter(
            detailedPrompt,
            {
              userId,
              model: 'anthropic:claude-3-5-sonnet-20241022', // Use Sonnet for better code generation (more capable)
              temperature: 0.2, // Lower temperature for more focused, deterministic output
              maxTokens: 16000, // Increase token limit for longer, complete code
              systemPrompt: `You are an expert software developer specializing in ${bounty.tech_stack?.[0] || 'software development'}. 

Your task is to generate COMPLETE, PRODUCTION-READY code that solves a specific problem.

CRITICAL REQUIREMENTS:
1. Generate REAL, COMPLETE implementation code - NOT placeholders, NOT examples, NOT templates
2. The code MUST solve the SPECIFIC problem provided in the user's request
3. Include proper error handling, type safety, imports, and structure
4. Return ONLY valid JSON format with a "files" array
5. Each file's "content" field MUST contain COMPLETE, WORKING code (minimum 200+ lines for complex solutions)
6. DO NOT return placeholder code like "export function add(a, b) { return a + b; }"
7. DO NOT return example code or templates
8. The code must be specific to the problem described

The user will provide a detailed description of the problem. Generate code that actually solves that problem.`,
              repo: repoString,
              techStack: techStack,
              context: {
                type: 'code_generation',
                task: 'generate_code',
                bounty: bounty.title || 'Unknown',
              },
            }
          );
          console.log('[BEAST MODE] Code generation successful, result type:', typeof generatedResult);
          console.log('[BEAST MODE] Raw LLM response (first 1000 chars):', typeof generatedResult === 'string' ? generatedResult.substring(0, 1000) : JSON.stringify(generatedResult).substring(0, 1000));
          
          // Check if response is placeholder code BEFORE parsing
          if (typeof generatedResult === 'string') {
            if (generatedResult.includes('function add(a') || generatedResult.includes('return a + b')) {
              console.error('[BEAST MODE] ERROR: LLM returned placeholder code in raw response!');
              throw new Error('LLM returned placeholder code. This is not acceptable. The model must generate real code that solves the specific bounty problem.');
            }
          }
        } catch (genError: any) {
          console.error('[BEAST MODE] Code generation error:', genError.message);
          console.error('[BEAST MODE] Error stack:', genError.stack);
          // Re-throw with more context
          throw new Error(`Code generation failed: ${genError.message}. Stack: ${genError.stack?.substring(0, 500)}`);
        }
        
        // Parse the generated result
        // generateWithModelRouter returns a string (the LLM response)
        // We need to parse it to extract the JSON structure
        let generatedCode: any;
        
        console.log('[BEAST MODE] Raw LLM response type:', typeof generatedResult);
        console.log('[BEAST MODE] Raw LLM response length:', typeof generatedResult === 'string' ? generatedResult.length : 'N/A');
        console.log('[BEAST MODE] Raw LLM response preview:', typeof generatedResult === 'string' ? generatedResult.substring(0, 500) : JSON.stringify(generatedResult).substring(0, 500));
        
        if (typeof generatedResult === 'string') {
          // Try to parse as JSON first
          try {
            generatedCode = JSON.parse(generatedResult);
            console.log('[BEAST MODE] Successfully parsed as JSON');
          } catch (e) {
            // If not JSON, try to extract JSON from markdown code blocks
            const jsonMatch = generatedResult.match(/\{[\s\S]*"files"[\s\S]*\}/);
            if (jsonMatch) {
              try {
                generatedCode = JSON.parse(jsonMatch[0]);
                console.log('[BEAST MODE] Extracted JSON from markdown');
              } catch (e2) {
                console.error('[BEAST MODE] Failed to parse extracted JSON:', e2.message);
                // If JSON extraction fails, check if it's placeholder code
                if (generatedResult.includes('function add(a') || generatedResult.includes('return a + b')) {
                  console.error('[BEAST MODE] ERROR: LLM returned placeholder code! Rejecting...');
                  throw new Error('LLM returned placeholder code instead of real solution. This is not acceptable.');
                }
                // Create structure from raw response only if it's substantial
                if (generatedResult.length < 200) {
                  console.error('[BEAST MODE] ERROR: Response too short, likely placeholder. Rejecting...');
                  throw new Error('LLM response too short, likely placeholder code. This is not acceptable.');
                }
                const techStack = Array.isArray(bounty.tech_stack) ? bounty.tech_stack : [];
                const primaryLang = techStack[0] || 'typescript';
                generatedCode = {
                  files: [{
                    path: `solution.${primaryLang === 'typescript' ? 'ts' : primaryLang === 'python' ? 'py' : 'js'}`,
                    language: primaryLang,
                    content: generatedResult,
                  }],
                  summary: 'Generated code solution',
                  test_files: [],
                };
              }
            } else {
              // No JSON found - check if it's placeholder
              if (generatedResult.includes('function add(a') || generatedResult.includes('return a + b')) {
                console.error('[BEAST MODE] ERROR: LLM returned placeholder code! Rejecting...');
                throw new Error('LLM returned placeholder code instead of real solution. This is not acceptable.');
              }
              if (generatedResult.length < 200) {
                console.error('[BEAST MODE] ERROR: Response too short, likely placeholder. Rejecting...');
                throw new Error('LLM response too short, likely placeholder code. This is not acceptable.');
              }
              // Create structure from raw response
              const techStack = Array.isArray(bounty.tech_stack) ? bounty.tech_stack : [];
              const primaryLang = techStack[0] || 'typescript';
              generatedCode = {
                files: [{
                  path: `solution.${primaryLang === 'typescript' ? 'ts' : primaryLang === 'python' ? 'py' : 'js'}`,
                  language: primaryLang,
                  content: generatedResult,
                }],
                summary: 'Generated code solution',
                test_files: [],
              };
            }
          }
        } else {
          // Already an object
          generatedCode = generatedResult;
        }
        
        // Validate the generated code - reject placeholders
        if (generatedCode.files && Array.isArray(generatedCode.files)) {
          for (const file of generatedCode.files) {
            const content = file.content || '';
            if (content.includes('function add(a') || content.includes('return a + b') || content.length < 100) {
              console.error('[BEAST MODE] ERROR: Generated file contains placeholder code!');
              console.error('[BEAST MODE] File content:', content.substring(0, 200));
              throw new Error(`Generated file "${file.path}" contains placeholder code. This is not acceptable.`);
            }
          }
        }
        
        // Ensure generatedCode has the expected structure
        if (!generatedCode.files || !Array.isArray(generatedCode.files)) {
          console.error('[BEAST MODE] ERROR: Generated code missing files array');
          throw new Error('Generated code missing files array. This is not acceptable.');
        }
        
        // Log successful generation for learning
        try {
          const { getDatabaseWriter } = require('@/lib/mlops/databaseWriter');
          const dbWriter = getDatabaseWriter();
          await dbWriter.writePrediction({
            serviceName: 'beast-mode-code-generation',
            predictionType: 'code_generation_success',
            predictedValue: 1, // Success = 1
            actualValue: 1,
            confidence: 0.9,
            context: {
              messageLength: message.length,
              hasBounty: !!bounty.title,
              hasRepo: !!repo.owner,
              timestamp: new Date().toISOString(),
            },
            modelVersion: 'conversation-api-v1',
            source: 'success_logging'
          });
        } catch (dbError) {
          // Non-critical
          console.warn('[BEAST MODE] Failed to log success:', dbError.message);
        }
        
        // Parse the response to extract JSON
        let codeResponse = generatedCode;
        if (typeof generatedCode === 'string') {
          // Try to extract JSON from the response
          const jsonMatch = generatedCode.match(/\{[\s\S]*"files"[\s\S]*\}/);
          if (jsonMatch) {
            try {
              codeResponse = JSON.parse(jsonMatch[0]);
            } catch (e) {
              // If JSON parse fails, return the raw response
              codeResponse = { response: generatedCode };
            }
          } else {
            codeResponse = { response: generatedCode };
          }
        }
        
        return NextResponse.json({
          response: typeof codeResponse === 'string' ? codeResponse : JSON.stringify(codeResponse),
          intent: 'code_generation',
          sentiment: 'positive',
          timestamp: new Date().toISOString(),
          code: codeResponse, // Include parsed code for easy access
          context: {
            type: 'code_generation',
            task: 'generate_code',
          }
        });
      } catch (error: any) {
        console.error('[BEAST MODE] Code generation error:', error);
        console.error('[BEAST MODE] Error stack:', error.stack);
        
        // Log error to database for learning
        try {
          const { getDatabaseWriter } = require('@/lib/mlops/databaseWriter');
          const dbWriter = getDatabaseWriter();
          await dbWriter.writePrediction({
            serviceName: 'beast-mode-code-generation',
            predictionType: 'code_generation_error',
            predictedValue: 0, // Failed = 0
            actualValue: 0, // Failed = 0
            confidence: 0,
            context: {
              error: error.message,
              errorStack: error.stack?.substring(0, 1000), // Truncate long stacks
              requestContext: context,
              message: message.substring(0, 500), // Truncate long messages
              timestamp: new Date().toISOString(),
            },
            modelVersion: 'conversation-api-v1',
            source: 'error_logging'
          });
        } catch (dbError) {
          // Non-critical - don't fail if database logging fails
          console.warn('[BEAST MODE] Failed to log error to database:', dbError.message);
        }
        
        // Return error but don't fall through - let caller know code generation failed
        return NextResponse.json({
          response: `Code generation failed: ${error.message}. Falling back to conversation mode.`,
          intent: 'code_generation_error',
          sentiment: 'neutral',
          timestamp: new Date().toISOString(),
          error: error.message,
          context: {
            type: 'code_generation',
            task: 'generate_code',
            failed: true
          }
        }, { status: 500 });
      }
    }
    

    // Get recent scan data for context
    let recentScans: any[] = [];
    try {
      // In a real implementation, this would fetch from database
      // For now, we'll use the context if provided
      if (context?.scanData) {
        recentScans = context.scanData;
      }
    } catch {
      // Ignore errors
    }

    const lowerMessage = message.toLowerCase();
    const conversationHistory = context?.conversationHistory || [];

    let response = '';
    let intent = 'general';
    let actionableItems: string[] = [];

    // Enhanced pattern matching with context awareness
    if (lowerMessage.includes('quality') || lowerMessage.includes('code quality') || lowerMessage.includes('score')) {
      if (recentScans.length > 0) {
        const latest = recentScans[0];
        const score = latest.score || 0;
        const issues = latest.issues || 0;
        const improvements = latest.improvements || 0;
        
        let scoreAssessment = '';
        if (score >= 80) {
          scoreAssessment = 'excellent';
        } else if (score >= 60) {
          scoreAssessment = 'good';
        } else {
          scoreAssessment = 'needs improvement';
        }

        response = `Based on your latest scan of **${latest.repo || 'your repository'}**, your code quality score is **${score}/100** (${scoreAssessment}).\n\n📊 **Current Status:**\n• ${issues} issues detected\n• ${improvements} improvement opportunities\n\n💡 **My Recommendations:**\n1. ${issues > 0 ? `Address the ${issues} detected issues, starting with high-priority ones` : 'Great job! No critical issues found'}\n2. ${improvements > 0 ? `Focus on the ${improvements} improvement opportunities` : 'Continue maintaining high standards'}\n3. Set up automated quality checks\n\nWould you like me to analyze specific issues or suggest improvements?`;
        intent = 'quality_analysis';
        actionableItems = ['View issues', 'See improvements', 'Run new scan'];
      } else {
        response = `I don't have recent scan data yet. Let me help you get started:\n\n1. **Scan a repository** - Go to the "Scan Repo" tab and scan your GitHub repository\n2. **Quick scan** - Use the quick scan feature in the Quality tab\n3. **View results** - Once scanned, I can provide detailed analysis\n\nWould you like me to guide you through scanning a repository?`;
        intent = 'quality_analysis';
        actionableItems = ['Go to Scan Repo', 'View Quality Tab'];
      }
    } else if (lowerMessage.includes('improve') || lowerMessage.includes('suggest') || lowerMessage.includes('recommendation')) {
      if (recentScans.length > 0) {
        const latest = recentScans[0];
        const issues = latest.detectedIssues || [];
        const highPriority = issues.filter((i: any) => i.priority === 'high');
        const mediumPriority = issues.filter((i: any) => i.priority === 'medium');
        
        response = `Here are my **personalized recommendations** based on your latest scan:\n\n${highPriority.length > 0 ? `🔴 **High Priority (${highPriority.length}):**\n${highPriority.slice(0, 3).map((i: any, idx: number) => `${idx + 1}. ${i.title || i.type}`).join('\n')}\n\n` : ''}${mediumPriority.length > 0 ? `🟡 **Medium Priority (${mediumPriority.length}):**\n${mediumPriority.slice(0, 3).map((i: any, idx: number) => `${idx + 1}. ${i.title || i.type}`).join('\n')}\n\n` : ''}💡 **General Improvements:**\n1. Add comprehensive tests - Improve test coverage\n2. Set up CI/CD - Automate build and deployment\n3. Add documentation - Improve README and code comments\n4. Security scanning - Regularly scan for vulnerabilities\n\nWould you like me to help you address any of these?`;
        intent = 'recommendations';
        actionableItems = ['View all issues', 'Apply fixes', 'Scan again'];
      } else {
        response = `Here are my **general recommendations** for improving code quality:\n\n1. **Add comprehensive tests** - Improve test coverage to catch bugs early\n2. **Set up CI/CD** - Automate your build and deployment process\n3. **Add documentation** - Improve README and code comments\n4. **Security scanning** - Regularly scan for vulnerabilities\n5. **Code reviews** - Implement peer review processes\n\nTo get **personalized recommendations**, scan a repository first!`;
        intent = 'recommendations';
        actionableItems = ['Scan Repository', 'View Quality Tab'];
      }
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      if (recentScans.length > 0) {
        const latest = recentScans[0];
        const issues = latest.detectedIssues || [];
        const highRisk = issues.filter((i: any) => i.priority === 'high');
        
        if (highRisk.length > 0) {
          response = `🚨 **Risk Assessment** for ${latest.repo || 'your repository'}:\n\n**High-Risk Issues Found:**\n${highRisk.slice(0, 5).map((i: any, idx: number) => `${idx + 1}. **${i.title || i.type}**\n   ${i.description || i.message || 'No description'}\n   ${i.file ? `File: ${i.file}${i.line ? `:${i.line}` : ''}` : ''}`).join('\n\n')}\n\n⚠️ **Action Required:** Address these high-priority issues to improve code quality and reduce risk.\n\nWould you like me to help you fix any of these?`;
          intent = 'risk_analysis';
          actionableItems = ['View all issues', 'Apply fixes', 'Get help'];
        } else {
          response = `✅ **Good news!** Your codebase shows **no high-risk issues**.\n\nBased on your latest scan:\n• Quality score: ${latest.score || 'N/A'}/100\n• Total issues: ${latest.issues || 0}\n• Improvements available: ${latest.improvements || 0}\n\nKeep up the great work! Would you like suggestions for further improvements?`;
          intent = 'risk_analysis';
          actionableItems = ['View improvements', 'See trends'];
        }
      } else {
        response = `Based on common codebase patterns, here are the **main risks** to watch for:\n\n1. **Missing error handling** - Async operations without try-catch blocks\n2. **Large components** - Files exceeding 500 lines need refactoring\n3. **Console.logs** - Debug statements in production code\n4. **Missing tests** - Critical paths lack test coverage\n5. **Security vulnerabilities** - Unpatched dependencies\n\nScan a repository to get a **personalized risk assessment**!`;
        intent = 'risk_analysis';
        actionableItems = ['Scan Repository', 'View Quality Tab'];
      }
    } else if (lowerMessage.includes('trend') || lowerMessage.includes('history') || lowerMessage.includes('over time')) {
      if (recentScans.length > 1) {
        const scores = recentScans.map((s: any) => s.score || 0);
        const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        const trend = scores[0] > scores[scores.length - 1] ? 'improving' : scores[0] < scores[scores.length - 1] ? 'declining' : 'stable';
        
        response = `📊 **Quality Trends Analysis:**\n\n**Score Trend:** ${trend === 'improving' ? '📈 Improving' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}\n• Latest: ${scores[0]}/100\n• Average: ${Math.round(avgScore)}/100\n• Scans analyzed: ${recentScans.length}\n\n**Key Insights:**\n${trend === 'improving' ? '✅ Your code quality is improving! Keep up the good work.' : trend === 'declining' ? '⚠️ Quality has declined. Focus on addressing issues.' : '📊 Quality remains stable. Consider incremental improvements.'}\n\nView detailed trends in the Quality tab with visual charts!`;
        intent = 'trends';
        actionableItems = ['View Quality Tab', 'See Charts'];
      } else {
        response = `📊 **Quality Trends:**\n\nTo see trends, you need at least 2 scans. Currently you have ${recentScans.length} scan(s).\n\n**What trends show:**\n• Score changes over time\n• Issue count trends\n• Improvement opportunities\n• Quality trajectory\n\nScan more repositories to build your trend data!`;
        intent = 'trends';
        actionableItems = ['Scan Repository', 'View Quality Tab'];
      }
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you') || lowerMessage.includes('commands')) {
      response = `🤖 **BEAST MODE AI** - Your Code Quality Assistant\n\nI can help you with:\n\n🔍 **Code Quality Analysis**\n• Analyze repositories and identify issues\n• Calculate quality scores\n• Detect code smells and anti-patterns\n\n💡 **Recommendations**\n• Suggest improvements and best practices\n• Prioritize fixes by impact\n• Generate action plans\n\n📊 **Trends & Analytics**\n• Track quality metrics over time\n• Compare scans\n• Identify patterns\n\n🎯 **Risk Assessment**\n• Identify potential problems\n• Security vulnerabilities\n• Technical debt\n\n**Try these commands:**\n• "What's the quality of my code?"\n• "Suggest improvements"\n• "What are the biggest risks?"\n• "Show me code quality trends"\n• "Analyze [repository name]"`;
      intent = 'help';
      actionableItems = ['Scan Repository', 'View Quality Tab', 'See Recommendations'];
    } else if (lowerMessage.includes('scan') || lowerMessage.includes('analyze')) {
      response = `🔍 **Ready to scan!**\n\nYou can scan repositories in two ways:\n\n1. **Quick Scan** (Quality Tab)\n   • Enter owner/repo (e.g., facebook/react)\n   • Get instant results\n\n2. **Advanced Scan** (Scan Repo Tab)\n   • Full repository analysis\n   • Detailed issue detection\n   • Export reports\n\n**To get started:**\n• Go to the Quality tab and use Quick Scan\n• Or visit the Scan Repo tab for advanced options\n\nWhat repository would you like to analyze?`;
      intent = 'scan_request';
      actionableItems = ['Go to Quality Tab', 'Go to Scan Repo'];
    } else {
      // Use conversation history for better context
      const lastIntent = conversationHistory[conversationHistory.length - 1]?.intent;
      
      if (lastIntent === 'quality_analysis' && (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('ok'))) {
        response = `Great! Here's what I can do:\n\n1. **View specific issues** - See detailed information about detected problems\n2. **Get improvement suggestions** - Actionable recommendations\n3. **Compare scans** - See how quality changes over time\n\nWhat would you like to explore?`;
        intent = 'follow_up';
      } else {
        response = `I'm here to help with code quality analysis and recommendations! 🤖\n\n**Quick Actions:**\n• Ask about code quality\n• Request improvements\n• Analyze risks\n• View trends\n\n**Or try:**\n• "What's the quality of my code?"\n• "Suggest improvements"\n• "What are the biggest risks?"\n• "Show me trends"\n\nScan a repository for detailed, personalized insights!`;
        intent = 'general';
        actionableItems = ['Scan Repository', 'View Quality Tab'];
      }
    }

    return NextResponse.json({
      response,
      intent,
      sentiment: 'positive',
      timestamp: new Date().toISOString(),
      actionableItems: actionableItems.length > 0 ? actionableItems : undefined,
      context: {
        hasScanData: recentScans.length > 0,
        scanCount: recentScans.length,
        latestScore: recentScans.length > 0 ? recentScans[0].score : null
      }
    });

  } catch (error: any) {
    console.error('Conversation API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process conversation', 
        details: error.message,
        response: "I'm sorry, I encountered an error. Please try again."
      },
      { status: 500 }
    );
  }
}
