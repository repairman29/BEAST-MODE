/**
 * Automated Quality Improver
 * 
 * Phase 3: End-to-end automated quality improvement workflows.
 * Takes a repository, analyzes quality, generates improvements, and applies them.
 */

const { fileQualityScorer } = require('./fileQualityScorer');
const qualityToCodeMapper = require('./qualityToCodeMapper');
const codeGenerator = require('./codeGenerator');
const qualitySupabase = require('./qualitySupabaseIntegration');
const qualityValidator = require('./qualityValidator');

class AutomatedQualityImprover {
  constructor() {
    this.improvementHistory = new Map();
  }

  /**
   * Improve repository quality from current score to target score
   * @param {string} repo - Repository name (owner/repo)
   * @param {number} targetQuality - Target quality score (0-1)
   * @param {Object} options - Improvement options
   * @returns {Object} Improvement plan and results
   */
  async improveRepositoryQuality(repo, targetQuality, options = {}) {
    const {
      maxIterations = 10,
      minImprovementPerIteration = 0.05,
      autoApply = false,
      dryRun = true,
    } = options;

    const plan = {
      repo,
      targetQuality,
      currentQuality: null,
      iterations: [],
      generatedFiles: [],
      appliedChanges: [],
      finalQuality: null,
      success: false,
    };

    try {
      // Step 1: Get current quality
      const qualityResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/repos/quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo }),
      });

      if (!qualityResponse.ok) {
        throw new Error('Failed to fetch current quality');
      }

      const qualityData = await qualityResponse.json();
      plan.currentQuality = qualityData.quality;

      if (plan.currentQuality >= targetQuality) {
        return {
          ...plan,
          success: true,
          message: `Repository already meets target quality (${plan.currentQuality.toFixed(2)} >= ${targetQuality})`,
        };
      }

      // Step 2: Get quality recommendations
      const recommendations = qualityData.recommendations || [];
      
      // Step 3: Iteratively improve
      let currentQuality = plan.currentQuality;
      let iteration = 0;

      while (currentQuality < targetQuality && iteration < maxIterations) {
        iteration++;
        
        const iterationPlan = {
          iteration,
          qualityBefore: currentQuality,
          actions: [],
          generatedFiles: [],
          qualityAfter: null,
        };

        // Get top recommendations for this iteration
        const topRecommendations = recommendations
          .filter(r => (r.estimatedGain || 0) >= minImprovementPerIteration)
          .sort((a, b) => (b.estimatedGain || 0) - (a.estimatedGain || 0))
          .slice(0, 3); // Top 3 per iteration

        for (const recommendation of topRecommendations) {
          // Map recommendation to file actions
          const fileActions = qualityToCodeMapper.mapRecommendationToFiles(
            recommendation,
            [], // Would need to fetch files from repo
            { repo, language: qualityData.factors?.language?.value || 'Unknown' }
          );

          // Generate code for actions
          const generated = codeGenerator.generateFromMappings(fileActions);

          iterationPlan.actions.push({
            recommendation: recommendation.action,
            fileActions: fileActions.length,
            generatedFiles: generated.length,
          });

          iterationPlan.generatedFiles.push(...generated);

          // Estimate quality improvement
          const estimatedImprovement = fileActions.reduce(
            (sum, a) => sum + (a.estimatedImpact || 0),
            0
          );
          currentQuality = Math.min(1, currentQuality + estimatedImprovement * 0.5); // Conservative estimate
        }

        iterationPlan.qualityAfter = currentQuality;
        plan.iterations.push(iterationPlan);
        plan.generatedFiles.push(...iterationPlan.generatedFiles);

        // If improvement is too small, break
        if (iterationPlan.qualityAfter - iterationPlan.qualityBefore < minImprovementPerIteration) {
          break;
        }
      }

      plan.finalQuality = currentQuality;
      plan.success = currentQuality >= targetQuality;

      // Step 4: Validate improvement plan
      const validation = await qualityValidator.validatePlan(plan);
      plan.validation = validation;

      // Step 5: Store improvement plan in Supabase
      const planId = await qualitySupabase.storeImprovementPlan(
        repo,
        options.userId || null,
        targetQuality,
        plan.currentQuality,
        plan
      );

      // Step 6: Store generated code files in Supabase
      if (planId && plan.generatedFiles.length > 0) {
        for (const file of plan.generatedFiles) {
          await qualitySupabase.storeGeneratedCode(
            planId,
            repo,
            file.fileName,
            file.fileName,
            file.actionType,
            file.code,
            file.language,
            file.estimatedImpact
          ).catch(err => {
            console.warn(`[Automated Improver] Failed to store generated code:`, err.message);
          });
        }
      }

      // Step 7: Record quality improvement in history
      if (plan.finalQuality > plan.currentQuality) {
        await qualitySupabase.recordImprovement(
          repo,
          'automated_improvement',
          `Quality improved from ${plan.currentQuality.toFixed(2)} to ${plan.finalQuality.toFixed(2)}`,
          plan.currentQuality,
          plan.finalQuality,
          null,
          {
            iterations: plan.iterations.length,
            filesGenerated: plan.generatedFiles.length,
            targetQuality,
          }
        ).catch(err => {
          console.warn(`[Automated Improver] Failed to record improvement:`, err.message);
        });
      }

      // Step 8: Store quality snapshot
      await qualitySupabase.storeQualitySnapshot(
        repo,
        plan.finalQuality,
        null, // percentile would come from quality API
        null, // average file score
        null, // file count
        {}, // quality distribution
        {}, // factors
        'after_improvement'
      ).catch(err => {
        console.warn(`[Automated Improver] Failed to store snapshot:`, err.message);
      });

      // Step 9: Apply changes if requested
      if (autoApply && !dryRun) {
        plan.appliedChanges = await this.applyImprovements(plan.generatedFiles, repo);
      }

      return {
        ...plan,
        planId, // Include plan ID for reference
      };

    } catch (error) {
      return {
        ...plan,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply generated improvements to repository
   * @param {Array} generatedFiles - Array of generated file objects
   * @param {string} repo - Repository name
   * @returns {Array} Applied changes
   */
  async applyImprovements(generatedFiles, repo) {
    const applied = [];

    // In a real implementation, this would:
    // 1. Create a branch
    // 2. Commit generated files
    // 3. Create a PR
    // 4. Or apply directly if auto-apply is enabled

    for (const file of generatedFiles) {
      applied.push({
        file: file.fileName,
        action: file.actionType,
        status: 'generated', // Would be 'applied' in real implementation
        code: file.code,
      });
    }

    return applied;
  }

  /**
   * Get improvement plan without applying
   * @param {string} repo - Repository name
   * @param {number} targetQuality - Target quality score
   * @returns {Object} Improvement plan
   */
  async getImprovementPlan(repo, targetQuality) {
    return this.improveRepositoryQuality(repo, targetQuality, {
      dryRun: true,
      autoApply: false,
    });
  }

  /**
   * Track quality improvement over time
   * @param {string} repo - Repository name
   * @param {Object} change - Change made
   * @returns {Object} Quality impact
   */
  async trackQualityImpact(repo, change) {
    // Get quality before
    const beforeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo }),
    });

    const beforeData = await beforeResponse.json();
    const qualityBefore = beforeData.quality;

    // Apply change (simulated)
    // In real implementation, would apply change and re-measure

    // Get quality after
    const afterResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo }),
    });

    const afterData = await afterResponse.json();
    const qualityAfter = afterData.quality;

    return {
      change,
      qualityBefore,
      qualityAfter,
      improvement: qualityAfter - qualityBefore,
      success: qualityAfter > qualityBefore,
    };
  }
}

module.exports = new AutomatedQualityImprover();

