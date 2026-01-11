/**
 * Quality-to-Code Supabase Integration
 * 
 * Stores and retrieves quality scores, improvement plans, and generated code from Supabase.
 */

const { createClient } = require('@supabase/supabase-js');

class QualitySupabaseIntegration {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  /**
   * Initialize Supabase client
   */
  async initialize() {
    if (this.initialized && this.supabase) {
      return this.supabase;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('[Quality Supabase] Supabase credentials not configured');
        return null;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      this.initialized = true;
      console.log('[Quality Supabase] Initialized successfully');
      return this.supabase;
    } catch (error) {
      console.error('[Quality Supabase] Initialization failed:', error);
      return null;
    }
  }

  /**
   * Store file quality score
   */
  async storeFileQualityScore(repo, filePath, fileName, language, score, factors, improvements, fileHash = null) {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('file_quality_scores')
        .upsert({
          repository: repo,
          file_path: filePath,
          file_name: fileName,
          language: language,
          quality_score: score,
          quality_level: this.getQualityLevel(score),
          factors: factors,
          improvements: improvements,
          file_hash: fileHash,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'repository,file_path,file_hash',
        });

      if (error) {
        console.error('[Quality Supabase] Error storing file quality score:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Quality Supabase] Exception storing file quality score:', error);
      return null;
    }
  }

  /**
   * Get file quality scores for a repository
   */
  async getFileQualityScores(repo, limit = 100) {
    await this.initialize();
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('file_quality_scores')
        .select('*')
        .eq('repository', repo)
        .order('quality_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Quality Supabase] Error fetching file quality scores:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Quality Supabase] Exception fetching file quality scores:', error);
      return [];
    }
  }

  /**
   * Store quality improvement plan
   */
  async storeImprovementPlan(repo, userId, targetQuality, currentQuality, plan) {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('quality_improvement_plans')
        .insert({
          repository: repo,
          user_id: userId,
          target_quality: targetQuality,
          current_quality: currentQuality,
          final_quality: plan.finalQuality,
          status: plan.success ? 'completed' : 'planned',
          iterations: plan.iterations,
          generated_files: plan.generatedFiles.map(f => ({
            fileName: f.fileName,
            actionType: f.actionType,
            language: f.language,
            estimatedImpact: f.estimatedImpact,
          })),
          applied_changes: plan.appliedChanges || [],
          metadata: {
            iterations: plan.iterations.length,
            totalFiles: plan.generatedFiles.length,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('[Quality Supabase] Error storing improvement plan:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Quality Supabase] Exception storing improvement plan:', error);
      return null;
    }
  }

  /**
   * Get improvement plans for a repository
   */
  async getImprovementPlans(repo, limit = 10) {
    await this.initialize();
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('quality_improvement_plans')
        .select('*')
        .eq('repository', repo)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Quality Supabase] Error fetching improvement plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Quality Supabase] Exception fetching improvement plans:', error);
      return [];
    }
  }

  /**
   * Store generated code file
   */
  async storeGeneratedCode(improvementPlanId, repo, filePath, fileName, actionType, codeContent, language, estimatedImpact) {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('generated_code_files')
        .insert({
          improvement_plan_id: improvementPlanId,
          repository: repo,
          file_path: filePath,
          file_name: fileName,
          action_type: actionType,
          code_content: codeContent,
          language: language,
          estimated_impact: estimatedImpact,
          status: 'generated',
        })
        .select()
        .single();

      if (error) {
        console.error('[Quality Supabase] Error storing generated code:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Quality Supabase] Exception storing generated code:', error);
      return null;
    }
  }

  /**
   * Get generated code files for a repository
   */
  async getGeneratedCodeFiles(repo, status = null, limit = 50) {
    await this.initialize();
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('generated_code_files')
        .select('*')
        .eq('repository', repo)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Quality Supabase] Error fetching generated code files:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Quality Supabase] Exception fetching generated code files:', error);
      return [];
    }
  }

  /**
   * Record quality improvement in history
   */
  async recordImprovement(repo, changeType, changeDescription, qualityBefore, qualityAfter, filePath = null, metadata = {}) {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('quality_improvement_history')
        .insert({
          repository: repo,
          change_type: changeType,
          change_description: changeDescription,
          quality_before: qualityBefore,
          quality_after: qualityAfter,
          quality_improvement: qualityAfter - qualityBefore,
          file_path: filePath,
          metadata: metadata,
        })
        .select()
        .single();

      if (error) {
        console.error('[Quality Supabase] Error recording improvement:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Quality Supabase] Exception recording improvement:', error);
      return null;
    }
  }

  /**
   * Get improvement history for a repository
   */
  async getImprovementHistory(repo, limit = 50) {
    await this.initialize();
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('quality_improvement_history')
        .select('*')
        .eq('repository', repo)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Quality Supabase] Error fetching improvement history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Quality Supabase] Exception fetching improvement history:', error);
      return [];
    }
  }

  /**
   * Store repository quality snapshot
   */
  async storeQualitySnapshot(repo, qualityScore, percentile, averageFileScore, fileCount, qualityDistribution, factors, snapshotType = 'manual') {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('repository_quality_snapshots')
        .insert({
          repository: repo,
          quality_score: qualityScore,
          percentile: percentile,
          average_file_score: averageFileScore,
          file_count: fileCount,
          quality_distribution: qualityDistribution,
          factors: factors,
          recommendations_count: 0, // Would be calculated
          snapshot_type: snapshotType,
        })
        .select()
        .single();

      if (error) {
        console.error('[Quality Supabase] Error storing quality snapshot:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Quality Supabase] Exception storing quality snapshot:', error);
      return null;
    }
  }

  /**
   * Get quality snapshots for a repository (for tracking quality over time)
   */
  async getQualitySnapshots(repo, limit = 30) {
    await this.initialize();
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('repository_quality_snapshots')
        .select('*')
        .eq('repository', repo)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Quality Supabase] Error fetching quality snapshots:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Quality Supabase] Exception fetching quality snapshots:', error);
      return [];
    }
  }

  /**
   * Get quality trends for a repository
   */
  async getQualityTrends(repo, days = 30) {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('repository_quality_snapshots')
        .select('quality_score, average_file_score, created_at')
        .eq('repository', repo)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Quality Supabase] Error fetching quality trends:', error);
        return null;
      }

      return {
        repository: repo,
        period: `${days} days`,
        snapshots: data || [],
        trend: this.calculateTrend(data || []),
      };
    } catch (error) {
      console.error('[Quality Supabase] Exception fetching quality trends:', error);
      return null;
    }
  }

  /**
   * Calculate quality trend (improving, declining, stable)
   */
  calculateTrend(snapshots) {
    if (snapshots.length < 2) {
      return { direction: 'insufficient_data', change: 0 };
    }

    const first = snapshots[0].quality_score;
    const last = snapshots[snapshots.length - 1].quality_score;
    const change = last - first;

    return {
      direction: change > 0.05 ? 'improving' : change < -0.05 ? 'declining' : 'stable',
      change: change,
      changePercent: ((change / first) * 100).toFixed(1),
    };
  }

  /**
   * Helper: Get quality level from score
   */
  getQualityLevel(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }
}

module.exports = new QualitySupabaseIntegration();

