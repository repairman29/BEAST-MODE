#!/usr/bin/env node

/**
 * Roadmap Batch Executor
 * 
 * Executes roadmap tasks in safe batches with intelligent scheduling
 * Prevents server overload with adaptive concurrency
 */

const { ParallelRoadmapExecutor, TaskFactory } = require('./parallel-roadmap-executor');
const { RoadmapTracker } = require('./roadmap-tracker');
const fs = require('fs');
const path = require('path');

class BatchExecutor {
  constructor() {
    this.executor = new ParallelRoadmapExecutor({
      maxConcurrency: 2, // Start conservative
      rateLimit: 5, // 5 requests per second
      timeout: 60000, // 60s per task
      retryAttempts: 2,
      retryDelay: 3000
    });
    this.tracker = new RoadmapTracker();
    this.batchConfig = this.loadBatchConfig();
  }

  loadBatchConfig() {
    const configPath = path.join(__dirname, '../docs/BATCH_CONFIG.json');
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load batch config:', error.message);
    }

    // Default safe configuration
    return {
      batches: [
        {
          name: 'Month 1 - Week 1 - Monitoring',
          tasks: ['monitoring', 'dashboard'],
          maxConcurrency: 2,
          rateLimit: 5
        },
        {
          name: 'Month 1 - Week 2 - Cache',
          tasks: ['cache'],
          maxConcurrency: 1,
          rateLimit: 3
        }
      ],
      delays: {
        betweenBatches: 5000, // 5s between batches
        betweenTasks: 1000 // 1s between tasks
      }
    };
  }

  /**
   * Execute a single batch
   */
  async executeBatch(batch) {
    console.log(`\n📦 Executing Batch: ${batch.name}`);
    console.log('═'.repeat(60));

    // Configure executor for this batch
    this.executor.options.maxConcurrency = batch.maxConcurrency || 2;
    this.executor.options.rateLimit = batch.rateLimit || 5;

    // Add tasks
    batch.tasks.forEach(taskName => {
      const taskMap = {
        'monitoring': TaskFactory.createFixMonitoringTask,
        'dashboard': TaskFactory.createDashboardTask,
        'cache': TaskFactory.createCacheOptimizationTask
      };

      const factory = taskMap[taskName];
      if (factory) {
        this.executor.addTask(factory());
      } else {
        console.warn(`⚠️  Unknown task: ${taskName}`);
      }
    });

    // Execute batch
    await this.executor.run();

    // Wait between batches
    if (this.batchConfig.delays?.betweenBatches) {
      console.log(`\n⏳ Waiting ${this.batchConfig.delays.betweenBatches}ms before next batch...`);
      await this.sleep(this.batchConfig.delays.betweenBatches);
    }
  }

  /**
   * Execute all batches
   */
  async executeAllBatches() {
    console.log('🚀 Starting Batch Execution');
    console.log(`📋 ${this.batchConfig.batches.length} batches to execute\n`);

    for (const batch of this.batchConfig.batches) {
      try {
        await this.executeBatch(batch);
      } catch (error) {
        console.error(`❌ Batch failed: ${batch.name}`, error.message);
        // Continue with next batch
      }
    }

    console.log('\n✅ All batches completed!');
    this.tracker.printStatus();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
if (require.main === module) {
  const batchExecutor = new BatchExecutor();
  
  const args = process.argv.slice(2);
  if (args[0] === 'all') {
    batchExecutor.executeAllBatches().catch(error => {
      console.error('Batch execution failed:', error);
      process.exit(1);
    });
  } else {
    console.log('Usage: node roadmap-batch-executor.js all');
    console.log('\nExecutes all batches from BATCH_CONFIG.json');
  }
}

module.exports = { BatchExecutor };
