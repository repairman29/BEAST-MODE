#!/usr/bin/env node
/**
 * Start Bot Feedback Collection
 * 
 * Critical Priority: Collect 50+ bot feedback examples
 * This is the foundation for ML improvement
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Try multiple env paths
const envPaths = [
  path.join(__dirname, '../echeo-landing/.env.local'),
  path.join(__dirname, '../website/.env.local'),
  path.join(__dirname, '../.env.local'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (require('fs').existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    envLoaded = true;
    break;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentFeedback() {
  console.log('📊 Checking Current Bot Feedback Status\n');
  console.log('='.repeat(70));
  console.log();

  // Check bot feedback in ml_feedback table
  const { data: botFeedback, error } = await supabase
    .from('ml_feedback')
    .select('*')
    .eq('service_name', 'beast-mode')
    .or('metadata->>source.eq.bot-outcome-recording,metadata->>source.eq.test-bot-feedback-generator,metadata->>botName.not.is.null')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching bot feedback:', error.message);
    return;
  }

  const totalBotFeedback = botFeedback?.length || 0;
  const targetFeedback = 50;

  console.log(`📈 Bot Feedback Status:`);
  console.log(`   Current: ${totalBotFeedback} examples`);
  console.log(`   Target:  ${targetFeedback} examples`);
  console.log(`   Remaining: ${Math.max(0, targetFeedback - totalBotFeedback)}`);
  console.log();

  if (totalBotFeedback >= targetFeedback) {
    console.log('✅ Target reached! Ready for ML training.');
    console.log();
    return;
  }

  // Group by bot
  const byBot = {};
  botFeedback?.forEach(f => {
    const botName = f.metadata?.botName || f.service_name || 'unknown';
    byBot[botName] = (byBot[botName] || 0) + 1;
  });

  console.log('🤖 Feedback by Bot:');
  Object.entries(byBot).forEach(([bot, count]) => {
    console.log(`   ${bot}: ${count}`);
  });
  console.log();

  // Check predictions without feedback
  const { data: predictionsWithoutFeedback, error: predError } = await supabase
    .from('ml_predictions')
    .select('id, predicted_value, context')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .is('actual_value', null)
    .limit(100);

  if (!predError && predictionsWithoutFeedback) {
    console.log(`💡 ${predictionsWithoutFeedback.length} predictions available for feedback`);
    console.log();
  }

  console.log('='.repeat(70));
  console.log('🎯 Next Steps:');
  console.log('='.repeat(70));
  console.log();
  console.log('1. Trigger bot tasks to generate real feedback:');
  console.log('   - Code Roach: Apply a test fix');
  console.log('   - AI GM: Generate a test narrative');
  console.log('   - Oracle: Run a test search');
  console.log('   - Daisy Chain: Process a test task');
  console.log();
  console.log('2. Monitor feedback collection:');
  console.log('   node scripts/monitor-bot-feedback.js');
  console.log();
  console.log('3. Check dashboard:');
  console.log('   http://localhost:3000/admin/feedback');
  console.log();
  console.log('4. Once you have 50+ examples, retrain model:');
  console.log('   npm run ml:train');
  console.log();
}

async function main() {
  await checkCurrentFeedback();
}

main().catch(console.error);
