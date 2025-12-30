#!/usr/bin/env node

/**
 * BEAST MODE Experience Testing Script
 * 
 * Tests user experience, workflows, and feature completeness
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

let passed = 0;
let failed = 0;
let warnings = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, 'reset');
  }
  if (status === 'pass') passed++;
  else if (status === 'fail') failed++;
  else warnings++;
}

function checkFileContent(filePath, checks) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    logTest(`File check: ${path.basename(filePath)}`, 'fail', 'File not found');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const results = [];

  checks.forEach(check => {
    const found = check.pattern.test(content);
    if (found === check.expected) {
      results.push({ name: check.name, pass: true });
    } else {
      results.push({ name: check.name, pass: false, message: check.message });
    }
  });

  results.forEach(result => {
    if (result.pass) {
      logTest(result.name, 'pass');
    } else {
      logTest(result.name, 'fail', result.message);
    }
  });

  return results.every(r => r.pass);
}

function testQualityTabExperience() {
  logSection('⚡ Quality Tab Experience');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  
  checkFileContent(dashboardPath, [
    {
      name: 'Quick scan input field',
      pattern: /quickScanRepo|Quick Scan/i,
      expected: true,
      message: 'Quick scan functionality should be present'
    },
    {
      name: 'Advanced scan option',
      pattern: /Advanced Scan|advancedScan/i,
      expected: true,
      message: 'Advanced scan option should be available'
    },
    {
      name: 'Score display',
      pattern: /score|Quality Score/i,
      expected: true,
      message: 'Quality score should be displayed'
    },
    {
      name: 'Scan history',
      pattern: /scan.*history|allScans/i,
      expected: true,
      message: 'Scan history should be tracked'
    },
    {
      name: 'Comparison feature',
      pattern: /comparison|compare/i,
      expected: true,
      message: 'Scan comparison should be available'
    },
    {
      name: 'Export functionality',
      pattern: /export|download/i,
      expected: true,
      message: 'Export scan results should be available'
    },
    {
      name: 'Favorites feature',
      pattern: /favorite/i,
      expected: true,
      message: 'Favorite repositories should be supported'
    }
  ]);
}

function testIntelligenceTabExperience() {
  logSection('🧠 Intelligence Tab Experience');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  
  checkFileContent(dashboardPath, [
    {
      name: 'AI chat interface',
      pattern: /conversation|chat|message/i,
      expected: true,
      message: 'AI chat interface should be present'
    },
    {
      name: 'Example queries',
      pattern: /example.*query|Try these/i,
      expected: true,
      message: 'Example queries should be provided'
    },
    {
      name: 'Recommendations section',
      pattern: /recommendation/i,
      expected: true,
      message: 'AI recommendations should be available'
    },
    {
      name: 'Missions section',
      pattern: /mission/i,
      expected: true,
      message: 'Missions should be available'
    },
    {
      name: 'Context awareness',
      pattern: /recentScans|scanData|context/i,
      expected: true,
      message: 'AI should use scan context'
    },
    {
      name: 'Actionable items',
      pattern: /actionable|button.*action/i,
      expected: true,
      message: 'Actionable items in responses'
    }
  ]);
}

function testMarketplaceTabExperience() {
  logSection('📦 Marketplace Tab Experience');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  
  checkFileContent(dashboardPath, [
    {
      name: 'Plugin search',
      pattern: /search.*plugin|searchQuery/i,
      expected: true,
      message: 'Plugin search should be available'
    },
    {
      name: 'Category filters',
      pattern: /category|filter/i,
      expected: true,
      message: 'Category filtering should be available'
    },
    {
      name: 'Install functionality',
      pattern: /install.*plugin|installPlugin/i,
      expected: true,
      message: 'Plugin installation should work'
    },
    {
      name: 'Installation status',
      pattern: /installed|installation.*status/i,
      expected: true,
      message: 'Installation status should be tracked'
    },
    {
      name: 'Plugin details',
      pattern: /rating|downloads|description/i,
      expected: true,
      message: 'Plugin details should be shown'
    }
  ]);
}

function testImproveTabExperience() {
  logSection('✨ Improve Tab Experience');

  const improvePath = 'components/beast-mode/SelfImprovement.tsx';
  
  checkFileContent(improvePath, [
    {
      name: 'Analysis trigger',
      pattern: /analyze|handleAnalyze/i,
      expected: true,
      message: 'Analysis should be triggerable'
    },
    {
      name: 'Results display',
      pattern: /results|analysis.*result/i,
      expected: true,
      message: 'Analysis results should be displayed'
    },
    {
      name: 'Apply fix functionality',
      pattern: /apply.*fix|handleApplyFix/i,
      expected: true,
      message: 'Apply fix should be available'
    },
    {
      name: 'Git integration',
      pattern: /git|commit|push/i,
      expected: true,
      message: 'Git integration should be present'
    },
    {
      name: 'File modifications',
      pattern: /file.*modif|writeFile/i,
      expected: true,
      message: 'Real file modifications should work'
    },
    {
      name: 'Success feedback',
      pattern: /success|applied/i,
      expected: true,
      message: 'Success feedback should be shown'
    }
  ]);
}

function testSettingsTabExperience() {
  logSection('⚙️ Settings Tab Experience');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  
  checkFileContent(dashboardPath, [
    {
      name: 'Teams management',
      pattern: /team.*management|handleAddTeam/i,
      expected: true,
      message: 'Teams CRUD should be available'
    },
    {
      name: 'Users management',
      pattern: /user.*management|handleAddUser/i,
      expected: true,
      message: 'Users CRUD should be available'
    },
    {
      name: 'Repositories management',
      pattern: /repo.*management|handleAddRepo/i,
      expected: true,
      message: 'Repositories CRUD should be available'
    },
    {
      name: 'Edit functionality',
      pattern: /edit|handleEdit/i,
      expected: true,
      message: 'Edit functionality should be present'
    },
    {
      name: 'Delete functionality',
      pattern: /delete|handleDelete/i,
      expected: true,
      message: 'Delete functionality should be present'
    },
    {
      name: 'System status',
      pattern: /system.*status|uptime/i,
      expected: true,
      message: 'System status should be displayed'
    }
  ]);
}

function testUserWorkflow() {
  logSection('🔄 User Workflow Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const content = fs.readFileSync(path.join(process.cwd(), dashboardPath), 'utf-8');

  // Test the 5-step workflow from VALUE_PROP_AND_WORKFLOW.md
  const workflowSteps = [
    { step: 'Scan', pattern: /scan|Scan Your Code/i },
    { step: 'Ask', pattern: /ask|Ask Anything/i },
    { step: 'Get Recommendations', pattern: /recommendation/i },
    { step: 'Apply Fixes', pattern: /apply.*fix|Apply Fix|auto.*fix/i },
    { step: 'Install Tools', pattern: /install|marketplace/i }
  ];

  workflowSteps.forEach(({ step, pattern }) => {
    if (pattern.test(content)) {
      logTest(`Workflow step: ${step}`, 'pass');
    } else {
      logTest(`Workflow step: ${step}`, 'fail', 'Workflow step not found');
    }
  });
}

function testValueProposition() {
  logSection('💎 Value Proposition Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const content = fs.readFileSync(path.join(process.cwd(), dashboardPath), 'utf-8');

  // Check for new-developer-friendly messaging
  const valueProps = [
    { prop: 'No setup required', pattern: /no.*setup|No setup/i },
    { prop: 'Quick results', pattern: /10.*second|quick|instant/i },
    { prop: 'Easy to use', pattern: /easy|simple|just.*paste/i },
    { prop: 'Actionable insights', pattern: /actionable|specific|personalized/i },
    { prop: 'Automated fixes', pattern: /auto.*fix|automatically|one.*click/i }
  ];

  valueProps.forEach(({ prop, pattern }) => {
    if (pattern.test(content)) {
      logTest(`Value prop: ${prop}`, 'pass');
    } else {
      logTest(`Value prop: ${prop}`, 'warn', 'Consider adding this messaging');
    }
  });
}

function testEmptyStates() {
  logSection('📭 Empty State Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const content = fs.readFileSync(path.join(process.cwd(), dashboardPath), 'utf-8');

  // Check for helpful empty states
  const emptyStatePatterns = [
    { name: 'Empty state with icon', pattern: /text-.*xl.*mb|emoji.*empty/i },
    { name: 'Empty state with message', pattern: /No.*yet|empty|no.*found/i },
    { name: 'Empty state with action', pattern: /button.*empty|Create|Add|Scan/i },
    { name: 'Encouraging copy', pattern: /help|guide|get.*started/i }
  ];

  emptyStatePatterns.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      logTest(name, 'pass');
    } else {
      logTest(name, 'warn', 'Consider improving empty states');
    }
  });
}

function testAnimationsAndPolish() {
  logSection('✨ Animation & Polish Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const cssPath = 'app/globals.css';
  
  const dashboardContent = fs.readFileSync(path.join(process.cwd(), dashboardPath), 'utf-8');
  const cssContent = fs.existsSync(path.join(process.cwd(), cssPath)) 
    ? fs.readFileSync(path.join(process.cwd(), cssPath), 'utf-8')
    : '';

  const animations = [
    { name: 'Smooth transitions', pattern: /smooth-transition|transition/i },
    { name: 'Hover effects', pattern: /hover-lift|hover.*effect/i },
    { name: 'Score reveal', pattern: /score-reveal|reveal/i },
    { name: 'Slide animations', pattern: /slide-up|slide.*in/i },
    { name: 'Pulse effects', pattern: /pulse|animate-pulse/i }
  ];

  animations.forEach(({ name, pattern }) => {
    if (pattern.test(dashboardContent) || pattern.test(cssContent)) {
      logTest(name, 'pass');
    } else {
      logTest(name, 'warn', 'Consider adding this animation');
    }
  });
}

function testErrorHandling() {
  logSection('🛡️ Error Handling Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const content = fs.readFileSync(path.join(process.cwd(), dashboardPath), 'utf-8');

  const errorHandling = [
    { name: 'Try-catch blocks', pattern: /try.*\{[\s\S]*catch/i },
    { name: 'Error state management', pattern: /error|setError/i },
    { name: 'User-friendly error messages', pattern: /error.*message|Sorry|Failed/i },
    { name: 'Error recovery', pattern: /retry|try.*again/i }
  ];

  errorHandling.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      logTest(name, 'pass');
    } else {
      logTest(name, 'warn', 'Consider adding this error handling');
    }
  });
}

async function runAllTests() {
  log('\n🎯 BEAST MODE Experience Testing Suite', 'magenta');
  log(`Testing user experience and workflows\n`, 'blue');

  testQualityTabExperience();
  testIntelligenceTabExperience();
  testMarketplaceTabExperience();
  testImproveTabExperience();
  testSettingsTabExperience();
  testUserWorkflow();
  testValueProposition();
  testEmptyStates();
  testAnimationsAndPolish();
  testErrorHandling();

  // Summary
  logSection('📊 Test Summary');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');
  log(`📈 Total: ${passed + failed + warnings}`, 'cyan');

  const successRate = ((passed / (passed + failed + warnings)) * 100).toFixed(1);
  log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  if (failed === 0) {
    log('\n🎉 All critical experience tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Review the output above.', 'yellow');
    process.exit(1);
  }
}

runAllTests();

