/**
 * Test Production Build Script
 * 
 * Tests the production build locally before deployment
 * 
 * Phase 1: Production Deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🧪 Testing Production Build\n');

  const websiteDir = path.join(__dirname, '../website');

  // Check if website directory exists
  if (!fs.existsSync(websiteDir)) {
    console.error('❌ Website directory not found');
    process.exit(1);
  }

  // Step 1: Install dependencies
  console.log('1️⃣  Installing dependencies...');
  try {
    execSync('npm install', { cwd: websiteDir, stdio: 'inherit' });
    console.log('   ✅ Dependencies installed\n');
  } catch (error) {
    console.error('   ❌ Failed to install dependencies');
    process.exit(1);
  }

  // Step 2: Build for production
  console.log('2️⃣  Building for production...');
  try {
    execSync('npm run build', { cwd: websiteDir, stdio: 'inherit' });
    console.log('   ✅ Production build successful\n');
  } catch (error) {
    console.error('   ❌ Production build failed');
    process.exit(1);
  }

  // Step 3: Check build output
  console.log('3️⃣  Verifying build output...');
  const buildDir = path.join(websiteDir, '.next');
  if (fs.existsSync(buildDir)) {
    console.log('   ✅ Build output exists');
  } else {
    console.error('   ❌ Build output not found');
    process.exit(1);
  }

  // Step 4: Check for API routes
  console.log('\n4️⃣  Verifying API routes...');
  const apiDir = path.join(websiteDir, 'app/api');
  if (fs.existsSync(apiDir)) {
    const apiRoutes = fs.readdirSync(apiDir, { recursive: true });
    console.log(`   ✅ Found ${apiRoutes.length} API route(s)`);
  } else {
    console.warn('   ⚠️  API directory not found');
  }

  // Step 5: Test health endpoint (if server is running)
  console.log('\n5️⃣  Testing health endpoint...');
  console.log('   ℹ️  Start server with: cd website && npm run start');
  console.log('   ℹ️  Then test: curl http://localhost:3000/api/health\n');

  console.log('✅ Production build test complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start production server: cd website && npm run start');
  console.log('   2. Test health endpoint: curl http://localhost:3000/api/health');
  console.log('   3. If all tests pass, deploy: cd website && vercel --prod --yes');

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

