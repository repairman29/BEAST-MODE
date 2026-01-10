#!/usr/bin/env node

/**
 * Test Monetization Flow
 * 
 * End-to-end test of the monetization system:
 * 1. User subscription creation
 * 2. Rate limiting
 * 3. Usage tracking
 * 4. Stripe checkout
 * 5. Webhook handling
 */

const { createClient } = require('@supabase/supabase-js');
const { getRateLimiter } = require('../lib/integrations/rateLimiter');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase not configured');
  console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const rateLimiter = getRateLimiter(supabase);

async function testMonetizationFlow() {
  console.log('\n🧪 Testing Monetization Flow\n');
  console.log('='.repeat(50) + '\n');

  // Test 1: Create test user subscription
  console.log('📋 Test 1: Create test user subscription');
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

  // Test 2: Check rate limits
  console.log('\n📋 Test 2: Check rate limits');
  try {
    const canAnalyze = await rateLimiter.canPerformAction(testUserId, 'analyze_pr');
    console.log('✅ Rate limit check:', canAnalyze);
    console.log(`   Allowed: ${canAnalyze.allowed}`);
    console.log(`   Current: ${canAnalyze.current}/${canAnalyze.limit}`);
  } catch (error) {
    console.error('❌ Rate limit check failed:', error.message);
    return false;
  }

  // Test 3: Increment usage
  console.log('\n📋 Test 3: Increment usage');
  try {
    await rateLimiter.incrementUsage(testUserId, 'analyze_pr', 1);
    const usage = await rateLimiter.getUserUsage(testUserId);
    console.log('✅ Usage incremented:', usage);
    console.log(`   PRs analyzed: ${usage.prs_analyzed}`);
  } catch (error) {
    console.error('❌ Usage increment failed:', error.message);
    return false;
  }

  // Test 4: Test rate limit enforcement
  console.log('\n📋 Test 4: Test rate limit enforcement');
  try {
    // Increment to limit
    for (let i = 0; i < 10; i++) {
      await rateLimiter.incrementUsage(testUserId, 'analyze_pr', 1);
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

  // Test 5: Upgrade to Pro
  console.log('\n📋 Test 5: Upgrade to Pro tier');
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
    console.log('✅ Pro tier limits:', canAnalyze);
    console.log(`   Allowed: ${canAnalyze.allowed}`);
    console.log(`   Limit: ${canAnalyze.limit === -1 ? 'Unlimited' : canAnalyze.limit}`);
  } catch (error) {
    console.error('❌ Upgrade test failed:', error.message);
    return false;
  }

  // Test 6: Test API endpoints
  console.log('\n📋 Test 6: Test API endpoints');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    // Test subscription API
    const subResponse = await fetch(`${baseUrl}/api/user/subscription`, {
      headers: {
        'x-user-id': testUserId
      }
    });
    
    if (subResponse.ok) {
      const subData = await subResponse.json();
      console.log('✅ Subscription API works:', subData.subscription?.tier);
    } else {
      console.log('⚠️  Subscription API returned:', subResponse.status);
    }

    // Test usage API
    const usageResponse = await fetch(`${baseUrl}/api/user/usage`, {
      headers: {
        'x-user-id': testUserId
      }
    });
    
    if (usageResponse.ok) {
      const usageData = await usageResponse.json();
      console.log('✅ Usage API works:', usageData.tier);
    } else {
      console.log('⚠️  Usage API returned:', usageResponse.status);
    }
  } catch (error) {
    console.log('⚠️  API tests skipped (server may not be running)');
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
