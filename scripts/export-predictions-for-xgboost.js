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
    
    // Try to get features from context, or fetch from API
    let features = {};
    if (context.features && typeof context.features === 'object' && !Array.isArray(context.features)) {
      // Features are stored as object
      features = context.features;
    } else if (typeof context.features === 'number') {
      // Only count stored, need to fetch
      console.log(`   ⚠️  Features not stored for ${repo}, using defaults`);
      features = {}; // Will use defaults below
    } else {
      features = context.features || {};
    }
    
    // Extract features in the format expected by train_xgboost.py
    // Use camelCase keys that match what the Python script expects
    const repoData = {
      name: repo,
      full_name: repo,
      repo: repo, // Also include as 'repo' for compatibility
      quality_score: pred.actual_value, // Use actual_value as the target
      predicted_quality: pred.predicted_value,
      confidence: pred.confidence || 0.5,
      features: {
        // Code metrics (use camelCase for Python script compatibility)
        hasReadme: features.hasReadme ? 1 : 0,
        readmeLength: features.readmeLength || 0,
        hasTests: features.hasTests ? 1 : 0,
        testCoverage: features.testCoverage || 0,
        hasCI: features.hasCI ? 1 : 0,
        hasLicense: features.hasLicense ? 1 : 0,
        hasContributing: features.hasContributing ? 1 : 0,
        
        // Repository stats (camelCase)
        stars: features.stars || 0,
        forks: features.forks || 0,
        watchers: features.watchers || 0,
        openIssues: features.openIssues || 0,
        totalIssues: features.totalIssues || 0,
        
        // Code stats (camelCase)
        fileCount: features.fileCount || features.totalFiles || 0,
        totalLines: features.totalLines || 0,
        codeLines: features.codeLines || 0,
        commentLines: features.commentLines || 0,
        blankLines: features.blankLines || 0,
        
        // Language info (camelCase)
        primaryLanguage: features.primaryLanguage || 'unknown',
        languageCount: features.languageCount || 1,
        
        // Activity (camelCase)
        daysSinceCreated: features.daysSinceCreated || 0,
        daysSinceUpdated: features.daysSinceUpdated || 0,
        commitCount: features.commitCount || 0,
        contributorCount: features.contributorCount || 0,
        
        // Quality indicators (camelCase)
        hasDocumentation: features.hasDocumentation ? 1 : 0,
        hasExamples: features.hasExamples ? 1 : 0,
        hasChangelog: features.hasChangelog ? 1 : 0,
        hasSecurityPolicy: features.hasSecurityPolicy ? 1 : 0,
        
        // Size metrics (camelCase)
        repoSizeKB: features.repoSizeKB || 0,
        avgFileSize: features.avgFileSize || 0,
        
        // Additional common features
        isActive: features.isActive ? 1 : 0,
        hasReleases: features.hasReleases ? 1 : 0,
        
        // Additional features from context (preserve camelCase)
        ...Object.fromEntries(
          Object.entries(features).map(([k, v]) => [
            k, // Keep original key name (camelCase)
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
