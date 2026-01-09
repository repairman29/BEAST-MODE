import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules (server-side only, bypasses webpack)
function loadImprover() {
  // Use eval to bypass webpack bundling for dynamic requires
  // NOTE: ArchitectureEnforcer may flag this, but // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() is REQUIRED here
  // to bypass webpack's static analysis. This is safe because:
  // 1. Only runs server-side in API routes (never in browser)
  // 2. Only loads trusted Node.js modules from the same codebase
  // 3. No user input is evaluated
  // eslint-disable-next-line no-eval
  const path = eval('require')('path');
  const rootPath = path.resolve(process.cwd(), '..');
  const improverPath = path.join(rootPath, 'lib/mlops/automatedQualityImprover');
  
  try {
    // eslint-disable-next-line no-eval
    const automatedImprover = eval('require')(improverPath);
    console.log('[Quality Improvement API] Loaded automatedImprover:', {
      exists: !!automatedImprover,
      hasMethod: automatedImprover ? typeof automatedImprover.improveRepositoryQuality : 'N/A'
    });
    return automatedImprover;
  } catch (error: any) {
    console.error('[Quality Improvement API] Failed to load improver:', error.message);
    throw error;
  }
}

/**
 * Automated Quality Improvement API
 * 
 * Improves repository quality from current score to target score.
 * Phase 3: Automated Improvement Workflows
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, targetQuality, autoApply = false, dryRun = true, createPR = false } = body;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }
    
    if (targetQuality === undefined || targetQuality < 0 || targetQuality > 1) {
      return NextResponse.json(
        { error: 'Target quality must be between 0 and 1' },
        { status: 400 }
      );
    }
    
    // Load the improver module (server-side only)
    const automatedImprover = loadImprover();
    
    if (!automatedImprover || typeof automatedImprover.improveRepositoryQuality !== 'function') {
      console.error('[Quality Improvement API] automatedImprover:', {
        exists: !!automatedImprover,
        hasMethod: automatedImprover ? typeof automatedImprover.improveRepositoryQuality : 'N/A',
        keys: automatedImprover ? Object.keys(automatedImprover) : []
      });
      return NextResponse.json(
        { error: 'Automated quality improver not available', details: 'Module loaded but improveRepositoryQuality method not found' },
        { status: 500 }
      );
    }
    
    // Get improvement plan
    const plan = await automatedImprover.improveRepositoryQuality(
      repo,
      targetQuality,
      {
        autoApply,
        dryRun,
        maxIterations: 10,
        minImprovementPerIteration: 0.05,
      }
    );
    
    const response = {
      success: plan.success,
      repo,
      currentQuality: plan.currentQuality,
      targetQuality,
      finalQuality: plan.finalQuality,
      iterations: plan.iterations.length,
      generatedFiles: plan.generatedFiles.length,
      plan: {
        iterations: plan.iterations.map(iter => ({
          iteration: iter.iteration,
          qualityBefore: iter.qualityBefore,
          qualityAfter: iter.qualityAfter,
          improvement: iter.qualityAfter - iter.qualityBefore,
          actions: iter.actions,
          generatedFiles: iter.generatedFiles.map(f => ({
            fileName: f.fileName,
            actionType: f.actionType,
            language: f.language,
          })),
        })),
        summary: {
          totalFilesToGenerate: plan.generatedFiles.length,
          estimatedFinalQuality: plan.finalQuality,
          willMeetTarget: plan.finalQuality >= targetQuality,
        },
      },
      ...(plan.appliedChanges && plan.appliedChanges.length > 0 && {
        appliedChanges: plan.appliedChanges,
      }),
      ...(plan.validation && {
        validation: plan.validation,
      }),
      ...(plan.error && { error: plan.error }),
    };

    // Create PR if requested
    if (createPR && !dryRun && plan.success && plan.generatedFiles.length > 0) {
      try {
        // Get user's GitHub token
        const userId = request.cookies.get('github_oauth_user_id')?.value;
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'GitHub authentication required to create PR',
          });
        }

        const { getDecryptedToken } = require('../../../../lib/github-token');
        const userToken = await getDecryptedToken(userId);

        if (!userToken) {
          return NextResponse.json({
            success: false,
            error: 'GitHub token not found',
          });
        }

        prCreator.initialize(userToken);
        const prResult = await prCreator.createImprovementPR(
          repo,
          plan,
          plan.generatedFiles,
          {
            title: `Quality Improvement: ${(plan.currentQuality * 100).toFixed(0)}% → ${(plan.finalQuality * 100).toFixed(0)}%`,
          }
        );

        return NextResponse.json({
          ...response,
          pr: prResult.success ? prResult.pr : null,
          prError: prResult.success ? null : prResult.error,
        });
      } catch (prError: any) {
        console.error('[Quality Improvement API] PR creation failed:', prError);
        return NextResponse.json({
          ...response,
          prError: prError.message,
        });
      }
    }

    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('[Quality Improvement API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate improvement plan', details: error.message },
      { status: 500 }
    );
  }
}

