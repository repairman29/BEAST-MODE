#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Tests if we can connect to Supabase and query tables
 */

const path = require('path');
const { createLogger } = require('../lib/utils/logger');
const log = createLogger('TestSupabase');

async function testConnection() {
    log.info('🔍 Testing Supabase Connection...');
    log.info('='.repeat(60));

    try {
        // Try multiple paths to find config
        const possiblePaths = [
            path.join(__dirname, '../../smuggler-ai-gm/src/config'),
            path.join(process.cwd(), '../smuggler-ai-gm/src/config'),
            path.join(process.cwd(), 'smuggler-ai-gm/src/config')
        ];

        let config = null;
        let configPath = null;

        for (const configPathAttempt of possiblePaths) {
            try {
                delete require.cache[require.resolve(configPathAttempt)];
                config = require(configPathAttempt);
                configPath = configPathAttempt;
                log.info(`✅ Found config at: ${configPathAttempt}`);
                break;
            } catch (error) {
                log.debug(`  ❌ Not found: ${configPathAttempt}`);
            }
        }

        if (!config) {
            log.error('❌ Could not find config file');
            log.info('💡 Tried paths:');
            possiblePaths.forEach(p => log.info(`   - ${p}`));
            return;
        }

        // Check if getSupabaseService exists
        if (typeof config.getSupabaseService !== 'function') {
            log.warn('⚠️  config.getSupabaseService is not a function');
            log.info('📋 Config keys:', Object.keys(config));
            
            // Try direct access
            if (config.supabase) {
                log.info('✅ Found config.supabase directly');
                const supabaseConfig = config.supabase;
                log.info(`   URL: ${supabaseConfig.url ? '✅ Set' : '❌ Missing'}`);
                log.info(`   Service Role Key: ${supabaseConfig.serviceRoleKey ? '✅ Set' : '❌ Missing'}`);
                
                if (supabaseConfig.url && supabaseConfig.serviceRoleKey) {
                    await testDirectConnection(supabaseConfig);
                }
            }
            return;
        }

        const supabaseService = config.getSupabaseService();
        log.info('📊 Supabase Service Config:');
        log.info(`   URL: ${supabaseService.url ? '✅ Set' : '❌ Missing'}`);
        log.info(`   Service Role Key: ${supabaseService.serviceRoleKey ? '✅ Set (length: ' + supabaseService.serviceRoleKey.length + ')' : '❌ Missing'}`);

        if (!supabaseService.url || !supabaseService.serviceRoleKey) {
            log.warn('⚠️  Supabase credentials not fully configured');
            log.info('💡 Check your .env file for:');
            log.info('   - SUPABASE_URL');
            log.info('   - SUPABASE_SERVICE_ROLE_KEY');
            return;
        }

        // Test connection
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            supabaseService.url,
            supabaseService.serviceRoleKey
        );

        log.info('');
        log.info('🔌 Testing database connection...');

        // Test 1: Check if we can query a simple table
        const { data: feedbackData, error: feedbackError } = await supabase
            .from('ai_gm_quality_feedback')
            .select('count')
            .limit(1);

        if (feedbackError) {
            if (feedbackError.code === 'PGRST205') {
                log.warn('⚠️  Table ai_gm_quality_feedback does not exist');
            } else {
                log.error('❌ Error querying ai_gm_quality_feedback:', feedbackError.message);
            }
        } else {
            log.info('✅ Can query ai_gm_quality_feedback table');
        }

        // Test 2: Count records
        const { count: feedbackCount, error: countError } = await supabase
            .from('ai_gm_quality_feedback')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            if (countError.code === 'PGRST205') {
                log.warn('⚠️  Table ai_gm_quality_feedback does not exist');
            } else {
                log.warn('⚠️  Error counting:', countError.message);
            }
        } else {
            log.info(`📊 ai_gm_quality_feedback: ${feedbackCount || 0} records`);
        }

        // Test 3: Check explanations table
        const { count: expCount, error: expError } = await supabase
            .from('ai_gm_explanations')
            .select('*', { count: 'exact', head: true });

        if (expError) {
            if (expError.code === 'PGRST205') {
                log.warn('⚠️  Table ai_gm_explanations does not exist');
            } else {
                log.warn('⚠️  Error counting explanations:', expError.message);
            }
        } else {
            log.info(`📊 ai_gm_explanations: ${expCount || 0} records`);
        }

        // Test 4: Check ab_testing table
        const { count: abCount, error: abError } = await supabase
            .from('ai_gm_ab_testing')
            .select('*', { count: 'exact', head: true });

        if (abError) {
            if (abError.code === 'PGRST205') {
                log.warn('⚠️  Table ai_gm_ab_testing does not exist');
            } else {
                log.warn('⚠️  Error counting ab_testing:', abError.message);
            }
        } else {
            log.info(`📊 ai_gm_ab_testing: ${abCount || 0} records`);
        }

        log.info('');
        log.info('✅ Connection test complete!');

    } catch (error) {
        log.error('❌ Connection test failed:', error.message);
        log.error(error.stack);
    }
}

async function testDirectConnection(supabaseConfig) {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            supabaseConfig.url,
            supabaseConfig.serviceRoleKey
        );

        log.info('🔌 Testing direct connection...');
        const { data, error } = await supabase.from('ai_gm_quality_feedback').select('count').limit(1);
        
        if (error) {
            log.warn('⚠️  Direct connection test:', error.message);
        } else {
            log.info('✅ Direct connection successful!');
        }
    } catch (error) {
        log.error('❌ Direct connection failed:', error.message);
    }
}

if (require.main === module) {
    testConnection().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { testConnection };

