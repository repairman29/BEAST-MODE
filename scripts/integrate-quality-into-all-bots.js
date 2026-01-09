#!/usr/bin/env node
/**
 * Integrate Quality Predictions into All Bots
 * 
 * Creates integration points for all bot services to use quality predictions
 */

const fs = require('fs');
const path = require('path');

const INTEGRATIONS = [
  {
    name: 'Code Roach',
    serviceFile: '../../smuggler-code-roach/src/services/fixApplicationService.js',
    integrationPoint: 'recordFixApplication',
    botName: 'code-roach'
  },
  {
    name: 'AI GM',
    serviceFile: '../../smuggler-ai-gm/src/services/narrativeGenerationService.js',
    integrationPoint: 'generateNarrative',
    botName: 'ai-gm'
  },
  {
    name: 'Oracle',
    serviceFile: '../../smuggler-oracle/src/services/knowledgeRetrievalService.js',
    integrationPoint: 'retrieveKnowledge',
    botName: 'oracle'
  },
  {
    name: 'Daisy Chain',
    serviceFile: '../../smuggler-daisy-chain/scripts/super-task-worker-daisy-chain.js',
    integrationPoint: 'processTask',
    botName: 'daisy-chain'
  }
];

function createIntegrationTemplate(bot) {
  return `
// Quality Prediction Integration for ${bot.name}
const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');

async function ${bot.integrationPoint}WithQuality(...args) {
  const helper = getQualityPredictionHelper();
  
  // Extract repo from args (customize per bot)
  const repo = extractRepoFromArgs(args);
  
  let quality = 0.5;
  let predictionId = null;
  
  if (repo) {
    const qualityData = await helper.getQuality(repo);
    quality = qualityData.quality;
    predictionId = qualityData.predictionId;
  }

  // Call original function with quality context
  const result = await original${bot.integrationPoint}(...args, { quality, predictionId });

  // Record outcome
  if (predictionId && result.success !== undefined) {
    await helper.recordOutcome(predictionId, result.success, {
      repo,
      botName: '${bot.botName}',
      ...result.context
    });
  }

  return result;
}
`;
}

async function integrateAllBots() {
  console.log('🔧 Integrating Quality Predictions into All Bots\n');
  console.log('='.repeat(70));
  console.log();

  const results = [];

  for (const bot of INTEGRATIONS) {
    const servicePath = path.join(__dirname, bot.serviceFile);
    
    if (!fs.existsSync(servicePath)) {
      console.log(`⚠️  ${bot.name}: Service file not found (${bot.serviceFile})`);
      results.push({ bot: bot.name, status: 'not-found' });
      continue;
    }

    let content = fs.readFileSync(servicePath, 'utf8');

    // Check if already integrated
    if (content.includes('qualityPredictionHelper')) {
      console.log(`✅ ${bot.name}: Already integrated`);
      results.push({ bot: bot.name, status: 'already-integrated' });
      continue;
    }

    // Add import
    const importCode = `const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');\n`;
    
    // Find first require/import
    const firstRequire = content.match(/^(const|import|require)/m);
    if (firstRequire) {
      const insertIndex = content.indexOf(firstRequire[0]);
      content = content.slice(0, insertIndex) + importCode + content.slice(insertIndex);
    } else {
      content = importCode + content;
    }

    // Add integration wrapper (manual integration needed)
    console.log(`📝 ${bot.name}: Added import, manual integration needed`);
    console.log(`   Integration point: ${bot.integrationPoint}`);
    console.log(`   Template: ${createIntegrationTemplate(bot)}`);
    console.log();

    results.push({ bot: bot.name, status: 'import-added' });
  }

  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  
  results.forEach(r => {
    const icon = r.status === 'already-integrated' ? '✅' : 
                 r.status === 'import-added' ? '📝' : '⚠️';
    console.log(`   ${icon} ${r.bot}: ${r.status}`);
  });
  console.log();
  console.log('💡 Next steps:');
  console.log('   1. Review integration templates above');
  console.log('   2. Manually integrate into each bot service');
  console.log('   3. Test each integration');
  console.log('   4. Monitor feedback collection');
  console.log();
}

integrateAllBots().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
