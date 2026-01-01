#!/usr/bin/env node

/**
 * Configure DNS for beast-mode.dev using Porkbun API
 * Sets up CNAME records pointing to Vercel
 */

const https = require('https');

const DOMAIN = 'beast-mode.dev';
const VERCEL_CNAME = 'cname.vercel-dns.com';

// Get API credentials from environment
const PORKBUN_API_KEY = process.env.PORKBUN_API_KEY;
const PORKBUN_SECRET_KEY = process.env.PORKBUN_SECRET_API_KEY;

if (!PORKBUN_API_KEY || !PORKBUN_SECRET_KEY) {
  console.error('❌ Missing Porkbun API credentials');
  console.error('');
  console.error('Please set environment variables:');
  console.error('  export PORKBUN_API_KEY=your_api_key');
  console.error('  export PORKBUN_SECRET_API_KEY=your_secret_key');
  console.error('');
  console.error('You can find these in your Porkbun account:');
  console.error('  https://porkbun.com/account/api');
  process.exit(1);
}

const PORKBUN_BASE_URL = 'https://api.porkbun.com/api/json/v3';

// Helper function for Porkbun API calls
function porkbunRequest(endpoint, data = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      apikey: PORKBUN_API_KEY,
      secretapikey: PORKBUN_SECRET_KEY,
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

  try {
    // Get current DNS records
    console.log('📋 Retrieving current DNS records...');
    const recordsResponse = await porkbunRequest(`dns/retrieve/${DOMAIN}`);

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
          await porkbunRequest(`dns/delete/${DOMAIN}/${record.id}`);
          console.log(`   ✅ Deleted ${record.type}: ${record.name || '@'} -> ${record.content}`);
        } catch (error) {
          console.warn(`   ⚠️  Failed to delete record ${record.id}: ${error.message}`);
        }
      }
      console.log('');
      // Wait a bit for DNS propagation
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
        });
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
            await porkbunRequest(`dns/delete/${DOMAIN}/${record.id}`);
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
        });
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

