#!/usr/bin/env node

/**
 * Train ML Models from All Connected Repositories
 * 
 * Scans all repositories in BEAST MODE, extracts code, and trains ML models
 */

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const BASE_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Get all repositories from BEAST MODE
 */
async function getAllRepos() {
  try {
    const response = await axios.get(`${BASE_URL}/api/beast-mode/enterprise/repos`, {
      validateStatus: () => true,
      timeout: 10000,
    });

    if (response.status === 200 && response.data.repos) {
      return response.data.repos;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching repos:', error.message);
    return [];
  }
}

/**
 * Scan a repository and extract code
 */
async function scanRepository(repo) {
  try {
    const repoName = repo.url.replace('https://github.com/', '');
    console.log(`  📡 Scanning: ${repoName}...`);

    const response = await axios.post(`${BASE_URL}/api/github/scan`, {
      repo: repoName,
      url: repo.url,
    }, {
      validateStatus: () => true,
      timeout: 30000,
    });

    if (response.status === 200) {
      return {
        repo: repoName,
        data: response.data,
        success: true,
      };
    } else {
      return {
        repo: repoName,
        success: false,
        error: response.status,
      };
    }
  } catch (error) {
    return {
      repo: repo.url,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract code features from scan results
 */
function extractCodeFeatures(scanData) {
  // Handle different response formats
  const data = scanData.data || scanData;
  const repo = data.repository || {};
  const metrics = data.metrics || {};
  
  // Extract from the actual API response structure
  const features = {
    // Quality score from API
    qualityScore: data.score || data.quality_score || data.quality || 0,
    
    // Repository metrics
    stars: repo.stargazers_count || metrics.stars || data.stars || 0,
    forks: repo.forks_count || metrics.forks || data.forks || 0,
    openIssues: repo.open_issues_count || metrics.open_issues || data.open_issues || 0,
    
    // File structure
    fileCount: metrics.totalFiles || data.file_count || data.filePaths?.length || 0,
    codeFileCount: metrics.codeFiles || data.code_file_count || data.codeFiles?.length || 0,
    
    // Features
    hasLicense: (repo.license || data.has_license || data.license) ? 1 : 0,
    hasDescription: (repo.description || data.has_description || data.description) ? 1 : 0,
    hasTopics: (repo.topics?.length > 0 || data.has_topics || (data.topics && data.topics.length > 0)) ? 1 : 0,
    hasReadme: (data.has_readme || metrics.hasReadme) ? 1 : 0,
    hasTests: (data.has_tests || (data.test_paths && data.test_paths.length > 0) || metrics.hasTests) ? 1 : 0,
    hasCI: (data.has_ci || (data.ci_paths && data.ci_paths.length > 0) || metrics.hasCI) ? 1 : 0,
    hasDocker: (data.has_docker || (data.docker_paths && data.docker_paths.length > 0) || metrics.hasDocker) ? 1 : 0,
    hasConfig: (data.has_config || (data.config_paths && data.config_paths.length > 0) || metrics.hasConfig) ? 1 : 0,
    
    // Issues and quality indicators
    issues: data.issues || data.detectedIssues?.length || 0,
    improvements: data.improvements || data.recommendations?.length || 0,
    
    // Languages
    languages: repo.languages || data.languages || metrics.languages || {},
    primaryLanguage: Object.keys(repo.languages || data.languages || {}).sort((a, b) => 
      (repo.languages || data.languages || {})[b] - (repo.languages || data.languages || {})[a]
    )[0] || 'Unknown',
  };

  // Calculate quality score if not present or 0
  if (!features.qualityScore || features.qualityScore === 0) {
    let score = 0;
    score += Math.min(features.stars / 100, 1) * 10; // Max 10 points for stars
    score += Math.min(features.forks / 50, 1) * 10; // Max 10 points for forks
    score += features.hasLicense * 10;
    score += features.hasDescription * 5;
    score += features.hasReadme * 10;
    score += features.hasTests * 15;
    score += features.hasCI * 10;
    score += features.hasDocker * 5;
    score += features.hasConfig * 5;
    score += Math.min(features.codeFileCount / 100, 1) * 20; // Max 20 points for code files
    score += Math.min(features.fileCount / 200, 1) * 5; // Max 5 points for total files
    // Penalize for issues
    score -= Math.min(features.issues * 2, 20); // Max 20 point penalty
    features.qualityScore = Math.max(0, Math.min(score, 100));
  }

  return features;
}

/**
 * Save training data
 */
async function saveTrainingData(repoData, features) {
  const trainingExample = {
    repo: repoData.repo,
    url: repoData.url,
    features: features,
    quality: features.qualityScore,
    timestamp: new Date().toISOString(),
    metadata: {
      languages: features.languages,
      fileCount: features.fileCount,
      codeFileCount: features.codeFileCount,
    },
  };

  const filename = `${repoData.repo.replace(/\//g, '_')}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await fs.writeJson(filepath, trainingExample, { spaces: 2 });

  return trainingExample;
}

/**
 * Build combined training dataset
 */
async function buildTrainingDataset(allExamples) {
  console.log('\n🔧 Building training dataset...\n');

  const dataset = {
    examples: allExamples,
    metadata: {
      totalRepos: allExamples.length,
      totalFeatures: allExamples[0]?.features ? Object.keys(allExamples[0].features).length : 0,
      qualityRange: {
        min: Math.min(...allExamples.map(e => e.quality)),
        max: Math.max(...allExamples.map(e => e.quality)),
        avg: allExamples.reduce((sum, e) => sum + e.quality, 0) / allExamples.length,
      },
      createdAt: new Date().toISOString(),
    },
  };

  const datasetPath = path.join(OUTPUT_DIR, 'dataset.json');
  await fs.writeJson(datasetPath, dataset, { spaces: 2 });

  // Also create train/val/test split
  const shuffled = [...allExamples].sort(() => Math.random() - 0.5);
  const trainSize = Math.floor(shuffled.length * 0.7);
  const valSize = Math.floor(shuffled.length * 0.15);

  const train = shuffled.slice(0, trainSize);
  const val = shuffled.slice(trainSize, trainSize + valSize);
  const test = shuffled.slice(trainSize + valSize);

  const splitDataset = {
    train,
    val,
    test,
    metadata: {
      trainSize: train.length,
      valSize: val.length,
      testSize: test.length,
      total: shuffled.length,
    },
  };

  const splitPath = path.join(OUTPUT_DIR, 'dataset-split.json');
  await fs.writeJson(splitPath, splitDataset, { spaces: 2 });

  console.log(`  ✅ Training set: ${train.length} examples`);
  console.log(`  ✅ Validation set: ${val.length} examples`);
  console.log(`  ✅ Test set: ${test.length} examples`);

  return { dataset, splitDataset };
}

/**
 * Train models using the dataset
 */
async function trainModels(datasetPath) {
  console.log('\n🤖 Training ML models...\n');

  try {
    // Use the existing training pipeline
    const { getTrainingPipeline } = require('../lib/mlops/trainingPipeline');
    const pipeline = await getTrainingPipeline();

    // Build dataset from our extracted data
    const dataset = await fs.readJson(datasetPath);
    
    // Transform to training format
    const trainingData = dataset.examples.map(example => ({
      features: example.features,
      quality: example.quality,
      repo: example.repo,
    }));

    console.log(`  📊 Training on ${trainingData.length} examples...`);

    // Train quality prediction model
    const { ModelTrainer } = require('../lib/mlops/modelTrainer');
    const trainer = new ModelTrainer();

    console.log('  🚀 Training Code Quality Predictor...');
    const result = await trainer.trainCodeQualityModel(trainingData);

    if (result.success) {
      console.log('  ✅ Model trained successfully!');
      console.log(`     Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
      console.log(`     Model saved: ${result.modelPath || 'N/A'}`);
    } else {
      console.log('  ⚠️  Training completed with warnings');
      console.log(`     ${result.message || 'Check logs for details'}`);
    }

    return result;
  } catch (error) {
    console.error('  ❌ Training error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Training ML Models from All Repositories\n');
  console.log('='.repeat(60));
  console.log(`🌐 API URL: ${BASE_URL}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  // Step 1: Get all repositories
  console.log('📋 Step 1: Fetching all repositories...');
  let repos = await getAllRepos();
  
  // Filter out test/dummy repos
  repos = repos.filter(repo => {
    const url = repo.url || '';
    return !url.includes('company/') && url.includes('github.com');
  });
  
  console.log(`  ✅ Found ${repos.length} real repositories\n`);

  if (repos.length === 0) {
    console.log('⚠️  No repositories found. Add repositories first:');
    console.log('   beast-mode repos add <url>\n');
    process.exit(1);
  }

  // Step 2: Scan all repositories
  console.log('📡 Step 2: Scanning repositories...\n');
  const allExamples = [];
  let successCount = 0;
  let errorCount = 0;

  // Process in batches to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const promises = batch.map(repo => scanRepository(repo));
    const results = await Promise.all(promises);

    for (const result of results) {
      if (result.success && result.data) {
        const features = extractCodeFeatures(result.data);
        const example = await saveTrainingData({
          repo: result.repo,
          url: repos.find(r => r.url.includes(result.repo))?.url || '',
        }, features);
        allExamples.push(example);
        successCount++;
        console.log(`  ✅ ${result.repo} - Quality: ${features.qualityScore.toFixed(1)}/100`);
      } else {
        errorCount++;
        console.log(`  ❌ ${result.repo} - ${result.error || 'Failed'}`);
      }
    }

    // Progress update
    if ((i + batchSize) % 20 === 0 || i + batchSize >= repos.length) {
      console.log(`\n   Progress: ${Math.min(i + batchSize, repos.length)}/${repos.length}\n`);
    }

    // Small delay between batches
    if (i + batchSize < repos.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n📊 Scanning Summary:`);
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📦 Total: ${repos.length}`);

  if (allExamples.length === 0) {
    console.log('\n⚠️  No data extracted. Cannot train models.\n');
    process.exit(1);
  }

  // Step 3: Build training dataset
  console.log('\n' + '='.repeat(60));
  const { dataset, splitDataset } = await buildTrainingDataset(allExamples);

  // Step 4: Train models
  console.log('\n' + '='.repeat(60));
  const datasetPath = path.join(OUTPUT_DIR, 'dataset.json');
  const trainingResult = await trainModels(datasetPath);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Training Complete!\n');
  console.log('📊 Summary:');
  console.log(`  📦 Repositories scanned: ${repos.length}`);
  console.log(`  ✅ Examples extracted: ${allExamples.length}`);
  console.log(`  🤖 Models trained: ${trainingResult.success ? '1' : '0'}`);
  console.log(`  📁 Data saved: ${OUTPUT_DIR}\n`);
  console.log('📋 Files created:');
  console.log(`  - dataset.json (${allExamples.length} examples)`);
  console.log(`  - dataset-split.json (train/val/test split)`);
  console.log(`  - Individual repo files (${allExamples.length} files)\n`);
  console.log('🎯 Next steps:');
  console.log('  1. Review dataset.json');
  console.log('  2. Run: npm run train:quality (to train specific models)');
  console.log('  3. Use models in production via ML integration\n');
}

main().catch(console.error);

