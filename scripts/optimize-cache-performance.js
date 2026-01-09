#!/usr/bin/env node
/**
 * Optimize Cache Performance
 * 
 * High Priority: Target 40%+ cache hit rate (from 15%)
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🚀 Cache Performance Optimization Analysis\n');
console.log('='.repeat(70));
console.log();

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  Supabase credentials not found - showing recommendations only');
  console.log();
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);

  async function analyzeCachePerformance() {
    try {
      // Check monitoring data for cache stats
      const { data: monitoringData, error } = await supabase
        .from('custom_model_monitoring')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.log('⚠️  Could not fetch monitoring data:', error.message);
        console.log();
      } else if (monitoringData && monitoringData.length > 0) {
        const totalRequests = monitoringData.length;
        const cacheHits = monitoringData.filter(m => m.from_cache === true).length;
        const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

        console.log('📊 Current Cache Performance:');
        console.log(`   Total Requests: ${totalRequests}`);
        console.log(`   Cache Hits: ${cacheHits}`);
        console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
        console.log(`   Target: 40%+`);
        console.log();

        if (cacheHitRate < 40) {
          const gap = 40 - cacheHitRate;
          console.log(`⚠️  Cache hit rate is ${gap.toFixed(1)}% below target`);
          console.log();
        } else {
          console.log('✅ Cache hit rate meets target!');
          console.log();
        }
      }
    } catch (error) {
      console.log('⚠️  Error analyzing cache:', error.message);
      console.log();
    }
  }

  analyzeCachePerformance();
}

console.log('='.repeat(70));
console.log('💡 Cache Optimization Recommendations:');
console.log('='.repeat(70));
console.log();
console.log('1. ✅ Semantic Cache Matching');
console.log('   - Already implemented in multiTierCache.js');
console.log('   - Similar requests hit cache (not just exact matches)');
console.log();
console.log('2. ✅ Multi-Tier Cache');
console.log('   - L1: Memory (fastest, 1 hour TTL)');
console.log('   - L2: Redis (fast, 2 hours TTL)');
console.log('   - L3: Database (persistent, 24 hours TTL)');
console.log('   - Already implemented in multiTierCache.js');
console.log();
console.log('3. 🔧 Cache Warming Strategy');
console.log('   - Pre-warm common requests');
console.log('   - Warm cache on startup');
console.log('   - Warm cache for popular models');
console.log();
console.log('4. 🔧 Increase Cache TTL');
console.log('   - Current: L1=1h, L2=2h, L3=24h');
console.log('   - Consider: L1=2h, L2=4h, L3=48h for stable models');
console.log();
console.log('5. 🔧 Improve Cache Key Generation');
console.log('   - Normalize request parameters');
console.log('   - Ignore non-critical differences');
console.log('   - Use semantic similarity for matching');
console.log();
console.log('6. 📊 Monitor Cache Performance');
console.log('   - Track hit rates by model');
console.log('   - Track hit rates by endpoint');
console.log('   - Identify cache misses patterns');
console.log();
console.log('='.repeat(70));
console.log('🎯 Next Steps:');
console.log('='.repeat(70));
console.log();
console.log('1. Implement cache warming:');
console.log('   - Create cacheWarmer.js script');
console.log('   - Warm cache on server startup');
console.log('   - Warm cache for popular models');
console.log();
console.log('2. Monitor cache performance:');
console.log('   - Add cache metrics to monitoring dashboard');
console.log('   - Track hit rates over time');
console.log('   - Identify optimization opportunities');
console.log();
console.log('3. Tune cache TTLs:');
console.log('   - Test different TTL values');
console.log('   - Balance freshness vs hit rate');
console.log('   - Monitor cache size');
console.log();
