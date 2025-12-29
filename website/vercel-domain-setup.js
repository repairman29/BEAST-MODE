#!/usr/bin/env node

/**
 * BEAST MODE Domain Setup Helper
 * Helps configure beast-mode.dev domain in Vercel
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🌐 BEAST MODE Domain Setup Helper\n');

console.log('Current status:');
console.log('❌ beast-mode.dev returns 404');
console.log('🔒 Vercel subdomain requires authentication\n');

console.log('📋 To fix this, we need to:');
console.log('1. Check Vercel deployment status');
console.log('2. Configure domain settings');
console.log('3. Update DNS records');
console.log('4. Disable deployment protection (optional)\n');

rl.question('Do you want to proceed with domain setup? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('Domain setup cancelled.');
    rl.close();
    return;
  }

  console.log('\n🔍 Step 1: Checking Vercel deployment status...');

  try {
    // Check if Vercel CLI is available
    execSync('which vercel', { stdio: 'pipe' });
    console.log('✅ Vercel CLI found');
  } catch (error) {
    console.log('❌ Vercel CLI not found. Install with: npm i -g vercel');
    rl.close();
    return;
  }

  console.log('\n🔧 Step 2: Checking domain configuration...');

  // Check current domains
  try {
    const domains = execSync('cd /Users/jeffadkins/Smugglers/beast-mode-website && npx vercel domains ls', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('📋 Current domains:');
    console.log(domains);
  } catch (error) {
    console.log('⚠️  Could not check domains - you may need to run "vercel login" first');
  }

  console.log('\n🌐 Step 3: DNS Configuration for beast-mode.dev');
  console.log('Go to Porkbun and add these CNAME records:');
  console.log('• Host: @, Answer: cname.vercel-dns.com');
  console.log('• Host: www, Answer: cname.vercel-dns.com');
  console.log('• Host: _vercel, Answer: vc-domain-verify=beast-mode.dev,beast-mode-landing-7kg9opher');

  console.log('\n🔓 Step 4: Disabling Deployment Protection');
  console.log('In Vercel dashboard:');
  console.log('• Project Settings → Security → Deployment Protection');
  console.log('• Set to "Off" for public access');

  console.log('\n⏱️  Step 5: Wait for DNS propagation');
  console.log('DNS changes take 5-30 minutes to propagate globally.');

  console.log('\n🧪 Step 6: Test the domain');
  console.log('After DNS propagation, test:');
  console.log('curl -I https://beast-mode.dev');

  console.log('\n📞 Need help?');
  console.log('• Vercel docs: https://vercel.com/docs/domains');
  console.log('• Porkbun DNS: https://porkbun.com/products/domains');

  rl.close();
});
