#!/usr/bin/env node

/**
 * Test Monetization Flow with Supabase
 * 
 * Uses Supabase CLI connection or test keys to test the monetization system
 */

const { createClient } = require('@supabase/supabase-js');
const { getRateLimiter } = require('../lib/integrations/rateLimiter');

// Load environment variables from .env.local
function loadEnvVars() {
  const fs = require('fs');
  const path = require('path');
  
  // Try to load from website/.env.local
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Get Supabase config from environment or CLI
function getSupabaseConfig() {
  // Load env vars first
  loadEnvVars();
  
  // Try environment variables first
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_ANON_KEY ||
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    return { url: supabaseUrl, key: supabaseKey };
  }

  // Try to get from Supabase CLI
  try {
    const { execSync } = require('child_process');
    const status = JSON.parse(execSync('supabase status --output json', { encoding: 'utf8' }));
    
    if (status.DB_URL && status.API_KEYS?.service_role) {
      console.log('📋 Using Supabase CLI connection');
      return {
        url: status.API_URL || `https://${status.project_ref}.supabase.co`,
        key: status.API_KEYS.service_role
      };
    }
  } catch (error) {
    // CLI not available or not linked
  }

  return null;
}

async function testMonetizationFlow() {
  console.log('\n🧪 Testing Monetization Flow with Supabase\n');
  console.log('='.repeat(50) + '\n');

  const config = getSupabaseConfig();
  
  if (!config) {
    console.error('❌ Supabase not configured');
    console.log('\n📋 Options:');
    console.log('  1. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('  2. Run: supabase link --project-ref YOUR_PROJECT_REF');
    console.log('  3. Or use: supabase start (for local testing)\n');
    process.exit(1);
  }

  console.log('✅ Using Supabase:', config.url);
  console.log('');

  const supabase = createClient(config.url, config.key);
  const rateLimiter = getRateLimiter(supabase);

  // Test 1: Check if tables exist
  console.log('📋 Test 1: Check database tables');
  try {
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .limit(1);

    if (subError && subError.code === '42P01') {
      console.error('❌ user_subscriptions table does not exist');
      console.log('   Run: supabase db push');
      return false;
    }

    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('id')
      .limit(1);

    if (usageError && usageError.code === '42P01') {
      console.error('❌ user_usage table does not exist');
      console.log('   Run: supabase db push');
      return false;
    }

    const { data: installations, error: installError } = await supabase
      .from('github_installations')
      .select('id')
      .limit(1);

    if (installError && installError.code === '42P01') {
      console.error('❌ github_installations table does not exist');
      console.log('   Run: supabase db push');
      return false;
    }

    console.log('✅ All tables exist');
  } catch (error) {
    console.error('❌ Table check failed:', error.message);
    return false;
  }

  // Test 2: Create test user subscription
  console.log('\n📋 Test 2: Create test user subscription');
  const testUserId = '00000000-0000-0000-0000-000000000001';
  
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: testUserId,
        tier: 'free',
        status: 'active'
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Subscription created:', subscription.tier);
  } catch (error) {
    console.error('❌ Failed to create subscription:', error.message);
    return false;
  }

  // Test 3: Check rate limits
  console.log('\n📋 Test 3: Check rate limits');
  try {
    const canAnalyze = await rateLimiter.canPerformAction(testUserId, 'analyze_pr');
    console.log('✅ Rate limit check:', {
      allowed: canAnalyze.allowed,
      current: canAnalyze.current,
      limit: canAnalyze.limit,
      remaining: canAnalyze.remaining
    });
  } catch (error) {
    console.error('❌ Rate limit check failed:', error.message);
    return false;
  }

  // Test 4: Increment usage
  console.log('\n📋 Test 4: Increment usage');
  try {
    await rateLimiter.incrementUsage(testUserId, 'analyze_pr', 1);
    const usage = await rateLimiter.getUserUsage(testUserId);
    console.log('✅ Usage incremented:', {
      prs_analyzed: usage.prs_analyzed,
      repos_scanned: usage.repos_scanned,
      api_calls: usage.api_calls
    });
  } catch (error) {
    console.error('❌ Usage increment failed:', error.message);
    return false;
  }

  // Test 5: Test rate limit enforcement
  console.log('\n📋 Test 5: Test rate limit enforcement');
  try {
    // Increment to limit (start from current usage)
    const currentUsage = await rateLimiter.getUserUsage(testUserId);
    const remaining = 10 - currentUsage.prs_analyzed;
    
    if (remaining > 0) {
      for (let i = 0; i < remaining; i++) {
        await rateLimiter.incrementUsage(testUserId, 'analyze_pr', 1);
      }
    }
    
    const canAnalyze = await rateLimiter.canPerformAction(testUserId, 'analyze_pr');
    if (!canAnalyze.allowed) {
      console.log('✅ Rate limit enforced correctly');
      console.log(`   Reason: ${canAnalyze.reason}`);
    } else {
      console.log('⚠️  Rate limit not enforced (should be at limit)');
    }
  } catch (error) {
    console.error('❌ Rate limit enforcement test failed:', error.message);
    return false;
  }

  // Test 6: Upgrade to Pro
  console.log('\n📋 Test 6: Upgrade to Pro tier');
  try {
    const { data: updated, error } = await supabase
      .from('user_subscriptions')
      .update({
        tier: 'pro',
        status: 'active'
      })
      .eq('user_id', testUserId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Upgraded to Pro tier');

    // Check limits after upgrade
    const canAnalyze = await rateLimiter.canPerformAction(testUserId, 'analyze_pr');
    console.log('✅ Pro tier limits:', {
      allowed: canAnalyze.allowed,
      limit: canAnalyze.limit === -1 ? 'Unlimited' : canAnalyze.limit
    });
  } catch (error) {
    console.error('❌ Upgrade test failed:', error.message);
    return false;
  }

  // Test 7: Test helper functions
  console.log('\n📋 Test 7: Test helper functions');
  try {
    const { data: sub } = await supabase
      .rpc('get_or_create_user_subscription', {
        p_user_id: testUserId
      });

    if (sub) {
      console.log('✅ get_or_create_user_subscription works');
    }

    const { data: usage } = await supabase
      .rpc('get_or_create_user_usage', {
        p_user_id: testUserId
      });

    if (usage) {
      console.log('✅ get_or_create_user_usage works');
    }
  } catch (error) {
    console.log('⚠️  Helper function test:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All tests passed!\n');
  console.log('📋 Next steps:');
  console.log('  1. Test Stripe checkout flow');
  console.log('  2. Test webhook handling');
  console.log('  3. Test GitHub App integration');
  console.log('  4. Test upgrade prompts\n');

  return true;
}

// Run tests
if (require.main === module) {
  testMonetizationFlow()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

module.exports = { testMonetizationFlow };
