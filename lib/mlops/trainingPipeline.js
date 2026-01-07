/**
 * Combined Training Pipeline
 * Combines production predictions + GitHub code for ML training
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('TrainingPipeline');
const { getTrainingDataExtractor } = require('./trainingDataExtractor');
const { getFeedbackCollector } = require('./feedbackCollector');

class TrainingPipeline {
  constructor() {
    this.extractor = null;
    this.collector = null;
    this.initialized = false;
  }

  /**
   * Initialize pipeline
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.extractor = await getTrainingDataExtractor();
      this.collector = await getFeedbackCollector();
      this.initialized = true;
      log.info('✅ Training pipeline initialized');
    } catch (error) {
      log.error('Failed to initialize training pipeline:', error.message);
      throw error;
    }
  }

  /**
   * Build complete training dataset
   */
  async buildTrainingDataset(options = {}) {
    await this.initialize();

    const {
      productionLimit = 10000,
      githubLimit = 10000,
      minQuality = 0.5,
      validate = true
    } = options;

    log.info('🚀 Building training dataset...');

    // 1. Extract production data
    log.info('📊 Step 1: Extracting production predictions...');
    const productionResult = await this.extractor.extractFromPredictions({
      startDate: '2024-01-01',
      limit: productionLimit
    });

    const productionData = Array.isArray(productionResult)
      ? productionResult
      : (productionResult?.examples || productionResult?.dataset || []);

    log.info(`   ✅ Extracted ${productionData.length} production examples`);

    // 2. Load GitHub code
    log.info('📚 Step 2: Loading GitHub code from The Pantry...');
    const githubResult = await this.extractor.loadFromPantry({
      limit: githubLimit
    });

    const githubData = Array.isArray(githubResult)
      ? githubResult
      : (githubResult?.examples || githubResult?.dataset || []);

    log.info(`   ✅ Loaded ${githubData.length} GitHub code examples`);

    // 3. Combine datasets
    log.info('🔗 Step 3: Combining datasets...');
    const combinedResult = await this.extractor.buildCombinedTrainingSet({
      productionOptions: { limit: productionLimit },
      githubOptions: { limit: githubLimit }
    });

    // Handle different return formats - buildCombinedTrainingSet returns an object with dataset, train, val, test
    const combined = Array.isArray(combinedResult)
      ? combinedResult
      : (combinedResult?.dataset || combinedResult?.train || combinedResult?.examples || []);

    log.info(`   ✅ Combined dataset: ${combined.length} total examples`);

    // 4. Filter by quality
    if (minQuality > 0) {
      log.info(`🎯 Step 4: Filtering by quality (min: ${minQuality})...`);
      const filtered = combined.filter(example => {
        const quality = example.quality || 0;
        return quality >= minQuality;
      });

      log.info(`   ✅ Filtered to ${filtered.length} high-quality examples`);
      combined.length = 0;
      combined.push(...filtered);
    }

    // 5. Validate dataset
    if (validate) {
      log.info('✅ Step 5: Validating dataset...');
      const validation = this.validateDataset(combined);
      
      if (!validation.valid) {
        log.warn('⚠️  Dataset validation issues:');
        validation.issues.forEach(issue => log.warn(`   - ${issue}`));
      } else {
        log.info('   ✅ Dataset validation passed');
      }
    }

    // 6. Get statistics
    const stats = this.getDatasetStatistics(combined);

    log.info('📈 Dataset Statistics:');
    log.info(`   Total examples: ${stats.total}`);
    log.info(`   With labels: ${stats.withLabels} (${stats.labelRate}%)`);
    log.info(`   Average quality: ${stats.avgQuality.toFixed(2)}`);
    log.info(`   Production: ${stats.production}`);
    log.info(`   GitHub: ${stats.github}`);

    return {
      dataset: combined,
      statistics: stats,
      productionCount: productionData.length,
      githubCount: githubData.length
    };
  }

  /**
   * Validate dataset
   */
  validateDataset(dataset) {
    const issues = [];
    
    if (dataset.length === 0) {
      issues.push('Dataset is empty');
    }

    const withLabels = dataset.filter(ex => ex.actualValue !== null && ex.actualValue !== undefined);
    if (withLabels.length === 0) {
      issues.push('No examples with labels (actual values)');
    }

    const withFeatures = dataset.filter(ex => ex.features && Object.keys(ex.features).length > 0);
    if (withFeatures.length === 0) {
      issues.push('No examples with features');
    }

    // Check for NaN or invalid values
    const invalid = dataset.filter(ex => {
      if (ex.actualValue !== null && (isNaN(ex.actualValue) || ex.actualValue < 0 || ex.actualValue > 1)) {
        return true;
      }
      if (ex.predictedValue !== null && (isNaN(ex.predictedValue) || ex.predictedValue < 0 || ex.predictedValue > 1)) {
        return true;
      }
      return false;
    });

    if (invalid.length > 0) {
      issues.push(`${invalid.length} examples with invalid values`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get dataset statistics
   */
  getDatasetStatistics(dataset) {
    const withLabels = dataset.filter(ex => ex.actualValue !== null && ex.actualValue !== undefined);
    const production = dataset.filter(ex => ex.source === 'production');
    const github = dataset.filter(ex => ex.source === 'github');
    
    const qualities = dataset.map(ex => ex.quality || 0).filter(q => q > 0);
    const avgQuality = qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 0;

    return {
      total: dataset.length,
      withLabels: withLabels.length,
      labelRate: dataset.length > 0 ? ((withLabels.length / dataset.length) * 100).toFixed(1) : '0.0',
      avgQuality,
      production: production.length,
      github: github.length
    };
  }

  /**
   * Export dataset for training
   */
  async exportDataset(dataset, format = 'json', outputPath = null) {
    const fs = require('fs').promises;
    const path = require('path');

    if (!outputPath) {
      const dataDir = path.join(__dirname, '../../.beast-mode/data');
      await fs.mkdir(dataDir, { recursive: true });
      outputPath = path.join(dataDir, `training-dataset-${Date.now()}.${format}`);
    }

    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(dataset, null, 2));
      log.info(`✅ Exported dataset to ${outputPath}`);
    } else if (format === 'csv') {
      // Simple CSV export
      const headers = ['predictedValue', 'actualValue', 'quality', 'source', 'serviceName', 'predictionType'];
      const rows = dataset.map(ex => [
        ex.predictedValue || '',
        ex.actualValue || '',
        ex.quality || 0,
        ex.source || '',
        ex.serviceName || '',
        ex.predictionType || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      await fs.writeFile(outputPath, csv);
      log.info(`✅ Exported dataset to ${outputPath}`);
    }

    return outputPath;
  }

  /**
   * Get feedback collection status
   */
  async getFeedbackStatus() {
    await this.initialize();

    if (!this.collector) {
      return { available: false, message: 'Feedback collector not available' };
    }

    const stats = await this.collector.getFeedbackStats();
    return {
      available: true,
      stats
    };
  }
}

// Singleton instance
let instance = null;

async function getTrainingPipeline() {
  if (!instance) {
    instance = new TrainingPipeline();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  TrainingPipeline,
  getTrainingPipeline
};

