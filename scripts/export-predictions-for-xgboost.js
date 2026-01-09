#!/usr/bin/env node
/**
 * Export Predictions with Feedback for XGBoost Training
 * 
 * Exports our 150+ predictions with feedback to the format expected by train_xgboost.py
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportPredictionsForXGBoost() {
  console.log('📊 Exporting Predictions for XGBoost Training\n');
  console.log('='.repeat(50));
  console.log();

  // Get all predictions with feedback
  const { data: predictions, error } = await supabase
    .from('ml_predictions')
    .select('*')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching predictions:', error.message);
    process.exit(1);
  }

  if (!predictions || predictions.length === 0) {
    console.error('❌ No predictions with feedback found');
    process.exit(1);
  }

  console.log(`✅ Found ${predictions.length} predictions with feedback\n`);

  // Convert to format expected by Python script
  const repos = [];
  
  for (const pred of predictions) {
    const context = pred.context || {};
    const repo = context.repo || 'unknown/unknown';
    const features = context.features || {};
    
    // Extract features in the format expected by train_xgboost.py
    const repoData = {
      name: repo,
      full_name: repo,
      quality_score: pred.actual_value, // Use actual_value as the target
      predicted_quality: pred.predicted_value,
      confidence: pred.confidence || 0.5,
      features: {
        // Code metrics
        has_readme: features.hasReadme ? 1 : 0,
        readme_length: features.readmeLength || 0,
        has_tests: features.hasTests ? 1 : 0,
        test_coverage: features.testCoverage || 0,
        has_ci: features.hasCI ? 1 : 0,
        has_license: features.hasLicense ? 1 : 0,
        has_contributing: features.hasContributing ? 1 : 0,
        
        // Repository stats
        stars: features.stars || 0,
        forks: features.forks || 0,
        watchers: features.watchers || 0,
        open_issues: features.openIssues || 0,
        total_issues: features.totalIssues || 0,
        
        // Code stats
        file_count: features.fileCount || features.totalFiles || 0,
        total_lines: features.totalLines || 0,
        code_lines: features.codeLines || 0,
        comment_lines: features.commentLines || 0,
        blank_lines: features.blankLines || 0,
        
        // Language info
        primary_language: features.primaryLanguage || 'unknown',
        language_count: features.languageCount || 1,
        
        // Activity
        days_since_created: features.daysSinceCreated || 0,
        days_since_updated: features.daysSinceUpdated || 0,
        commit_count: features.commitCount || 0,
        contributor_count: features.contributorCount || 0,
        
        // Quality indicators
        has_documentation: features.hasDocumentation ? 1 : 0,
        has_examples: features.hasExamples ? 1 : 0,
        has_changelog: features.hasChangelog ? 1 : 0,
        has_security_policy: features.hasSecurityPolicy ? 1 : 0,
        
        // Size metrics
        repo_size_kb: features.repoSizeKB || 0,
        avg_file_size: features.avgFileSize || 0,
        
        // Additional features from context
        ...Object.fromEntries(
          Object.entries(features).map(([k, v]) => [
            k.replace(/([A-Z])/g, '_$1').toLowerCase(),
            typeof v === 'boolean' ? (v ? 1 : 0) : (typeof v === 'number' ? v : 0)
          ])
        )
      },
      metadata: {
        prediction_id: pred.id,
        created_at: pred.created_at,
        model_version: pred.model_version || 'unknown',
        source: pred.source || 'ml_model',
        error: pred.error || Math.abs(pred.predicted_value - pred.actual_value)
      }
    };
    
    repos.push(repoData);
  }

  // Create output directory
  const outputDir = path.join(__dirname, '../.beast-mode/training-data');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Export to JSON
  const outputFile = path.join(outputDir, 'all-repos-for-python.json');
  const exportData = {
    repositories: repos,
    metadata: {
      exported_at: new Date().toISOString(),
      total_repos: repos.length,
      source: 'ml_predictions_with_feedback',
      description: 'Exported from ml_predictions table with actual_value (feedback)'
    }
  };

  await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2));
  
  console.log(`✅ Exported ${repos.length} repositories to:`);
  console.log(`   ${outputFile}\n`);
  
  // Summary
  const qualityScores = repos.map(r => r.quality_score);
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  const minQuality = Math.min(...qualityScores);
  const maxQuality = Math.max(...qualityScores);
  
  console.log('📊 Export Summary:');
  console.log(`   Total repos: ${repos.length}`);
  console.log(`   Avg quality: ${(avgQuality * 100).toFixed(1)}%`);
  console.log(`   Min quality: ${(minQuality * 100).toFixed(1)}%`);
  console.log(`   Max quality: ${(maxQuality * 100).toFixed(1)}%`);
  console.log();
  
  // Feature count
  const featureCounts = repos.map(r => Object.keys(r.features || {}).length);
  const avgFeatures = featureCounts.reduce((a, b) => a + b, 0) / featureCounts.length;
  console.log(`   Avg features per repo: ${avgFeatures.toFixed(1)}`);
  console.log();
  
  console.log('🚀 Ready for XGBoost training!');
  console.log('   Run: python3 scripts/train_xgboost.py');
  console.log();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

async function main() {
  await exportPredictionsForXGBoost();
}
