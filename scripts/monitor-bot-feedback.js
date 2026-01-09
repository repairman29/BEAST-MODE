#!/usr/bin/env node
/**
 * Monitor Bot Feedback Collection
 * 
 * Tracks feedback from all bots and provides insights
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function monitorBotFeedback() {
  console.log('🤖 Bot Feedback Collection Monitor\n');
  console.log('='.repeat(70));
  console.log();

  // Get bot feedback from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: botFeedback, error } = await supabase
    .from('ml_feedback')
    .select('*')
    .in('service_name', ['code-roach', 'ai-gm', 'oracle', 'daisy-chain'])
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  const totalBotFeedback = botFeedback?.length || 0;

  console.log('📊 Bot Feedback Statistics (Last 7 Days):');
  console.log(`   Total bot feedback: ${totalBotFeedback}`);
  console.log();

  if (totalBotFeedback === 0) {
    console.log('⚠️  No bot feedback found yet');
    console.log('   This is expected if bots haven\'t processed tasks recently');
    console.log('   Bots will record feedback when they:');
    console.log('     - Code Roach: Applies fixes');
    console.log('     - AI GM: Generates narratives');
    console.log('     - Oracle: Searches knowledge');
    console.log('     - Daisy Chain: Processes tasks');
    console.log();
    return;
  }

  // Group by bot
  const byBot = {};
  const byOutcome = { success: 0, failure: 0 };
  const byRepo = {};

  botFeedback.forEach(f => {
    const botName = f.metadata?.botName || f.service_name || 'unknown';
    byBot[botName] = (byBot[botName] || 0) + 1;

    const outcome = f.metadata?.outcome || f.metadata?.success;
    if (outcome === 'success' || outcome === true || f.feedback_score >= 0.7) {
      byOutcome.success++;
    } else {
      byOutcome.failure++;
    }

    const repo = f.metadata?.repo || 'unknown';
    byRepo[repo] = (byRepo[repo] || 0) + 1;
  });

  console.log('🤖 By Bot:');
  Object.entries(byBot).sort((a, b) => b[1] - a[1]).forEach(([bot, count]) => {
    const percentage = (count / totalBotFeedback * 100).toFixed(1);
    console.log(`   ${bot}: ${count} (${percentage}%)`);
  });
  console.log();

  console.log('📈 By Outcome:');
  console.log(`   Success: ${byOutcome.success} (${(byOutcome.success / totalBotFeedback * 100).toFixed(1)}%)`);
  console.log(`   Failure: ${byOutcome.failure} (${(byOutcome.failure / totalBotFeedback * 100).toFixed(1)}%)`);
  console.log();

  console.log('📦 Top Repos:');
  Object.entries(byRepo).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([repo, count]) => {
    console.log(`   ${repo}: ${count}`);
  });
  console.log();

  // Recent activity
  const recent = botFeedback.slice(0, 10);
  console.log('🕐 Recent Activity (Last 10):');
  recent.forEach(f => {
    const botName = f.metadata?.botName || f.service_name || 'unknown';
    const outcome = f.metadata?.outcome || (f.feedback_score >= 0.7 ? 'success' : 'failure');
    const repo = f.metadata?.repo || 'unknown';
    const time = new Date(f.created_at).toLocaleString();
    console.log(`   ${time} - ${botName}: ${outcome} (${repo})`);
  });
  console.log();

  // Recommendations
  console.log('='.repeat(70));
  console.log('💡 Recommendations:');
  console.log('='.repeat(70));
  console.log();

  if (totalBotFeedback < 50) {
    console.log(`🎯 Target: 50+ bot feedback examples`);
    console.log(`   Current: ${totalBotFeedback}`);
    console.log(`   Need: ${50 - totalBotFeedback} more`);
    console.log('   - Ensure bots are processing tasks');
    console.log('   - Check bot logs for errors');
    console.log();
  } else {
    console.log('✅ Good bot feedback volume!');
    console.log('   - Consider retraining model with bot feedback');
    console.log('   - Monitor feedback quality and diversity');
    console.log();
  }

  const successRate = (byOutcome.success / totalBotFeedback * 100);
  if (successRate < 50) {
    console.log('⚠️  Bot success rate is below 50%');
    console.log('   - Review bot decision-making logic');
    console.log('   - Check if quality predictions are accurate');
    console.log();
  } else {
    console.log(`✅ Bot success rate: ${successRate.toFixed(1)}%`);
    console.log();
  }
}

monitorBotFeedback().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
