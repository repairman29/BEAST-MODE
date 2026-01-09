#!/usr/bin/env node
/**
 * Export Predictions with Features Fetched from Quality API
 * 
 * Re-fetches features from the quality API for each repo to ensure
 * we have complete feature data for XGBoost training
 */

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchFeaturesFromAPI(repo) {
  try {
    const response = await fetch(`${API_BASE}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        repo,
        platform: 'beast-mode'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Extract features from factors or response
    const features = {};
    
    // Try to get from factors
    if (data.factors) {
      Object.entries(data.factors).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'value' in value) {
          features[key] = value.value;
        } else if (typeof value === 'number') {
          features[key] = value;
        }
      });
    }
    
    // Also try to get from modelInfo or other sources
    // For now, we'll use a simplified approach - extract what we can
    
    return {
      features,
      quality: data.quality,
      confidence: data.confidence
    };
  } catch (error) {
    console.warn(`   ⚠️  Failed to fetch features for ${repo}: ${error.message}`);
    return null;
  }
}

async function exportWithFeatures() {
  console.log('📊 Exporting Predictions with Features from API\n');
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

  console.log(`✅ Found ${predictions.length} predictions with feedback`);
  console.log(`   Fetching features from Quality API...\n`);

  const repos = [];
  let fetched = 0;
  let failed = 0;

  // Process in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < predictions.length; i += batchSize) {
    const batch = predictions.slice(i, i + batchSize);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} repos)...`);

    const batchPromises = batch.map(async (pred) => {
      const context = pred.context || {};
      const repo = context.repo || 'unknown/unknown';
      
      // Fetch features from API
      const apiData = await fetchFeaturesFromAPI(repo);
      
      if (!apiData) {
        failed++;
        return null;
      }

      fetched++;
      
      // Use features from API, fallback to context if available
      const features = apiData.features || context.features || {};
      
      // Build repo data with features
      const repoData = {
        name: repo,
        full_name: repo,
        repo: repo,
        quality_score: pred.actual_value,
        predicted_quality: pred.predicted_value,
        confidence: pred.confidence || 0.5,
        features: {
          // Core metrics (use API data or defaults)
          stars: features.stars || 0,
          forks: features.forks || 0,
          openIssues: features.openIssues || 0,
          fileCount: features.fileCount || features.totalFiles || 0,
          codeFileCount: features.codeFileCount || 0,
          totalFiles: features.fileCount || features.totalFiles || 0,
          totalLines: features.totalLines || 0,
          codeLines: features.codeLines || 0,
          commentLines: features.commentLines || 0,
          blankLines: features.blankLines || 0,
          
          // Quality indicators
          hasReadme: features.hasReadme ? 1 : 0,
          hasTests: features.hasTests ? 1 : 0,
          hasCI: features.hasCI ? 1 : 0,
          hasLicense: features.hasLicense ? 1 : 0,
          hasDocker: features.hasDocker ? 1 : 0,
          hasDescription: features.hasDescription ? 1 : 0,
          
          // Activity
          repoAgeDays: features.repoAgeDays || features.daysSinceCreated || 0,
          daysSinceUpdate: features.daysSinceUpdate || 0,
          daysSincePush: features.daysSincePush || 0,
          isActive: features.isActive ? 1 : 0,
          
          // Ratios
          codeFileRatio: features.codeFileRatio || 0,
          starsForksRatio: features.starsForksRatio || 0,
          starsPerFile: features.starsPerFile || 0,
          engagementPerIssue: features.engagementPerIssue || 0,
          
          // Quality scores
          codeQualityScore: features.codeQualityScore || 0,
          communityHealth: features.communityHealth || 0,
          
          // Additional features from API response
          ...Object.fromEntries(
            Object.entries(features).map(([k, v]) => [
              k,
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
      
      console.log(`   ✅ ${repo} (${Object.keys(repoData.features).length} features)`);
      return repoData;
    });

    const batchResults = await Promise.all(batchPromises);
    repos.push(...batchResults.filter(r => r !== null));

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      source: 'ml_predictions_with_feedback_and_api_features',
      description: 'Exported from ml_predictions with features fetched from Quality API'
    }
  };

  await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2));
  
  console.log();
  console.log('='.repeat(50));
  console.log(`✅ Exported ${repos.length} repositories to:`);
  console.log(`   ${outputFile}\n`);
  console.log(`📊 Summary:`);
  console.log(`   Fetched: ${fetched}`);
  console.log(`   Failed: ${failed}`);
  console.log();
  
  // Summary
  const qualityScores = repos.map(r => r.quality_score);
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  
  console.log(`   Avg quality: ${(avgQuality * 100).toFixed(1)}%`);
  console.log(`   Avg features: ${repos.reduce((sum, r) => sum + Object.keys(r.features || {}).length, 0) / repos.length}`);
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
  await exportWithFeatures();
}
