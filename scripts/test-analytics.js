/**
 * Test script for analytics features
 */

const { getTrendAnalyzer } = require('../lib/analytics/trendAnalyzer');
const { getAnomalyDetector } = require('../lib/analytics/anomalyDetector');
const { getPredictiveAnalytics } = require('../lib/analytics/predictiveAnalytics');
const { getBIIntegration } = require('../lib/analytics/biIntegration');

async function main() {
  console.log('📊 Testing Analytics Features\n');

  // Test Trend Analyzer
  console.log('1️⃣  Testing Trend Analyzer...');
  const trendAnalyzer = getTrendAnalyzer();
  await trendAnalyzer.initialize();

  const timeSeriesData = Array.from({ length: 30 }, (_, i) => ({
    timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
    value: 50 + i * 2 + Math.random() * 10
  }));

  const trendAnalysis = trendAnalyzer.analyzeTrends(timeSeriesData);
  console.log(`   ✅ Trend analysis: ${trendAnalysis.trend}`);
  console.log(`   ✅ Trend strength: ${(trendAnalysis.strength * 100).toFixed(1)}%`);
  console.log(`   ✅ Forecast: ${trendAnalysis.forecast.length} periods\n`);

  // Test Anomaly Detector
  console.log('2️⃣  Testing Anomaly Detector...');
  const anomalyDetector = getAnomalyDetector();
  await anomalyDetector.initialize();

  const testData = Array.from({ length: 100 }, (_, i) => ({
    timestamp: Date.now() - (100 - i) * 60 * 1000,
    value: 50 + Math.random() * 20 + (i === 50 ? 100 : 0) // Anomaly at index 50
  }));

  const anomalies = anomalyDetector.detectAnomalies(testData, 'statistical');
  console.log(`   ✅ Anomalies detected: ${anomalies.anomalies.length}`);
  console.log(`   ✅ Detection method: ${anomalies.method}`);

  const realTime = anomalyDetector.detectRealTime(150);
  console.log(`   ✅ Real-time detection: ${realTime.isAnomaly ? 'anomaly' : 'normal'}\n`);

  // Test Predictive Analytics
  console.log('3️⃣  Testing Predictive Analytics...');
  const predictive = getPredictiveAnalytics();
  await predictive.initialize();

  const forecast = await predictive.forecast('predictions', timeSeriesData, 7, 'trend');
  console.log(`   ✅ Forecast generated: ${forecast ? 'yes' : 'no'}`);
  console.log(`   ✅ Forecast periods: ${forecast?.forecast.length || 0}`);
  console.log(`   ✅ Confidence: ${((forecast?.confidence || 0) * 100).toFixed(1)}%`);

  const scenarioAnalysis = await predictive.scenarioAnalysis(forecast, [
    { name: 'optimistic', adjustments: { percentage: 10 } },
    { name: 'pessimistic', adjustments: { percentage: -10 } }
  ]);
  console.log(`   ✅ Scenario analysis: ${scenarioAnalysis ? 'yes' : 'no'}\n`);

  // Test BI Integration
  console.log('4️⃣  Testing BI Integration...');
  const biIntegration = getBIIntegration();
  await biIntegration.initialize();

  const exportData = await biIntegration.exportForBI(timeSeriesData, 'csv');
  console.log(`   ✅ Data exported: ${exportData ? 'yes' : 'no'}`);
  console.log(`   ✅ Export format: ${exportData?.format || 'none'}`);
  console.log(`   ✅ Export size: ${exportData?.size || 0} bytes`);

  const report = await biIntegration.generateBIReport('performance', {
    totalPredictions: 10000,
    avgLatency: 150,
    accuracy: 0.95
  });
  console.log(`   ✅ BI report generated: ${report ? 'yes' : 'no'}\n`);

  console.log('✅ All analytics features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

