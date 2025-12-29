#!/usr/bin/env node

/**
 * Fix BEAST MODE Domain Configuration
 * Sets up beast-mode.dev domain properly in Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing BEAST MODE Domain Configuration...\n');

try {
  // Check current Vercel project
  console.log('📊 Checking current Vercel project...');
  try {
    const projectInfo = execSync('cd /Users/jeffadkins/Smugglers/beast-mode-website && vercel --yes', {
      encoding: 'utf8'
    });
    console.log('✅ Vercel project linked');
  } catch (error) {
    console.log('⚠️  Vercel project not linked, linking now...');
    execSync('cd /Users/jeffadkins/Smugglers/beast-mode-website && vercel link --yes', {
      stdio: 'inherit'
    });
  }

  // Add domain to Vercel
  console.log('🌐 Adding beast-mode.dev domain...');
  try {
    execSync('cd /Users/jeffadkins/Smugglers/beast-mode-website && vercel domains add beast-mode.dev', {
      stdio: 'inherit'
    });
    console.log('✅ Domain added to Vercel');
  } catch (error) {
    console.log('⚠️  Domain might already be added or needs manual setup');
  }

  // Get DNS records
  console.log('📋 Getting DNS records for beast-mode.dev...');
  try {
    const dnsInfo = execSync('cd /Users/jeffadkins/Smugglers/beast-mode-website && vercel domains inspect beast-mode.dev', {
      encoding: 'utf8'
    });
    console.log('📋 DNS Records:');
    console.log(dnsInfo);
  } catch (error) {
    console.log('⚠️  Could not get DNS records - domain might not be verified yet');
  }

  // Deploy to production
  console.log('🚀 Deploying to production...');
  execSync('cd /Users/jeffadkins/Smugglers/beast-mode-website && vercel --prod', {
    stdio: 'inherit'
  });

  console.log('\n🎉 Domain configuration updated!');
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Porkbun (or your DNS provider)');
  console.log('2. Add the CNAME records shown above to beast-mode.dev');
  console.log('3. Wait 5-10 minutes for DNS propagation');
  console.log('4. Visit https://beast-mode.dev to verify');

  console.log('\n🔗 Current Vercel URL (should still work):');
  console.log('https://beast-mode-landing-7kg9opher-jeff-adkins-projects.vercel.app/');

} catch (error) {
  console.error('❌ Error fixing domain:', error.message);
  console.log('\n🔧 Manual Steps:');
  console.log('1. Go to vercel.com dashboard');
  console.log('2. Find your beast-mode project');
  console.log('3. Go to Settings → Domains');
  console.log('4. Add beast-mode.dev');
  console.log('5. Copy the DNS records to Porkbun');
}
