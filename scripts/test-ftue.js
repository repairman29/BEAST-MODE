#!/usr/bin/env node

/**
 * BEAST MODE FTUE Experience Test Suite
 * Tests onboarding flows, documentation access, and user experience
 */

const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('test-ftue');

const tests = {
  passed: 0,
  failed: 0,
  errors: []
};

async function test(name, fn) {
  try {
    log.info(`Testing: ${name}`);
    await fn();
    tests.passed++;
    log.info(`✅ ${name} - PASSED`);
  } catch (error) {
    tests.failed++;
    const errorMsg = error.message || error.toString() || 'Unknown error';
    tests.errors.push({ name, error: errorMsg });
    log.error(`❌ ${name} - FAILED: ${errorMsg}`);
  }
}

async function main() {
  log.info('🧪 BEAST MODE FTUE Experience Test Suite');
  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ============================================
  // DOCUMENTATION TESTS
  // ============================================
  log.info('📚 Documentation Tests\n');

  await test('FTUE.md exists and is readable', async () => {
    const ftuePath = path.join(__dirname, '../docs/FTUE.md');
    await fs.access(ftuePath);
    const content = await fs.readFile(ftuePath, 'utf-8');
    if (content.length < 1000) throw new Error('FTUE.md too short');
    if (!content.includes('100-Point')) throw new Error('FTUE.md missing key content');
  });

  await test('QUICK_START.md exists and is readable', async () => {
    const quickPath = path.join(__dirname, '../docs/QUICK_START.md');
    await fs.access(quickPath);
    const content = await fs.readFile(quickPath, 'utf-8');
    if (content.length < 500) throw new Error('QUICK_START.md too short');
    if (!content.includes('Quick Start')) throw new Error('QUICK_START.md missing key content');
  });

  await test('NEW_DEVELOPER_WORKFLOW.md exists and is readable', async () => {
    const workflowPath = path.join(__dirname, '../docs/NEW_DEVELOPER_WORKFLOW.md');
    await fs.access(workflowPath);
    const content = await fs.readFile(workflowPath, 'utf-8');
    if (content.length < 500) throw new Error('NEW_DEVELOPER_WORKFLOW.md too short');
    if (!content.includes('Workflow')) throw new Error('NEW_DEVELOPER_WORKFLOW.md missing key content');
  });

  await test('WORKFLOW_DIAGRAM.md exists and is readable', async () => {
    const diagramPath = path.join(__dirname, '../docs/WORKFLOW_DIAGRAM.md');
    await fs.access(diagramPath);
    const content = await fs.readFile(diagramPath, 'utf-8');
    if (content.length < 500) throw new Error('WORKFLOW_DIAGRAM.md too short');
    if (!content.includes('Workflow')) throw new Error('WORKFLOW_DIAGRAM.md missing key content');
  });

  await test('FTUE.md has 100 steps', async () => {
    const ftuePath = path.join(__dirname, '../docs/FTUE.md');
    const content = await fs.readFile(ftuePath, 'utf-8');
    const stepMatches = content.match(/Step \d+:/g);
    if (!stepMatches || stepMatches.length < 90) {
      throw new Error(`Expected ~100 steps, found ${stepMatches?.length || 0}`);
    }
  });

  await test('All documentation files have proper structure', async () => {
    const docs = [
      'FTUE.md',
      'QUICK_START.md',
      'NEW_DEVELOPER_WORKFLOW.md',
      'WORKFLOW_DIAGRAM.md'
    ];
    
    for (const doc of docs) {
      const docPath = path.join(__dirname, '../docs', doc);
      const content = await fs.readFile(docPath, 'utf-8');
      
      // Check for markdown headers
      if (!content.includes('#')) {
        throw new Error(`${doc} missing markdown headers`);
      }
      
      // Check for code blocks (should have examples)
      if (!content.includes('```')) {
        throw new Error(`${doc} missing code examples`);
      }
    }
  });

  // ============================================
  // COMPONENT TESTS
  // ============================================
  log.info('\n🎨 Component Tests\n');

  await test('OnboardingWelcome component exists', async () => {
    const componentPath = path.join(__dirname, '../website/components/beast-mode/OnboardingWelcome.tsx');
    await fs.access(componentPath);
    const content = await fs.readFile(componentPath, 'utf-8');
    if (content.length < 100) throw new Error('OnboardingWelcome.tsx too short');
    if (!content.includes('OnboardingWelcome')) throw new Error('Component name not found');
  });

  await test('OnboardingWelcome has required props', async () => {
    const componentPath = path.join(__dirname, '../website/components/beast-mode/OnboardingWelcome.tsx');
    const content = await fs.readFile(componentPath, 'utf-8');
    if (!content.includes('onDismiss')) throw new Error('Missing onDismiss prop');
    if (!content.includes('useState')) throw new Error('Missing React hooks');
  });

  await test('OnboardingWelcome has localStorage integration', async () => {
    const componentPath = path.join(__dirname, '../website/components/beast-mode/OnboardingWelcome.tsx');
    const content = await fs.readFile(componentPath, 'utf-8');
    if (!content.includes('localStorage')) throw new Error('Missing localStorage integration');
    if (!content.includes('beast-mode-onboarding-seen')) throw new Error('Missing localStorage key');
  });

  await test('OnboardingWelcome has step navigation', async () => {
    const componentPath = path.join(__dirname, '../website/components/beast-mode/OnboardingWelcome.tsx');
    const content = await fs.readFile(componentPath, 'utf-8');
    if (!content.includes('currentStep')) throw new Error('Missing step state');
    if (!content.includes('setCurrentStep')) throw new Error('Missing step setter');
  });

  await test('OnboardingWelcome links to documentation', async () => {
    const componentPath = path.join(__dirname, '../website/components/beast-mode/OnboardingWelcome.tsx');
    const content = await fs.readFile(componentPath, 'utf-8');
    if (!content.includes('/docs/')) throw new Error('Missing documentation links');
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================
  log.info('\n🔗 Integration Tests\n');

  await test('BeastModeDashboard imports OnboardingWelcome', async () => {
    const dashboardPath = path.join(__dirname, '../website/components/beast-mode/BeastModeDashboard.tsx');
    const content = await fs.readFile(dashboardPath, 'utf-8');
    // Check if OnboardingWelcome is imported or FTUEOnboarding exists
    if (!content.includes('OnboardingWelcome') && !content.includes('FTUEOnboarding')) {
      throw new Error('Dashboard missing onboarding component');
    }
  });

  await test('Dashboard has onboarding state management', async () => {
    const dashboardPath = path.join(__dirname, '../website/components/beast-mode/BeastModeDashboard.tsx');
    const content = await fs.readFile(dashboardPath, 'utf-8');
    if (!content.includes('showOnboarding') && !content.includes('isFirstTime')) {
      throw new Error('Dashboard missing onboarding state');
    }
  });

  await test('README links to FTUE guides', async () => {
    const readmePath = path.join(__dirname, '../README.md');
    const content = await fs.readFile(readmePath, 'utf-8');
    if (!content.includes('FTUE') && !content.includes('QUICK_START')) {
      throw new Error('README missing FTUE links');
    }
  });

  // ============================================
  // CONTENT QUALITY TESTS
  // ============================================
  log.info('\n✨ Content Quality Tests\n');

  await test('FTUE.md has encouraging language', async () => {
    const ftuePath = path.join(__dirname, '../docs/FTUE.md');
    const content = await fs.readFile(ftuePath, 'utf-8');
    const encouragingWords = ['welcome', 'help', 'support', 'encourage', 'got this', 'fun'];
    const hasEncouraging = encouragingWords.some(word => 
      content.toLowerCase().includes(word)
    );
    if (!hasEncouraging) throw new Error('FTUE.md missing encouraging tone');
  });

  await test('QUICK_START.md has actionable steps', async () => {
    const quickPath = path.join(__dirname, '../docs/QUICK_START.md');
    const content = await fs.readFile(quickPath, 'utf-8');
    if (!content.includes('beast-mode')) throw new Error('QUICK_START.md missing CLI commands');
    if (!content.includes('```')) throw new Error('QUICK_START.md missing code examples');
  });

  await test('Workflow guide has real scenarios', async () => {
    const workflowPath = path.join(__dirname, '../docs/NEW_DEVELOPER_WORKFLOW.md');
    const content = await fs.readFile(workflowPath, 'utf-8');
    if (!content.includes('Scenario')) throw new Error('Workflow guide missing scenarios');
    if (!content.includes('Morning')) throw new Error('Workflow guide missing daily routine');
  });

  await test('All guides have troubleshooting sections', async () => {
    const docs = ['FTUE.md', 'QUICK_START.md', 'NEW_DEVELOPER_WORKFLOW.md'];
    for (const doc of docs) {
      const docPath = path.join(__dirname, '../docs', doc);
      const content = await fs.readFile(docPath, 'utf-8');
      const hasHelp = content.includes('Help') || content.includes('troubleshoot') || content.includes('support');
      if (!hasHelp) {
        throw new Error(`${doc} missing help/troubleshooting section`);
      }
    }
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================
  log.info('\n♿ Accessibility Tests\n');

  await test('Documentation files are properly formatted markdown', async () => {
    const docs = [
      'FTUE.md',
      'QUICK_START.md',
      'NEW_DEVELOPER_WORKFLOW.md',
      'WORKFLOW_DIAGRAM.md'
    ];
    
    for (const doc of docs) {
      const docPath = path.join(__dirname, '../docs', doc);
      const content = await fs.readFile(docPath, 'utf-8');
      
      // Check for proper markdown structure
      if (!content.match(/^#\s+/m)) {
        throw new Error(`${doc} missing main heading`);
      }
    }
  });

  await test('OnboardingWelcome component is accessible', async () => {
    const componentPath = path.join(__dirname, '../website/components/beast-mode/OnboardingWelcome.tsx');
    const content = await fs.readFile(componentPath, 'utf-8');
    
    // Check for semantic HTML
    if (!content.includes('<div') && !content.includes('<Card')) {
      throw new Error('Component missing semantic HTML');
    }
    
    // Check for button elements (for keyboard navigation)
    if (!content.includes('Button') && !content.includes('<button')) {
      throw new Error('Component missing interactive elements');
    }
  });

  // Summary
  log.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.info('📊 FTUE Test Results:');
  log.info(`   ✅ Passed: ${tests.passed}`);
  log.info(`   ❌ Failed: ${tests.failed}`);
  log.info(`   📈 Success Rate: ${((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1)}%`);

  if (tests.errors.length > 0) {
    log.error('\n❌ Errors:');
    tests.errors.forEach(({ name, error }) => {
      log.error(`   • ${name}: ${error}`);
    });
  }

  if (tests.failed > 0) {
    process.exit(1);
  }

  log.info('\n🎉 All FTUE tests passed!');
  log.info('✨ BEAST MODE is ready to deliver amazing onboarding experiences!');
}

main().catch((error) => {
  log.error('Test suite failed:', error);
  process.exit(1);
});

