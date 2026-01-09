#!/usr/bin/env node
/**
 * Record Bot Quality Outcome
 * 
 * Simple script for bots to record their success/failure after using a quality prediction.
 * 
 * Usage:
 *   node scripts/record-bot-quality-outcome.js <predictionId> <success|failure> [repo]
 * 
 * Example:
 *   node scripts/record-bot-quality-outcome.js abc123 success owner/repo
 */

const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';

async function recordBotOutcome(predictionId, outcome, repo = null) {
  const isSuccess = outcome === 'success' || outcome === 'true' || outcome === '1';
  const actualValue = isSuccess ? 1.0 : 0.0;

  try {
    const response = await fetch(`${API_BASE}/api/feedback/bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionId,
        outcome: isSuccess ? 'success' : 'failure',
        confidence: 1.0, // Bot knows for sure if it succeeded or failed
        reasoning: `Bot ${isSuccess ? 'succeeded' : 'failed'} when using this quality prediction`,
        metrics: {
          botOutcome: isSuccess ? 'success' : 'failure',
          recordedAt: new Date().toISOString()
        },
        context: {
          repo: repo,
          source: 'bot-outcome-recording',
          recordedBy: 'bot-script'
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Recorded bot outcome: ${isSuccess ? 'SUCCESS' : 'FAILURE'} (${(actualValue * 100).toFixed(0)}%)`);
      console.log(`   Prediction: ${predictionId}`);
      if (repo) console.log(`   Repo: ${repo}`);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Failed to record bot outcome: ${error.message}`);
    process.exit(1);
  }
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node record-bot-quality-outcome.js <predictionId> <success|failure> [repo]');
  console.log();
  console.log('Example:');
  console.log('  node record-bot-quality-outcome.js abc123 success owner/repo');
  process.exit(1);
}

const [predictionId, outcome, repo] = args;
recordBotOutcome(predictionId, outcome, repo);
