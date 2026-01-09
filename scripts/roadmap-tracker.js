#!/usr/bin/env node

/**
 * BEAST MODE ML/LLM Roadmap Tracker
 * 
 * Tracks progress on 12-month roadmap
 * Uses BEAST MODE to analyze and report progress
 */

const fs = require('fs');
const path = require('path');

const ROADMAP_FILE = path.join(__dirname, '../docs/ML_LLM_12_MONTH_ROADMAP.md');
const TRACKER_FILE = path.join(__dirname, '../docs/ROADMAP_PROGRESS.json');

class RoadmapTracker {
  constructor() {
    this.progress = this.loadProgress();
  }

  loadProgress() {
    try {
      if (fs.existsSync(TRACKER_FILE)) {
        return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load progress file:', error.message);
    }

    // Initialize default progress
    return {
      currentMonth: 1,
      currentWeek: 1,
      tasks: {},
      metrics: {
        cacheHitRate: 15, // Baseline
        latency: 500, // Baseline (ms)
        selectionAccuracy: 85, // Baseline (%)
        costSavings: 97, // Baseline (%)
        errorRate: 5 // Baseline (%)
      },
      dogFooding: {
        improvementsGenerated: 0,
        testsGenerated: 0,
        optimizationsGenerated: 0,
        docsGenerated: 0
      },
      lastUpdated: new Date().toISOString()
    };
  }

  saveProgress() {
    try {
      this.progress.lastUpdated = new Date().toISOString();
      fs.writeFileSync(TRACKER_FILE, JSON.stringify(this.progress, null, 2));
      console.log('✅ Progress saved');
    } catch (error) {
      console.error('Failed to save progress:', error.message);
    }
  }

  markTaskComplete(month, week, taskName) {
    const key = `month${month}_week${week}_${taskName}`;
    if (!this.progress.tasks[key]) {
      this.progress.tasks[key] = {
        name: taskName,
        month,
        week,
        completed: false,
        completedAt: null,
        notes: []
      };
    }

    this.progress.tasks[key].completed = true;
    this.progress.tasks[key].completedAt = new Date().toISOString();
    this.saveProgress();
    console.log(`✅ Task completed: ${taskName}`);
  }

  updateMetric(metricName, value) {
    if (this.progress.metrics[metricName] !== undefined) {
      this.progress.metrics[metricName] = value;
      this.saveProgress();
      console.log(`📊 Metric updated: ${metricName} = ${value}`);
    } else {
      console.warn(`Unknown metric: ${metricName}`);
    }
  }

  recordDogFooding(type) {
    const types = {
      improvement: 'improvementsGenerated',
      test: 'testsGenerated',
      optimization: 'optimizationsGenerated',
      doc: 'docsGenerated'
    };

    if (types[type]) {
      this.progress.dogFooding[types[type]]++;
      this.saveProgress();
      console.log(`🐕 Dog fooding recorded: ${type}`);
    }
  }

  getStatus() {
    const currentMonth = this.progress.currentMonth;
    const currentWeek = this.progress.currentWeek;
    const tasks = Object.values(this.progress.tasks);
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;

    return {
      currentMonth,
      currentWeek,
      progress: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
      completed,
      total,
      metrics: this.progress.metrics,
      dogFooding: this.progress.dogFooding
    };
  }

  printStatus() {
    const status = this.getStatus();
    
    console.log('\n📊 BEAST MODE ML/LLM Roadmap Progress\n');
    console.log('═'.repeat(60));
    console.log(`Current: Month ${status.currentMonth}, Week ${status.currentWeek}`);
    console.log(`Progress: ${status.completed}/${status.total} tasks (${status.progress}%)`);
    console.log('═'.repeat(60));
    
    console.log('\n📈 Metrics:');
    console.log(`  Cache Hit Rate: ${status.metrics.cacheHitRate}%`);
    console.log(`  Latency (p95): ${status.metrics.latency}ms`);
    console.log(`  Selection Accuracy: ${status.metrics.selectionAccuracy}%`);
    console.log(`  Cost Savings: ${status.metrics.costSavings}%`);
    console.log(`  Error Rate: ${status.metrics.errorRate}%`);
    
    console.log('\n🐕 Dog Fooding:');
    console.log(`  Improvements Generated: ${status.dogFooding.improvementsGenerated}`);
    console.log(`  Tests Generated: ${status.dogFooding.testsGenerated}`);
    console.log(`  Optimizations Generated: ${status.dogFooding.optimizationsGenerated}`);
    console.log(`  Docs Generated: ${status.dogFooding.docsGenerated}`);
    
    console.log('\n✅ Recent Completed Tasks:');
    const recent = Object.values(this.progress.tasks)
      .filter(t => t.completed)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);
    
    recent.forEach(task => {
      console.log(`  ✓ ${task.name} (Month ${task.month}, Week ${task.week})`);
    });
    
    console.log('\n⏳ Pending Tasks:');
    const pending = Object.values(this.progress.tasks)
      .filter(t => !t.completed)
      .slice(0, 5);
    
    if (pending.length === 0) {
      console.log('  (No pending tasks)');
    } else {
      pending.forEach(task => {
        console.log(`  ○ ${task.name} (Month ${task.month}, Week ${task.week})`);
      });
    }
    
    console.log('\n');
  }

  generateReport() {
    const status = this.getStatus();
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        currentMonth: status.currentMonth,
        currentWeek: status.currentWeek,
        progress: `${status.progress}%`,
        tasksCompleted: status.completed,
        tasksTotal: status.total
      },
      metrics: status.metrics,
      dogFooding: status.dogFooding,
      targets: {
        month1: {
          cacheHitRate: 40,
          latency: 200,
          selectionAccuracy: 95,
          errorRate: 2
        },
        month3: {
          cacheHitRate: 60,
          latency: 200,
          selectionAccuracy: 95,
          errorRate: 2
        },
        month6: {
          cacheHitRate: 80,
          latency: 150,
          selectionAccuracy: 98,
          errorRate: 1
        },
        month12: {
          cacheHitRate: 99,
          latency: 100,
          selectionAccuracy: 99.5,
          errorRate: 0.1
        }
      }
    };

    return report;
  }
}

// CLI Interface
if (require.main === module) {
  const tracker = new RoadmapTracker();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      tracker.printStatus();
      break;

    case 'complete':
      const [month, week, ...taskParts] = args.slice(1);
      const taskName = taskParts.join(' ');
      if (month && week && taskName) {
        tracker.markTaskComplete(parseInt(month), parseInt(week), taskName);
      } else {
        console.error('Usage: node roadmap-tracker.js complete <month> <week> <task-name>');
      }
      break;

    case 'metric':
      const [metricName, value] = args.slice(1);
      if (metricName && value) {
        tracker.updateMetric(metricName, parseFloat(value));
      } else {
        console.error('Usage: node roadmap-tracker.js metric <metric-name> <value>');
        console.error('Metrics: cacheHitRate, latency, selectionAccuracy, costSavings, errorRate');
      }
      break;

    case 'dogfood':
      const type = args[1];
      if (type) {
        tracker.recordDogFooding(type);
      } else {
        console.error('Usage: node roadmap-tracker.js dogfood <type>');
        console.error('Types: improvement, test, optimization, doc');
      }
      break;

    case 'report':
      const report = tracker.generateReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    default:
      console.log('BEAST MODE ML/LLM Roadmap Tracker\n');
      console.log('Commands:');
      console.log('  status                    - Show current progress');
      console.log('  complete <m> <w> <task>   - Mark task as complete');
      console.log('  metric <name> <value>     - Update metric');
      console.log('  dogfood <type>            - Record dog fooding');
      console.log('  report                    - Generate JSON report');
      console.log('\nExamples:');
      console.log('  node roadmap-tracker.js status');
      console.log('  node roadmap-tracker.js complete 1 1 "Fix failed request tracking"');
      console.log('  node roadmap-tracker.js metric cacheHitRate 40');
      console.log('  node roadmap-tracker.js dogfood improvement');
      break;
  }
}

module.exports = { RoadmapTracker };
