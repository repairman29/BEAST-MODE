#!/usr/bin/env node

/**
 * Configure DNS for beast-mode.dev using Porkbun API
 * Gets credentials from Supabase or environment variables
 */

const https = require('https');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Try to load .env.local from website directory
try {
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  // Ignore errors loading .env.local
}

const DOMAIN = 'beast-mode.dev';
const VERCEL_CNAME = 'cname.vercel-dns.com';

// Try to get credentials from Supabase first, then environment
async function getPorkbunCredentials() {
  console.log('🔍 Retrieving Porkbun API credentials...\n');

  // First check environment variables
  if (process.env.PORKBUN_API_KEY && process.env.PORKBUN_SECRET_API_KEY) {
    console.log('   ✅ Found credentials in environment variables\n');
    return {
      apiKey: process.env.PORKBUN_API_KEY,
      secretKey: process.env.PORKBUN_SECRET_API_KEY
    };
  }

  // Try to get from Supabase
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('   ⚠️  Supabase credentials not found in environment');
      console.log('   Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY\n');
      return null;
    }

    console.log('   🔍 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, let's see what tables might have the data
    console.log('   🔍 Searching for Porkbun credentials in Supabase...');
    
    // Try multiple table structures and key names
    const searchPatterns = [
      // secrets table (preferred - JSONB structure)
      { table: 'secrets', key: 'porkbun_api', path: 'value' },
      { table: 'secrets', key: 'porkbun', path: 'value' },
      // app_config table (JSONB structure)
      { table: 'app_config', key: 'porkbun', path: 'value' },
      { table: 'app_config', key: 'porkbun_api', path: 'value' },
      // config table (simple key-value)
      { table: 'config', key: 'porkbun_api_key', path: 'value' },
      { table: 'config', key: 'PORKBUN_API_KEY', path: 'value' },
      { table: 'config', key: 'porkbun_secret_key', path: 'value' },
      { table: 'config', key: 'PORKBUN_SECRET_KEY', path: 'value' },
    ];

    for (const pattern of searchPatterns) {
      try {
        const { data, error } = await supabase
          .from(pattern.table)
          .select('*')
          .ilike('key', `%${pattern.key}%`)
          .limit(5);

        if (!error && data && data.length > 0) {
          console.log(`   ✅ Found ${data.length} record(s) in ${pattern.table}`);
          console.log(`   📋 Record keys: ${Object.keys(data[0]).join(', ')}`);
          
          // Try to extract credentials from the data
          for (const record of data) {
            let apiKey = null;
            let secretKey = null;

            // Handle JSONB structure (secrets, app_config)
            if (record.value && typeof record.value === 'object') {
              apiKey = record.value.api_key || record.value.apiKey || record.value.porkbun_api_key;
              secretKey = record.value.secret_key || record.value.secretKey || record.value.porkbun_secret_key;
            } 
            // Handle simple value structure
            else if (record.value) {
              if (record.key.toLowerCase().includes('api_key') || record.key.toLowerCase().includes('apikey')) {
                apiKey = record.value;
              } else if (record.key.toLowerCase().includes('secret')) {
                secretKey = record.value;
              }
            }
            // Handle direct fields
            else {
              apiKey = record.api_key || record.apiKey || record.porkbun_api_key;
              secretKey = record.secret_key || record.secretKey || record.porkbun_secret_key;
            }

            // If we found one key, try to find the other
            if (apiKey && !secretKey) {
              // Look for secret key
              const { data: secretData } = await supabase
                .from(pattern.table)
                .select('*')
                .ilike('key', `%porkbun%secret%`)
                .limit(1);
              
              if (secretData && secretData.length > 0) {
                const secretRecord = secretData[0];
                if (secretRecord.value && typeof secretRecord.value === 'object') {
                  secretKey = secretRecord.value.secret_key || secretRecord.value.secretKey;
                } else {
                  secretKey = secretRecord.value || secretRecord.secret_key || secretRecord.secretKey;
                }
              }
            }

            if (apiKey && secretKey) {
              console.log(`   ✅ Found credentials in ${pattern.table}\n`);
              return { apiKey, secretKey };
            }
          }
        }
      } catch (tableError) {
        // Table doesn't exist or other error, continue
        continue;
      }
    }

    // Try user_api_keys table (encrypted, need to decrypt) - PRIMARY SOURCE
    try {
      // First try exact match for porkbun
      let { data: keys, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .ilike('provider', '%porkbun%')
        .eq('is_active', true)
        .limit(1);
      
      // If not found, try by key_name
      if ((!keys || keys.length === 0) && !error) {
        const { data: keysByName } = await supabase
          .from('user_api_keys')
          .select('*')
          .ilike('key_name', '%porkbun%')
          .eq('is_active', true)
          .limit(1);
        keys = keysByName;
      }

      if (!error && keys && keys.length > 0) {
        console.log('   ✅ Found Porkbun keys in user_api_keys');
        const key = keys[0];
        console.log(`   Provider: ${key.provider}, Key name: ${key.key_name || 'N/A'}`);
        
        // Try to decrypt
        try {
          const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 'default_key_change_in_production';
          const parts = key.encrypted_key.split(':');
          if (parts.length === 3) {
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = Buffer.from(parts[2], 'hex');
            const keyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();
            
            const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            const decryptedText = decrypted.toString('utf8');
            
            // Try to parse as JSON (should contain both api_key and secret_key)
            try {
              const parsed = JSON.parse(decryptedText);
              if (parsed.api_key && parsed.secret_key) {
                console.log('   ✅ Successfully decrypted credentials from user_api_keys\n');
                return {
                  apiKey: parsed.api_key,
                  secretKey: parsed.secret_key
                };
              } else if (parsed.apiKey && parsed.secretKey) {
                console.log('   ✅ Successfully decrypted credentials from user_api_keys\n');
                return {
                  apiKey: parsed.apiKey,
                  secretKey: parsed.secretKey
                };
              }
            } catch (jsonError) {
              // Not JSON - might need to look for a second record for the secret
              console.log('   ⚠️  Decrypted value is not JSON, checking for separate secret key...');
              // The decrypted value might be just the API key, need to find secret separately
              // For now, if it's a single value, we'll need both records
            }
          } else {
            console.log('   ⚠️  Encrypted key format unexpected (expected 3 parts separated by :)');
          }
        } catch (decryptError) {
          console.log(`   ⚠️  Decryption failed: ${decryptError.message}`);
        }
      } else if (error) {
        console.log(`   ⚠️  Error querying user_api_keys: ${error.message}`);
      }
    } catch (e) {
      console.log(`   ⚠️  Error accessing user_api_keys: ${e.message}`);
    }

    // Try a broader search - get all records from common config tables
    console.log('   🔍 Performing broader search...');
    const allTables = ['app_config', 'config', 'secrets', 'api_config', 'domain_config'];
    for (const tableName of allTables) {
      try {
        const { data: allData, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(20);
        
        if (!error && allData && allData.length > 0) {
          console.log(`   📋 Found ${allData.length} records in ${tableName}`);
          // Look for any key that might contain porkbun
          const porkbunRecords = allData.filter(r => 
            (r.key && r.key.toLowerCase().includes('porkbun')) ||
            (r.name && r.name.toLowerCase().includes('porkbun'))
          );
          if (porkbunRecords.length > 0) {
            console.log(`   ✅ Found ${porkbunRecords.length} Porkbun-related record(s) in ${tableName}`);
            porkbunRecords.forEach(r => {
              console.log(`      Key: ${r.key || r.name}, Value type: ${typeof r.value}`);
            });
          }
        }
      } catch (e) {
        // Table doesn't exist
      }
    }

    console.log('   ❌ Could not find Porkbun credentials in Supabase');
    console.log('   💡 Tip: Check if credentials are stored with different key names or in a different table\n');
  } catch (error) {
    console.log(`   ⚠️  Error querying Supabase: ${error.message}\n`);
  }

  return null;
}

const PORKBUN_BASE_URL = 'https://api.porkbun.com/api/json/v3';

function porkbunRequest(endpoint, data = {}, apiKey, secretKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      apikey: apiKey,
      secretapikey: secretKey,
      ...data
    });

    const url = new URL(`${PORKBUN_BASE_URL}/${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.status === 'ERROR' || parsed.error) {
            const errorMsg = parsed.message || parsed.error || 'Porkbun API error';
            reject(new Error(errorMsg));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

async function setupDNS() {
  console.log(`🌐 Configuring DNS for ${DOMAIN} via Porkbun API`);
  console.log('========================================================\n');

  // Get credentials
  const credentials = await getPorkbunCredentials();
  if (!credentials) {
    console.error('❌ Missing Porkbun API credentials');
    console.error('');
    console.error('Please set environment variables:');
    console.error('  export PORKBUN_API_KEY=your_api_key');
    console.error('  export PORKBUN_SECRET_API_KEY=your_secret_key');
    console.error('');
    console.error('Or configure in Supabase config table:');
    console.error('  key: porkbun_api_key');
    console.error('  key: porkbun_secret_key');
    console.error('');
    console.error('You can find API credentials in your Porkbun account:');
    console.error('  https://porkbun.com/account/api');
    process.exit(1);
  }

  const { apiKey, secretKey } = credentials;

  try {
    // Get current DNS records
    console.log('📋 Retrieving current DNS records...');
    const recordsResponse = await porkbunRequest(`dns/retrieve/${DOMAIN}`, {}, apiKey, secretKey);

    if (recordsResponse.status === 'ERROR') {
      console.error('❌ Failed to retrieve DNS records:', recordsResponse.message);
      process.exit(1);
    }

    const records = recordsResponse.records || [];
    console.log(`   Found ${records.length} existing records\n`);

    // Find existing root domain records (@ or empty name)
    const rootRecords = records.filter(r => 
      (!r.name || r.name === '' || r.name === '@' || r.name === DOMAIN)
    );

    // Delete conflicting root domain records
    if (rootRecords.length > 0) {
      console.log(`🗑️  Deleting ${rootRecords.length} existing root domain record(s)...`);
      for (const record of rootRecords) {
        try {
          await porkbunRequest(`dns/delete/${DOMAIN}/${record.id}`, {}, apiKey, secretKey);
          console.log(`   ✅ Deleted ${record.type}: ${record.name || '@'} -> ${record.content}`);
        } catch (error) {
          console.warn(`   ⚠️  Failed to delete record ${record.id}: ${error.message}`);
        }
      }
      console.log('');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Check if correct CNAME already exists
    const correctRootCNAME = rootRecords.find(r => 
      r.type === 'CNAME' && r.content === VERCEL_CNAME
    );

    if (correctRootCNAME) {
      console.log(`✅ Root domain CNAME already points to Vercel\n`);
    } else {
      // Create CNAME for root domain
      console.log(`➕ Creating CNAME record: @ -> ${VERCEL_CNAME}`);
      try {
        const result = await porkbunRequest(`dns/create/${DOMAIN}`, {
          type: 'CNAME',
          name: '',
          content: VERCEL_CNAME,
          ttl: 600
        }, apiKey, secretKey);
        console.log(`   ✅ Root CNAME created (ID: ${result.id || 'N/A'})\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`   ❌ Failed to create root CNAME: ${error.message}`);
      }
    }

    // Handle www subdomain
    const wwwRecords = records.filter(r => 
      r.name === 'www' || r.name === `www.${DOMAIN}`
    );

    const correctWWW = wwwRecords.find(r => 
      r.type === 'CNAME' && r.content === VERCEL_CNAME
    );

    if (correctWWW) {
      console.log(`✅ www CNAME already points to Vercel\n`);
    } else {
      // Delete existing www records
      if (wwwRecords.length > 0) {
        console.log(`🗑️  Deleting ${wwwRecords.length} existing www record(s)...`);
        for (const record of wwwRecords) {
          try {
            await porkbunRequest(`dns/delete/${DOMAIN}/${record.id}`, {}, apiKey, secretKey);
            console.log(`   ✅ Deleted ${record.type}: ${record.name} -> ${record.content}`);
          } catch (error) {
            console.warn(`   ⚠️  Failed to delete record ${record.id}: ${error.message}`);
          }
        }
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Create www CNAME
      console.log(`➕ Creating www CNAME: www -> ${VERCEL_CNAME}`);
      try {
        const result = await porkbunRequest(`dns/create/${DOMAIN}`, {
          type: 'CNAME',
          name: 'www',
          content: VERCEL_CNAME,
          ttl: 600
        }, apiKey, secretKey);
        console.log(`   ✅ www CNAME created (ID: ${result.id || 'N/A'})\n`);
      } catch (error) {
        console.error(`   ❌ Failed to create www CNAME: ${error.message}`);
      }
    }

    console.log('✅ DNS configuration complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Root domain (@) → ${VERCEL_CNAME}`);
    console.log(`   • www subdomain → ${VERCEL_CNAME}`);
    console.log('');
    console.log('⏱️  DNS propagation typically takes 5-30 minutes');
    console.log(`🌐 After propagation, visit: https://${DOMAIN}`);
    console.log('');
    console.log('🔍 Verify DNS with:');
    console.log(`   dig ${DOMAIN} +short`);
    console.log(`   nslookup ${DOMAIN}`);

  } catch (error) {
    console.error('❌ DNS configuration failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the setup
setupDNS();

