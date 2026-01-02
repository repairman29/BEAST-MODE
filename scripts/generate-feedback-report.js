/**
 * Generate Feedback Report
 * Weekly/monthly feedback collection report
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('📊 Generating Feedback Report\n');
  console.log('='.repeat(60));

  try {
    const collector = await getFeedbackCollector();
    
    // Get statistics
    const stats = await collector.getFeedbackStats();
    
    // Get predictions needing feedback
    const needingFeedback = await collector.getPredictionsNeedingFeedback({
      limit: 1000
    });

    // Analyze by service
    const byService = {};
    const byDay = {};
    
    for (const pred of needingFeedback) {
      const service = pred.service_name || 'unknown';
      if (!byService[service]) {
        byService[service] = {
          total: 0,
          recent: 0,
          old: 0,
          withContext: 0,
          avgConfidence: 0,
          confidenceSum: 0
        };
      }
      byService[service].total++;
      
      const age = Date.now() - new Date(pred.created_at).getTime();
      const daysAgo = Math.floor(age / (24 * 60 * 60 * 1000));
      
      if (daysAgo < 1) {
        byService[service].recent++;
      } else if (daysAgo > 7) {
        byService[service].old++;
      }
      
      if (pred.context && Object.keys(pred.context).length > 0) {
        byService[service].withContext++;
      }
      
      if (pred.confidence) {
        byService[service].confidenceSum += pred.confidence;
      }
      
      // Track by day
      const day = new Date(pred.created_at).toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = 0;
      }
      byDay[day]++;
    }

    // Calculate averages
    for (const service of Object.keys(byService)) {
      if (byService[service].total > 0) {
        byService[service].avgConfidence = byService[service].confidenceSum / byService[service].total;
      }
    }

    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPredictions: stats.totalPredictions,
        withActuals: stats.withActuals,
        withoutActuals: stats.withoutActuals,
        feedbackRate: stats.feedbackRate,
        targetRate: 0.05,
        health: stats.feedbackRate >= 0.05 ? 'healthy' : 
                stats.feedbackRate >= 0.01 ? 'needs-attention' : 'critical'
      },
      byService: byService,
      byDay: byDay,
      recommendations: []
    };

    // Add recommendations
    if (stats.feedbackRate < 0.05) {
      report.recommendations.push({
        priority: 'HIGH',
        issue: 'Feedback rate below target',
        current: `${(stats.feedbackRate * 100).toFixed(2)}%`,
        target: '5%',
        action: 'Enable auto-collection and add user prompts'
      });
    }

    for (const [service, data] of Object.entries(byService)) {
      if (data.old > data.recent) {
        report.recommendations.push({
          priority: 'MEDIUM',
          issue: `${service} has many old predictions`,
          count: data.old,
          action: `Focus on collecting feedback for ${service}`
        });
      }
    }

    // Save report
    const reportPath = path.join(process.cwd(), 'reports', `feedback-report-${new Date().toISOString().split('T')[0]}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n📊 Report Summary:');
    console.log(`   Total predictions: ${stats.totalPredictions}`);
    console.log(`   With feedback: ${stats.withActuals}`);
    console.log(`   Feedback rate: ${(stats.feedbackRate * 100).toFixed(2)}%`);
    console.log(`   Health: ${report.summary.health}`);
    console.log(`\n📁 Report saved: ${reportPath}`);

    console.log('\n📈 By Service:');
    for (const [service, data] of Object.entries(byService)) {
      console.log(`   ${service}:`);
      console.log(`     Total: ${data.total}`);
      console.log(`     Recent: ${data.recent}`);
      console.log(`     Old: ${data.old}`);
      console.log(`     Avg Confidence: ${(data.avgConfidence * 100).toFixed(1)}%`);
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const rec of report.recommendations) {
        console.log(`   [${rec.priority}] ${rec.issue}`);
        console.log(`      Action: ${rec.action}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Report generated!\n');

    return report;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

