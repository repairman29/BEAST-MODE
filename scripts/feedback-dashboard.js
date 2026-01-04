/**
 * Feedback Collection Dashboard
 * Real-time monitoring of feedback collection rate and predictionId flow
 */

const { getFeedbackMonitor } = require('../lib/mlops/feedbackMonitor');

async function main() {
  console.log('📊 Feedback Collection Dashboard\n');
  console.log('='.repeat(60));

  try {
    const monitor = await getFeedbackMonitor();
    if (!monitor || !monitor.initialized) {
      console.log('❌ Feedback monitor not available');
      return;
    }

    const status = await monitor.checkStatus();
    
    if (!status.available) {
      console.log('⚠️  Feedback monitor not available');
      return;
    }

    // Calculate metrics
    const totalPredictions = status.stats.totalPredictions || 0;
    const withActuals = status.stats.withActuals || 0;
    const feedbackRate = totalPredictions > 0 ? (withActuals / totalPredictions) : 0;
    const missingFeedback = totalPredictions - withActuals;

    // Display dashboard
    console.log('\n📈 Feedback Collection Metrics\n');
    
    console.log(`Total Predictions:     ${totalPredictions.toLocaleString()}`);
    console.log(`With Feedback:         ${withActuals.toLocaleString()}`);
    console.log(`Missing Feedback:      ${missingFeedback.toLocaleString()}`);
    console.log(`Feedback Rate:         ${(feedbackRate * 100).toFixed(2)}%`);
    
    // Visual progress bar
    const barLength = 50;
    const filled = Math.floor(barLength * feedbackRate);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    console.log(`Progress:              [${bar}] ${(feedbackRate * 100).toFixed(1)}%`);

    // Status indicators
    console.log('\n📊 Status Indicators\n');
    
    if (feedbackRate >= 0.10) {
      console.log('   ✅ Excellent feedback rate (≥10%)');
    } else if (feedbackRate >= 0.05) {
      console.log('   ✅ Good feedback rate (≥5%)');
    } else if (feedbackRate >= 0.01) {
      console.log('   ⚠️  Low feedback rate (1-5%)');
    } else {
      console.log('   ❌ Very low feedback rate (<1%)');
    }

    if (withActuals >= 100) {
      console.log('   ✅ Sufficient data for training (≥100 examples)');
    } else if (withActuals >= 50) {
      console.log('   ⚠️  Minimum data for training (50-99 examples)');
    } else {
      console.log(`   ❌ Need ${50 - withActuals} more examples for training`);
    }

    // Recommendations
    console.log('\n💡 Recommendations\n');
    
    if (feedbackRate < 0.01) {
      console.log('   1. ⚠️  CRITICAL: Feedback rate is very low');
      console.log('      - Verify predictionId is being generated');
      console.log('      - Check service logs for feedback collection');
      console.log('      - Run: node scripts/audit-predictionid-flow.js');
    }
    
    if (withActuals < 50) {
      console.log(`   2. Need ${50 - withActuals} more feedback examples`);
      console.log('      - Wait for more user interactions');
      console.log('      - Check if feedback collection is being called');
    }
    
    if (feedbackRate >= 0.01 && withActuals >= 50) {
      console.log('   ✅ Ready for ML training!');
      console.log('      - Run: npm run train:model');
    }

    // Service breakdown
    console.log('\n🔍 Service Breakdown\n');
    try {
      if (monitor.supabase) {
        const { data: serviceStats } = await monitor.supabase
          .from('ml_predictions')
          .select('service_name, actual_value')
          .not('actual_value', 'is', null)
          .limit(1000);
        
        if (serviceStats && serviceStats.length > 0) {
          const byService = {};
          serviceStats.forEach(p => {
            if (!byService[p.service_name]) {
              byService[p.service_name] = { total: 0, withFeedback: 0 };
            }
            byService[p.service_name].withFeedback++;
          });
          
          // Get total predictions per service
          const { data: allPredictions } = await monitor.supabase
            .from('ml_predictions')
            .select('service_name')
            .limit(5000);
          
          if (allPredictions) {
            allPredictions.forEach(p => {
              if (!byService[p.service_name]) {
                byService[p.service_name] = { total: 0, withFeedback: 0 };
              }
              byService[p.service_name].total++;
            });
          }
          
          Object.entries(byService).forEach(([service, stats]) => {
            const rate = stats.total > 0 ? (stats.withFeedback / stats.total * 100).toFixed(1) : '0.0';
            console.log(`   ${service}: ${stats.withFeedback}/${stats.total} (${rate}%)`);
          });
        } else {
          console.log('   No feedback data available');
        }
      }
    } catch (error) {
      console.log('   Could not fetch service breakdown:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Dashboard complete!\n');

  } catch (error) {
    console.error('❌ Error generating dashboard:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

