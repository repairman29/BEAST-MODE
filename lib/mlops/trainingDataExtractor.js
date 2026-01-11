/**
 * Training Data Extractor
 * Extracts training examples from production ML predictions and GitHub code
 * 
 * Provides honest assessments of data quality and training potential
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const log = createLogger('TrainingDataExtractor');

class TrainingDataExtractor {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    this.assessment = {
      productionData: {
        totalPredictions: 0,
        withActuals: 0,
        usableExamples: 0,
        qualityScore: 0,
        issues: []
      },
      githubCode: {
        totalFiles: 0,
        processedFiles: 0,
        usableExamples: 0,
        qualityScore: 0,
        issues: []
      },
      combined: {
        totalExamples: 0,
        trainSplit: 0,
        valSplit: 0,
        testSplit: 0,
        qualityScore: 0,
        issues: []
      }
    };
  }

  /**
   * Initialize Supabase connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load .env.local from website directory (same as other scripts)
      const path = require('path');
      const fs = require('fs');
      
      try {
        const envPath = path.join(__dirname, '../../website/.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          envContent.split('\n').forEach(line => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              const value = match[2].trim().replace(/^["']|["']$/g, '');
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          });
          log.debug('✅ Loaded .env.local from website directory');
        }
      } catch (error) {
        log.debug('Could not load .env.local:', error.message);
      }

      // Also try root .env file
      try {
        require('dotenv').config();
      } catch (error) {
        // dotenv not available, continue
      }

      // Try unified Supabase first
      const unifiedSupabasePath = path.join(__dirname, '../../../shared-utils/unified-supabase');
      
      let supabaseClient = null;
      try {
        const { getUnifiedSupabase } = require(unifiedSupabasePath);
        supabaseClient = await getUnifiedSupabase();
        if (supabaseClient && supabaseClient.getService) {
          supabaseClient = supabaseClient.getService();
        }
      } catch (error) {
        log.debug('Unified Supabase not available, trying direct connection');
      }

      // Fallback to direct Supabase client
      if (!supabaseClient) {
        const { createClient } = require('@supabase/supabase-js');
        
        const supabaseUrl = process.env.SUPABASE_URL || 
                           process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.SUPABASE_ANON_KEY ||
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          log.warn('⚠️  Supabase credentials not found');
          log.warn('   Checked: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL');
          log.warn('   Checked: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY');
          log.warn('   Checked: website/.env.local');
          log.warn('   Production data extraction will be unavailable');
          // Don't throw - allow GitHub code extraction to work
          this.supabase = null;
          this.initialized = true;
          return;
        }

        supabaseClient = createClient(supabaseUrl, supabaseKey);
        log.debug(`✅ Connected to Supabase: ${supabaseUrl.substring(0, 30)}...`);
      }

      this.supabase = supabaseClient;
      this.initialized = true;
      log.info('✅ Training data extractor initialized');
    } catch (error) {
      log.error('Failed to initialize Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Extract training examples from production predictions
   * HONEST ASSESSMENT: Only predictions with actual values are usable
   */
  async extractFromPredictions(options = {}) {
    if (!this.initialized) await this.initialize();

    // HONEST: Check if Supabase is available
    if (!this.supabase) {
      const error = new Error('Supabase not configured - cannot extract production data');
      this.assessment.productionData.issues.push('Supabase credentials not found');
      log.warn('⚠️  ' + error.message);
      return {
        examples: [],
        assessment: this.assessment.productionData
      };
    }

    const {
      startDate = '2024-01-01',
      endDate = new Date().toISOString(),
      limit = 100000,
      serviceName = null,
      predictionType = null,
      minConfidence = 0.0
    } = options;

    log.info('📊 Extracting training data from production predictions...');
    log.info(`   Date range: ${startDate} to ${endDate}`);
    log.info(`   Limit: ${limit}`);

    try {
      // First, get total count for assessment
      let countQuery = this.supabase
        .from('ml_predictions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (serviceName) countQuery = countQuery.eq('service_name', serviceName);
      if (predictionType) countQuery = countQuery.eq('prediction_type', predictionType);

      const { count: totalCount } = await countQuery;
      this.assessment.productionData.totalPredictions = totalCount || 0;

      // Get predictions with actual values (usable for training)
      let query = this.supabase
        .from('ml_predictions')
        .select('*')
        .not('actual_value', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .gte('confidence', minConfidence)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (serviceName) query = query.eq('service_name', serviceName);
      if (predictionType) query = query.eq('prediction_type', predictionType);

      const { data: predictions, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch predictions: ${error.message}`);
      }

      const withActuals = predictions?.length || 0;
      this.assessment.productionData.withActuals = withActuals;

      // HONEST ASSESSMENT: Calculate usable examples
      const usableExamples = this.filterUsableExamples(predictions || []);
      this.assessment.productionData.usableExamples = usableExamples.length;

      // Calculate quality score (0-1)
      const qualityScore = this.calculateProductionQualityScore(
        totalCount || 0,
        withActuals,
        usableExamples.length
      );
      this.assessment.productionData.qualityScore = qualityScore;

      log.info(`📈 Assessment:`);
      log.info(`   Total predictions: ${totalCount || 0}`);
      log.info(`   With actual values: ${withActuals}`);
      log.info(`   Usable examples: ${usableExamples.length}`);
      log.info(`   Quality score: ${(qualityScore * 100).toFixed(1)}%`);

      // Identify issues
      this.assessProductionDataIssues(totalCount || 0, withActuals, usableExamples.length);

      // Convert to training examples
      const trainingExamples = usableExamples.map(pred => ({
        features: this.extractFeatures(pred),
        label: pred.actual_value,
        actualValue: pred.actual_value, // Also include camelCase for compatibility
        predictedValue: pred.predicted_value, // Also include camelCase
        predicted: pred.predicted_value,
        error: pred.error || Math.abs(pred.predicted_value - pred.actual_value),
        service: pred.service_name,
        serviceName: pred.service_name, // Also include camelCase
        type: pred.prediction_type,
        predictionType: pred.prediction_type, // Also include camelCase
        confidence: pred.confidence,
        context: pred.context,
        timestamp: pred.created_at,
        source: 'production' // Mark as production data
      }));

      log.info(`✅ Extracted ${trainingExamples.length} training examples`);
      
      return {
        examples: trainingExamples,
        assessment: this.assessment.productionData
      };
    } catch (error) {
      log.error('Failed to extract from predictions:', error.message);
      this.assessment.productionData.issues.push(`Extraction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Filter predictions to only usable examples
   * HONEST: Some predictions may have invalid data
   */
  filterUsableExamples(predictions) {
    return predictions.filter(pred => {
      // Must have actual value
      if (pred.actual_value === null || pred.actual_value === undefined) {
        return false;
      }

      // Must have predicted value
      if (pred.predicted_value === null || pred.predicted_value === undefined) {
        return false;
      }

      // Must have valid numeric values
      if (isNaN(pred.actual_value) || isNaN(pred.predicted_value)) {
        return false;
      }

      // Must have context (for feature extraction)
      if (!pred.context || typeof pred.context !== 'object') {
        return false;
      }

      return true;
    });
  }

  /**
   * Extract features from prediction context
   */
  extractFeatures(prediction) {
    const context = prediction.context || {};
    
    return {
      // Code metrics (if available)
      codeComplexity: context.code_metrics?.complexity || 0,
      testCoverage: context.code_metrics?.coverage || 0,
      codeQuality: context.code_metrics?.quality || 0,
      security: context.code_metrics?.security || 0,
      performance: context.code_metrics?.performance || 0,
      maintainability: context.code_metrics?.maintainability || 0,

      // Query/code length
      queryLength: context.query?.length || context.code?.length || 0,
      codeLength: context.code?.length || 0,

      // Historical metrics
      previousAccuracy: context.historical?.accuracy || 0,
      previousSuccess: context.historical?.success_rate || 0,

      // Service-specific
      serviceName: prediction.service_name,
      predictionType: prediction.prediction_type,
      
      // Confidence
      confidence: prediction.confidence || 0,

      // Embeddings (if available - will be null if not present)
      codeEmbedding: context.embeddings?.code || null,
      queryEmbedding: context.embeddings?.query || null
    };
  }

  /**
   * Calculate quality score for production data
   * HONEST: Low percentage of usable data = lower score
   */
  calculateProductionQualityScore(total, withActuals, usable) {
    if (total === 0) return 0;

    // Score based on percentage with actuals
    const actualsRatio = withActuals / total;
    
    // Score based on percentage usable
    const usableRatio = withActuals > 0 ? usable / withActuals : 0;

    // Combined score (weighted)
    return (actualsRatio * 0.6) + (usableRatio * 0.4);
  }

  /**
   * Assess production data issues
   */
  assessProductionDataIssues(total, withActuals, usable) {
    this.assessment.productionData.issues = [];

    if (total === 0) {
      this.assessment.productionData.issues.push('No predictions found in database');
      return;
    }

    const actualsPercentage = (withActuals / total) * 100;
    if (actualsPercentage < 10) {
      this.assessment.productionData.issues.push(
        `Only ${actualsPercentage.toFixed(1)}% of predictions have actual values (need feedback loop)`
      );
    }

    if (withActuals > 0) {
      const usablePercentage = (usable / withActuals) * 100;
      if (usablePercentage < 80) {
        this.assessment.productionData.issues.push(
          `Only ${usablePercentage.toFixed(1)}% of predictions with actuals are usable (data quality issues)`
        );
      }
    }

    if (usable < 1000) {
      this.assessment.productionData.issues.push(
        `Only ${usable} usable examples (need at least 1000 for meaningful training)`
      );
    }
  }

  /**
   * Load GitHub code from The Pantry catalog
   * HONEST: This requires the catalog file to exist
   */
  async loadFromPantry(options = {}) {
    const fs = require('fs').promises;
    const path = require('path');

    const {
      catalogPath = path.join(__dirname, '../../../payload-cli/docs/repo-catalog/COMPLETE_CATALOG_FIXED.json'),
      limit = 10000
    } = options;

    log.info('📚 Loading GitHub code from The Pantry...');
    log.info(`   Catalog path: ${catalogPath}`);

    try {
      // Check if catalog exists
      try {
        await fs.access(catalogPath);
      } catch (error) {
        this.assessment.githubCode.issues.push(`Catalog file not found: ${catalogPath}`);
        log.warn(`⚠️  Catalog file not found: ${catalogPath}`);
        return {
          examples: [],
          assessment: this.assessment.githubCode
        };
      }

      // Load catalog
      const catalogContent = await fs.readFile(catalogPath, 'utf8');
      const catalog = JSON.parse(catalogContent);

      const repos = catalog.repos || [];
      const totalFiles = catalog.summary?.totalFiles || 0;
      this.assessment.githubCode.totalFiles = totalFiles;

      log.info(`   Found ${repos.length} repos, ${totalFiles} total files`);

      // Extract code examples
      const codeExamples = [];
      let processedFiles = 0;

      // Strategy 1: Use capabilityData if available (from loadout.json)
      for (const repo of repos.slice(0, limit)) {
        if (repo.capabilityData && repo.capabilityData.length > 0) {
          for (const capability of repo.capabilityData) {
            if (codeExamples.length >= limit) break;

            // Check for code_snippet or try to get from path
            if (capability.code_snippet && capability.code_snippet.length > 50) {
              codeExamples.push({
                code: capability.code_snippet,
                name: capability.name,
                kind: capability.kind,
                language: capability.language || 'unknown',
                repo: repo.name,
                file: capability.file || capability.path || 'unknown',
                line: capability.line || 0
              });
              processedFiles++;
            } else if (capability.path) {
              // Try to read file from path if code_snippet not available
              try {
                const fsSync = require('fs');
                if (fsSync.existsSync(capability.path)) {
                  const code = fsSync.readFileSync(capability.path, 'utf8');
                  if (code.length > 50) {
                    codeExamples.push({
                      code: code.substring(0, 2000), // Limit size
                      name: capability.name,
                      kind: capability.kind || 'unknown',
                      language: capability.language || path.extname(capability.path).slice(1) || 'unknown',
                      repo: repo.name,
                      file: capability.path,
                      line: capability.line || 0
                    });
                    processedFiles++;
                  }
                }
              } catch (error) {
                // Skip if can't read
              }
            }
          }
        }

        if (codeExamples.length >= limit) break;
      }
      
      // Strategy 1.5: Check for TOP_REPOS_WITH_CODE.json (new scan results)
      if (codeExamples.length === 0) {
        try {
          const topReposPath = path.join(__dirname, '../../../payload-cli/docs/repo-catalog/TOP_REPOS_WITH_CODE.json');
          if (fsSync.existsSync(topReposPath)) {
            log.info('   Found TOP_REPOS_WITH_CODE.json, loading...');
            const topReposData = JSON.parse(fsSync.readFileSync(topReposPath, 'utf8'));
            
            for (const repo of (topReposData.repos || []).slice(0, Math.min(limit / 100, 10))) {
              if (repo.capabilityData && repo.capabilityData.length > 0) {
                for (const capability of repo.capabilityData.slice(0, 100)) {
                  if (codeExamples.length >= limit) break;
                  
                  // Try to read code from path
                  if (capability.path) {
                    try {
                      // Path might be relative to repo, try to resolve
                      let codePath = capability.path;
                      if (!fsSync.existsSync(codePath) && repo.repo) {
                        // Try to find in cloned repo location
                        const repoName = repo.repo.split('/')[1];
                        const possiblePaths = [
                          path.join(__dirname, '../../../', repoName, capability.path),
                          path.join(process.cwd(), repoName, capability.path)
                        ];
                        for (const possiblePath of possiblePaths) {
                          if (fsSync.existsSync(possiblePath)) {
                            codePath = possiblePath;
                            break;
                          }
                        }
                      }
                      
                      if (fsSync.existsSync(codePath)) {
                        const code = fsSync.readFileSync(codePath, 'utf8');
                        if (code.length > 50) {
                          codeExamples.push({
                            code: code.substring(0, 2000),
                            name: capability.name,
                            kind: capability.kind || 'unknown',
                            language: capability.tags?.[0] || path.extname(codePath).slice(1) || 'unknown',
                            repo: repo.repo || repo.name,
                            file: codePath,
                            line: 0
                          });
                          processedFiles++;
                        }
                      }
                    } catch (error) {
                      // Skip if can't read
                    }
                  }
                }
              }
              
              if (codeExamples.length >= limit) break;
            }
            
            if (codeExamples.length > 0) {
              log.info(`   ✅ Loaded ${codeExamples.length} examples from TOP_REPOS_WITH_CODE.json`);
            }
          }
        } catch (error) {
          log.debug('   Could not load TOP_REPOS_WITH_CODE.json:', error.message);
        }
      }

      // Strategy 2: If no capabilityData, try to read files from details array
      if (codeExamples.length === 0 && processedFiles === 0) {
        log.info('   No capabilityData found, trying to read files from details...');
        
        for (const repo of repos.slice(0, Math.min(limit / 100, 10))) { // Limit repos to avoid too many files
          if (!repo.details || repo.details.length === 0) continue;

          for (const detail of repo.details.slice(0, 50)) { // Limit files per repo
            if (codeExamples.length >= limit) break;

            if (detail.file && detail.extracted && detail.type) {
              try {
                // Try to read file (may be temp path from scan)
                let filePath = detail.file;
                
                // If temp path, try to find in actual repo
                if (filePath.includes('/tmp/') || filePath.includes('echeo-scan-')) {
                  // Skip temp files - would need to re-clone repos
                  continue;
                }

                // Try to read if it's a real path
                if (fs.existsSync(filePath)) {
                  const code = await fs.readFile(filePath, 'utf8');
                  if (code.length > 50) {
                    codeExamples.push({
                      code: code.substring(0, 2000), // Limit code size
                      name: path.basename(filePath),
                      kind: 'file',
                      language: detail.type,
                      repo: repo.name,
                      file: filePath,
                      line: 0
                    });
                    processedFiles++;
                  }
                }
              } catch (error) {
                // File doesn't exist or can't read - skip
                continue;
              }
            }
          }

          if (codeExamples.length >= limit) break;
        }

        if (codeExamples.length > 0) {
          log.info(`   ✅ Read ${codeExamples.length} files from disk`);
        } else {
          log.warn('   ⚠️  Could not read files - paths may be from temp scan');
          log.warn('   💡 Recommendation: Re-scan repos without --skip-embeddings to get loadout.json');
        }
      }

      this.assessment.githubCode.processedFiles = processedFiles;
      this.assessment.githubCode.usableExamples = codeExamples.length;

      // Calculate quality score
      const qualityScore = this.calculateGithubQualityScore(
        totalFiles,
        processedFiles,
        codeExamples.length
      );
      this.assessment.githubCode.qualityScore = qualityScore;

      log.info(`📈 Assessment:`);
      log.info(`   Total files: ${totalFiles}`);
      log.info(`   Processed files: ${processedFiles}`);
      log.info(`   Usable examples: ${codeExamples.length}`);
      log.info(`   Quality score: ${(qualityScore * 100).toFixed(1)}%`);

      // Assess issues
      this.assessGithubDataIssues(totalFiles, processedFiles, codeExamples.length);

      log.info(`✅ Loaded ${codeExamples.length} code examples from GitHub`);

      return {
        examples: codeExamples,
        assessment: this.assessment.githubCode
      };
    } catch (error) {
      log.error('Failed to load from Pantry:', error.message);
      this.assessment.githubCode.issues.push(`Loading failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate quality score for GitHub data
   */
  calculateGithubQualityScore(total, processed, usable) {
    if (total === 0) return 0;

    const processedRatio = processed / total;
    const usableRatio = processed > 0 ? usable / processed : 0;

    return (processedRatio * 0.5) + (usableRatio * 0.5);
  }

  /**
   * Assess GitHub data issues
   */
  assessGithubDataIssues(total, processed, usable) {
    this.assessment.githubCode.issues = [];

    if (total === 0) {
      this.assessment.githubCode.issues.push('No files found in catalog');
      return;
    }

    if (processed < total * 0.1) {
      this.assessment.githubCode.issues.push(
        `Only processed ${processed} of ${total} files (${((processed/total)*100).toFixed(1)}%)`
      );
    }

    if (usable < 1000) {
      this.assessment.githubCode.issues.push(
        `Only ${usable} usable code examples (need more for training)`
      );
    }
  }

  /**
   * Combine production and GitHub data
   * HONEST: Shows what's actually usable
   */
  async buildCombinedTrainingSet(options = {}) {
    const {
      productionOptions = {},
      githubOptions = {},
      trainSplit = 0.8,
      valSplit = 0.1,
      testSplit = 0.1
    } = options;

    log.info('🔗 Building combined training dataset...');

    // Extract from both sources
    const [productionResult, githubResult] = await Promise.all([
      this.extractFromPredictions(productionOptions).catch(err => {
        log.warn('Production extraction failed:', err.message);
        return { examples: [], assessment: { issues: [err.message] } };
      }),
      this.loadFromPantry(githubOptions).catch(err => {
        log.warn('GitHub loading failed:', err.message);
        return { examples: [], assessment: { issues: [err.message] } };
      })
    ]);

    const productionExamples = productionResult.examples || [];
    const githubExamples = githubResult.examples || [];

    // Combine (production data is primary, GitHub is supplementary)
    const combined = [...productionExamples];
    
    // Add GitHub examples as code quality training data
    // (These need labels - we'll use heuristics or predictions)
    const githubWithLabels = githubExamples.map(example => ({
      features: {
        codeLength: example.code.length,
        language: example.language,
        kind: example.kind,
        repo: example.repo
      },
      label: null, // Will need to be labeled separately
      code: example.code,
      metadata: {
        source: 'github',
        name: example.name,
        file: example.file,
        line: example.line
      }
    }));

    const total = combined.length;
    const trainCount = Math.floor(total * trainSplit);
    const valCount = Math.floor(total * valSplit);
    const testCount = total - trainCount - valCount;

    this.assessment.combined = {
      totalExamples: total,
      trainSplit: trainCount,
      valSplit: valCount,
      testSplit: testCount,
      productionExamples: productionExamples.length,
      githubExamples: githubExamples.length,
      qualityScore: this.calculateCombinedQualityScore(
        productionResult.assessment,
        githubResult.assessment
      ),
      issues: [
        ...(productionResult.assessment.issues || []),
        ...(githubResult.assessment.issues || [])
      ]
    };

    log.info(`📊 Combined Dataset:`);
    log.info(`   Total examples: ${total}`);
    log.info(`   Train: ${trainCount} (${(trainSplit*100).toFixed(0)}%)`);
    log.info(`   Val: ${valCount} (${(valSplit*100).toFixed(0)}%)`);
    log.info(`   Test: ${testCount} (${(testSplit*100).toFixed(0)}%)`);
    log.info(`   Quality score: ${(this.assessment.combined.qualityScore * 100).toFixed(1)}%`);

    if (this.assessment.combined.issues.length > 0) {
      log.warn(`⚠️  Issues found:`);
      this.assessment.combined.issues.forEach(issue => log.warn(`   - ${issue}`));
    }

    return {
      train: combined.slice(0, trainCount),
      val: combined.slice(trainCount, trainCount + valCount),
      test: combined.slice(trainCount + valCount),
      github: githubWithLabels,
      assessment: this.assessment.combined
    };
  }

  /**
   * Calculate combined quality score
   */
  calculateCombinedQualityScore(productionAssessment, githubAssessment) {
    const prodScore = productionAssessment.qualityScore || 0;
    const githubScore = githubAssessment.qualityScore || 0;

    // Production data is more important (70% weight)
    return (prodScore * 0.7) + (githubScore * 0.3);
  }

  /**
   * Get full assessment report
   */
  getAssessmentReport() {
    return {
      timestamp: new Date().toISOString(),
      production: this.assessment.productionData,
      github: this.assessment.githubCode,
      combined: this.assessment.combined,
      summary: {
        productionUsable: this.assessment.productionData.usableExamples,
        githubUsable: this.assessment.githubCode.usableExamples,
        totalUsable: this.assessment.combined.totalExamples,
        overallQuality: this.assessment.combined.qualityScore,
        readyForTraining: this.assessment.combined.totalExamples >= 1000
      }
    };
  }
}

// Singleton instance
let instance = null;

async function getTrainingDataExtractor() {
  if (!instance) {
    instance = new TrainingDataExtractor();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  TrainingDataExtractor,
  getTrainingDataExtractor
};

