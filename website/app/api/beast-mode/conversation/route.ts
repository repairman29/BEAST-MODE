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
        let basePrompt = `Generate code solution for this bounty:

${bounty.title ? `Title: ${bounty.title}` : ''}
${bounty.description ? `Description: ${bounty.description}` : ''}
${bounty.tech_stack ? `Tech Stack: ${bounty.tech_stack.join(', ')}` : ''}

${codePrompt}

CRITICAL: Return ONLY valid JSON in this exact format:
{
  "files": [
    {
      "path": "src/path/to/file.ts",
      "content": "export function solveBounty() { /* full implementation */ }",
      "language": "typescript"
    }
  ],
  "summary": "Brief description",
  "test_files": [
    {
      "path": "tests/path/to/test.ts",
      "content": "describe('solution', () => { /* tests */ })",
      "language": "typescript"
    }
  ]
}

Return ONLY the JSON, no markdown, no explanations. The "content" field must contain actual, complete, working code.`;

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

        // Call the internal /api/codebase/chat endpoint
        // In Vercel, use the request URL to determine the base URL
        const requestUrl = new URL(request.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
        
        const sessionId = `codegen-${Date.now()}`;
        const chatResponse = await fetch(`${baseUrl}/api/codebase/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message: enhancedPrompt,
            repo: repo.owner && repo.repo ? `${repo.owner}/${repo.repo}` : null,
            model: 'openai:gpt-4',
          }),
        });
        
        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          throw new Error(`Codebase chat API returned ${chatResponse.status}: ${errorText}`);
        }
        
        const chatData = await chatResponse.json();
        const generatedCode = chatData.response || chatData.content || chatData.message || '';
        
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
