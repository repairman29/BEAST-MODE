/**
 * Test Training Data Extractor
 * Tests the extractor and provides honest assessments
 */

const { getTrainingDataExtractor } = require('../lib/mlops/trainingDataExtractor');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('🧪 Testing Training Data Extractor\n');
  console.log('=' .repeat(60));

  try {
    const extractor = await getTrainingDataExtractor();

    // Test 1: Production Data Extraction
    console.log('\n📊 Test 1: Production Data Extraction');
    console.log('-'.repeat(60));
    
    try {
      const productionResult = await extractor.extractFromPredictions({
        startDate: '2024-01-01',
        limit: 1000 // Start small for testing
      });

      console.log(`\n✅ Success!`);
      console.log(`   Examples extracted: ${productionResult.examples.length}`);
      console.log(`   Quality score: ${(productionResult.assessment.qualityScore * 100).toFixed(1)}%`);
      
      if (productionResult.assessment.issues.length > 0) {
        console.log(`\n⚠️  Issues found:`);
        productionResult.assessment.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }

      // Show sample
      if (productionResult.examples.length > 0) {
        console.log(`\n📝 Sample example:`);
        const sample = productionResult.examples[0];
        console.log(`   Service: ${sample.service}`);
        console.log(`   Type: ${sample.type}`);
        console.log(`   Predicted: ${sample.predicted.toFixed(3)}`);
        console.log(`   Actual: ${sample.label.toFixed(3)}`);
        console.log(`   Error: ${sample.error.toFixed(3)}`);
        console.log(`   Features: ${Object.keys(sample.features).length} features`);
      }
    } catch (error) {
      console.log(`\n❌ Failed: ${error.message}`);
      console.log(`   This is expected if ml_predictions table doesn't exist or is empty`);
    }

    // Test 2: GitHub Code Loading
    console.log('\n\n📚 Test 2: GitHub Code Loading');
    console.log('-'.repeat(60));
    
    try {
      const githubResult = await extractor.loadFromPantry({
        limit: 100 // Start small for testing
      });

      console.log(`\n✅ Success!`);
      console.log(`   Examples loaded: ${githubResult.examples.length}`);
      console.log(`   Quality score: ${(githubResult.assessment.qualityScore * 100).toFixed(1)}%`);
      
      if (githubResult.assessment.issues.length > 0) {
        console.log(`\n⚠️  Issues found:`);
        githubResult.assessment.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }

      // Show sample
      if (githubResult.examples.length > 0) {
        console.log(`\n📝 Sample code example:`);
        const sample = githubResult.examples[0];
        console.log(`   Repo: ${sample.repo}`);
        console.log(`   Name: ${sample.name}`);
        console.log(`   Kind: ${sample.kind}`);
        console.log(`   Language: ${sample.language}`);
        console.log(`   Code length: ${sample.code.length} chars`);
        console.log(`   Code preview: ${sample.code.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`\n❌ Failed: ${error.message}`);
      console.log(`   This is expected if catalog file doesn't exist`);
    }

    // Test 3: Combined Dataset
    console.log('\n\n🔗 Test 3: Combined Dataset Building');
    console.log('-'.repeat(60));
    
    try {
      const combinedResult = await extractor.buildCombinedTrainingSet({
        productionOptions: { limit: 100 },
        githubOptions: { limit: 50 }
      });

      console.log(`\n✅ Success!`);
      console.log(`   Train examples: ${combinedResult.train.length}`);
      console.log(`   Val examples: ${combinedResult.val.length}`);
      console.log(`   Test examples: ${combinedResult.test.length}`);
      console.log(`   GitHub examples: ${combinedResult.github.length}`);
      console.log(`   Quality score: ${(combinedResult.assessment.qualityScore * 100).toFixed(1)}%`);
      
      if (combinedResult.assessment.issues.length > 0) {
        console.log(`\n⚠️  Issues found:`);
        combinedResult.assessment.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }
    } catch (error) {
      console.log(`\n❌ Failed: ${error.message}`);
    }

    // Final Assessment Report
    console.log('\n\n📋 Final Assessment Report');
    console.log('='.repeat(60));
    
    const report = extractor.getAssessmentReport();
    
    console.log(`\n📊 Summary:`);
    console.log(`   Production usable: ${report.summary.productionUsable}`);
    console.log(`   GitHub usable: ${report.summary.githubUsable}`);
    console.log(`   Total usable: ${report.summary.totalUsable}`);
    console.log(`   Overall quality: ${(report.summary.overallQuality * 100).toFixed(1)}%`);
    console.log(`   Ready for training: ${report.summary.readyForTraining ? '✅ YES' : '❌ NO'}`);
    
    if (!report.summary.readyForTraining) {
      console.log(`\n⚠️  Need at least 1000 examples for meaningful training`);
      console.log(`   Current: ${report.summary.totalUsable} examples`);
      console.log(`   Need: ${1000 - report.summary.totalUsable} more examples`);
    }

    // Save report
    const reportPath = path.join(process.cwd(), '.beast-mode', 'data', 'training-assessment.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Assessment report saved to: ${reportPath}`);

    console.log('\n✅ Testing complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

