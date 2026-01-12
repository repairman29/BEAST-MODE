#!/usr/bin/env node
/**
 * Verify GitHub OAuth configuration
 */

const path = require('path');
const fs = require('fs');

// Load .env.local
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
} catch (e) {}

const PROD_CLIENT_ID = 'Ov23liDKFkIrnPneWwny';
const PROD_CLIENT_SECRET = '014c7fab1ba6cc6a7398b5bde04e26463f16f4e9';
const DEV_CLIENT_ID = 'Ov23lidLvmp68FVMEqEB';
const DEV_CLIENT_SECRET = 'df4c598018de45ce8cb90313489eeb21448aedcf';

console.log('🔍 GitHub OAuth Configuration Check\n');

console.log('📋 Expected Values:');
console.log(`   Production Client ID: ${PROD_CLIENT_ID}`);
console.log(`   Production Client Secret: ${PROD_CLIENT_SECRET.substring(0, 10)}...`);
console.log(`   Dev Client ID: ${DEV_CLIENT_ID}`);
console.log(`   Dev Client Secret: ${DEV_CLIENT_SECRET.substring(0, 10)}...\n`);

console.log('📋 Environment Variables:');
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const githubClientSecretProd = process.env.GITHUB_CLIENT_SECRET_PROD;
const githubClientSecretDev = process.env.GITHUB_CLIENT_SECRET_DEV;
const secret = process.env.SECRET;
const nextPublicUrl = process.env.NEXT_PUBLIC_URL;

console.log(`   GITHUB_CLIENT_ID: ${githubClientId || 'NOT SET'}`);
console.log(`   GITHUB_CLIENT_SECRET: ${githubClientSecret ? githubClientSecret.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`   GITHUB_CLIENT_SECRET_PROD: ${githubClientSecretProd ? githubClientSecretProd.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`   GITHUB_CLIENT_SECRET_DEV: ${githubClientSecretDev ? githubClientSecretDev.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`   SECRET: ${secret ? secret.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`   NEXT_PUBLIC_URL: ${nextPublicUrl || 'NOT SET'}\n`);

// Determine environment
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production' || 
                     nextPublicUrl?.includes('beast-mode.dev') ||
                     process.env.VERCEL_ENV === 'production';

console.log(`🌍 Environment Detection:`);
console.log(`   NODE_ENV: ${nodeEnv}`);
console.log(`   NEXT_PUBLIC_URL: ${nextPublicUrl || 'not set'}`);
console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV || 'not set'}`);
console.log(`   Detected as: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}\n`);

// Determine what would be used
let clientId = null;
let clientSecret = null;

if (isProduction) {
  if (githubClientSecretProd && githubClientSecretProd.length > 20) {
    clientId = PROD_CLIENT_ID;
    clientSecret = githubClientSecretProd;
    console.log('✅ Would use: GITHUB_CLIENT_SECRET_PROD');
  } else if (githubClientSecret && githubClientSecret.length > 20 &&
             githubClientSecret !== '014c7fab1ba6cc6a7398b5bde04e26463f16f4e9') {
    clientId = PROD_CLIENT_ID;
    clientSecret = githubClientSecret;
    console.log('⚠️  Would use: GITHUB_CLIENT_SECRET (may not be correct for production)');
  } else if (secret && secret.length > 20) {
    clientId = PROD_CLIENT_ID;
    clientSecret = secret;
    console.log('⚠️  Would use: SECRET (may not be correct for production)');
  } else {
    console.log('❌ No valid production client secret found!');
  }
} else {
  if (githubClientSecretDev && githubClientSecretDev.length > 20) {
    clientId = DEV_CLIENT_ID;
    clientSecret = githubClientSecretDev;
    console.log('✅ Would use: GITHUB_CLIENT_SECRET_DEV');
  } else if (githubClientSecret && githubClientSecret.length > 20 &&
             githubClientSecret !== 'df4c598018de45ce8cb90313489eeb21448aedcf') {
    clientId = DEV_CLIENT_ID;
    clientSecret = githubClientSecret;
    console.log('⚠️  Would use: GITHUB_CLIENT_SECRET (may not be correct for development)');
  } else if (secret && secret.length > 20) {
    clientId = DEV_CLIENT_ID;
    clientSecret = secret;
    console.log('⚠️  Would use: SECRET (may not be correct for development)');
  } else {
    console.log('❌ No valid development client secret found!');
  }
}

if (clientId && clientSecret) {
  console.log(`\n✅ Configuration:`);
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 10)}... (length: ${clientSecret.length})`);
  
  // Verify secret matches expected
  if (isProduction) {
    if (clientSecret === PROD_CLIENT_SECRET) {
      console.log('   ✅ Secret matches expected production secret');
    } else {
      console.log('   ⚠️  Secret does NOT match expected production secret!');
      console.log(`   Expected: ${PROD_CLIENT_SECRET.substring(0, 10)}...`);
      console.log(`   Got: ${clientSecret.substring(0, 10)}...`);
    }
  } else {
    if (clientSecret === DEV_CLIENT_SECRET) {
      console.log('   ✅ Secret matches expected development secret');
    } else {
      console.log('   ⚠️  Secret does NOT match expected development secret!');
    }
  }
} else {
  console.log('\n❌ Configuration incomplete!');
}
