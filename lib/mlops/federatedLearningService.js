/**
 * Federated Learning Service with Database Integration
 * Uses new federated learning tables for nodes, updates, aggregations, and metrics
 * 
 * Dog Fooding: Built using BEAST MODE
 */

const { createLogger } = require('../utils/logger');
const { getDatabaseWriter } = require('./databaseWriter');
const crypto = require('crypto');

const logger = createLogger('FederatedLearningService');

class FederatedLearningService {
  constructor() {
    this.databaseWriter = null;
    this.nodes = new Map(); // In-memory node registry
    this.currentRound = 0;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.initialized = true;
      logger.info('✅ Federated learning service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize federated learning service:', error);
      return false;
    }
  }

  /**
   * Register a federated node
   */
  async registerNode(config) {
    if (!this.initialized) await this.initialize();

    const {
      nodeId,
      nodeName,
      nodeType,
      endpointUrl,
      publicKey
    } = config;

    try {
      // Check if node exists
      const existing = await this.databaseWriter.read({
        table: 'federated_nodes',
        filter: { node_id: nodeId }
      });

      if (existing && existing.length > 0) {
        // Update existing node
        const result = await this.databaseWriter.update({
          table: 'federated_nodes',
          filter: { id: existing[0].id },
          data: {
            last_seen_at: new Date().toISOString(),
            is_active: true,
            endpoint_url: endpointUrl,
            public_key: publicKey
          }
        });
        this.nodes.set(nodeId, result);
        return { success: true, id: existing[0].id, node: result };
      }

      // Create new node
      const result = await this.databaseWriter.write({
        table: 'federated_nodes',
        data: {
          node_id: nodeId,
          node_name: nodeName,
          node_type: nodeType || 'client',
          endpoint_url: endpointUrl,
          public_key: publicKey,
          is_active: true,
          last_seen_at: new Date().toISOString()
        }
      });

      this.nodes.set(nodeId, result);
      logger.info(`Registered federated node: ${nodeName} (${nodeId})`);
      return { success: true, id: result.id, node: result };
    } catch (error) {
      logger.error('Failed to register node:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit federated update from a node
   */
  async submitUpdate(nodeId, roundNumber, updateData, sampleCount) {
    if (!this.initialized) await this.initialize();

    try {
      // Verify node exists
      const node = await this.databaseWriter.read({
        table: 'federated_nodes',
        filter: { node_id: nodeId, is_active: true }
      });

      if (!node || node.length === 0) {
        throw new Error('Node not found or inactive');
      }

      // Hash update data
      const updateHash = this.hashUpdate(updateData);

      // Create update record
      const result = await this.databaseWriter.write({
        table: 'federated_updates',
        data: {
          node_id: nodeId,
          round_number: roundNumber,
          model_version: updateData.modelVersion || 'latest',
          update_data: updateData,
          update_hash: updateHash,
          sample_count: sampleCount,
          status: 'received'
        }
      });

      logger.info(`Received update from node ${nodeId} for round ${roundNumber}`);
      return { success: true, id: result.id, update: result };
    } catch (error) {
      logger.error('Failed to submit update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Aggregate federated updates
   */
  async aggregateUpdates(roundNumber, aggregationMethod = 'fedavg') {
    if (!this.initialized) await this.initialize();

    try {
      // Get all updates for this round
      const updates = await this.databaseWriter.read({
        table: 'federated_updates',
        filter: {
          round_number: roundNumber,
          status: 'received'
        }
      });

      if (!updates || updates.length === 0) {
        throw new Error('No updates found for this round');
      }

      // Perform aggregation based on method
      const aggregatedModel = await this.performAggregation(updates, aggregationMethod);
      const aggregatedHash = this.hashUpdate(aggregatedModel);

      // Calculate total samples
      const totalSamples = updates.reduce((sum, u) => sum + (u.sample_count || 0), 0);

      // Create aggregation record
      const result = await this.databaseWriter.write({
        table: 'federated_aggregations',
        data: {
          round_number: roundNumber,
          aggregation_method: aggregationMethod,
          participating_nodes: updates.map(u => u.node_id),
          update_ids: updates.map(u => u.id),
          aggregated_model: aggregatedModel,
          aggregation_hash: aggregatedHash,
          total_samples: totalSamples
        }
      });

      // Mark updates as aggregated
      for (const update of updates) {
        await this.databaseWriter.update({
          table: 'federated_updates',
          filter: { id: update.id },
          data: {
            status: 'aggregated',
            aggregated_at: new Date().toISOString()
          }
        });
      }

      logger.info(`Aggregated ${updates.length} updates for round ${roundNumber}`);
      return {
        success: true,
        id: result.id,
        aggregatedModel,
        totalSamples,
        participatingNodes: updates.length
      };
    } catch (error) {
      logger.error('Failed to aggregate updates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform aggregation (placeholder - would use actual aggregation algorithm)
   */
  async performAggregation(updates, method) {
    // Placeholder implementation
    // In production, would implement FedAvg, FedProx, SCAFFOLD, etc.
    switch (method) {
      case 'fedavg':
        return this.fedAvg(updates);
      case 'fedprox':
        return this.fedProx(updates);
      case 'scaffold':
        return this.scaffold(updates);
      case 'feddyn':
        return this.fedDyn(updates);
      default:
        return this.fedAvg(updates);
    }
  }

  /**
   * Federated Averaging (FedAvg)
   */
  fedAvg(updates) {
    // Placeholder - would average model weights weighted by sample count
    const totalSamples = updates.reduce((sum, u) => sum + (u.sample_count || 1), 0);
    return {
      method: 'fedavg',
      totalSamples,
      aggregatedWeights: {} // Would contain actual averaged weights
    };
  }

  /**
   * FedProx aggregation
   */
  fedProx(updates) {
    // Placeholder - would add proximal term
    return this.fedAvg(updates);
  }

  /**
   * SCAFFOLD aggregation
   */
  scaffold(updates) {
    // Placeholder - would use control variates
    return this.fedAvg(updates);
  }

  /**
   * FedDyn aggregation
   */
  fedDyn(updates) {
    // Placeholder - would use dynamic regularization
    return this.fedAvg(updates);
  }

  /**
   * Record federated metrics
   */
  async recordMetrics(roundNumber, nodeId, metrics) {
    if (!this.initialized) await this.initialize();

    try {
      for (const [metricName, metricValue] of Object.entries(metrics)) {
        await this.databaseWriter.write({
          table: 'federated_metrics',
          data: {
            round_number: roundNumber,
            node_id: nodeId,
            metric_name: metricName,
            metric_value: metricValue
          }
        });
      }
      return { success: true };
    } catch (error) {
      logger.warn('Failed to record metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hash update data
   */
  hashUpdate(data) {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Start new federated learning round
   */
  async startRound() {
    this.currentRound++;
    logger.info(`Starting federated learning round ${this.currentRound}`);
    return { success: true, roundNumber: this.currentRound };
  }

  /**
   * Get active nodes
   */
  async getActiveNodes() {
    if (!this.initialized) await this.initialize();

    try {
      const nodes = await this.databaseWriter.read({
        table: 'federated_nodes',
        filter: { is_active: true }
      });
      return { success: true, nodes: nodes || [] };
    } catch (error) {
      logger.error('Failed to get active nodes:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let instance = null;

function getFederatedLearningService() {
  if (!instance) {
    instance = new FederatedLearningService();
  }
  return instance;
}

module.exports = {
  FederatedLearningService,
  getFederatedLearningService
};
