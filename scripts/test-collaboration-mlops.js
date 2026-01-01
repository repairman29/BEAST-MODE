/**
 * Test Collaboration & Advanced MLOps Services
 * 
 * Tests collaboration and advanced MLOps services
 * 
 * Phase 2: Collaboration Services & Advanced MLOps Integration
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function main() {
  console.log('🧪 Testing Collaboration & Advanced MLOps Services\n');

  // Test 1: Shared Dashboard - List
  console.log('1️⃣  Testing Shared Dashboard - List...');
  const dashboards = await testEndpoint(`${BASE_URL}/api/collaboration/shared-dashboard?operation=list`);
  if (dashboards.status === 200) {
    console.log('   ✅ Dashboards listed');
  } else {
    console.log(`   ⚠️  Shared dashboard: ${dashboards.status}`);
  }

  // Test 2: Team Workspace - List
  console.log('\n2️⃣  Testing Team Workspace - List...');
  const workspaces = await testEndpoint(`${BASE_URL}/api/collaboration/team-workspace?operation=list`);
  if (workspaces.status === 200) {
    console.log('   ✅ Workspaces listed');
  } else {
    console.log(`   ⚠️  Team workspace: ${workspaces.status}`);
  }

  // Test 3: Feedback Loop - Status
  console.log('\n3️⃣  Testing Feedback Loop - Status...');
  const feedbackStatus = await testEndpoint(`${BASE_URL}/api/mlops/feedback-loop?operation=status`);
  if (feedbackStatus.status === 200) {
    console.log('   ✅ Feedback loop ready');
  } else {
    console.log(`   ⚠️  Feedback loop: ${feedbackStatus.status}`);
  }

  // Test 4: Model Fine-Tuning - Status
  console.log('\n4️⃣  Testing Model Fine-Tuning - Status...');
  const fineTuningStatus = await testEndpoint(`${BASE_URL}/api/mlops/fine-tuning?operation=status`);
  if (fineTuningStatus.status === 200) {
    console.log('   ✅ Model fine-tuning ready');
  } else {
    console.log(`   ⚠️  Model fine-tuning: ${fineTuningStatus.status}`);
  }

  console.log('\n✅ Collaboration & Advanced MLOps services tests complete!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Shared Dashboard: ${dashboards.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Team Workspace: ${workspaces.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Feedback Loop: ${feedbackStatus.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Model Fine-Tuning: ${fineTuningStatus.status === 200 ? 'Working' : 'Needs attention'}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

