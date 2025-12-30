#!/usr/bin/env node

/**
 * BEAST MODE UI/UX Testing Script
 * 
 * Tests UI components, accessibility, and user experience
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

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    logTest(`${description} exists`, 'pass', filePath);
    return true;
  } else {
    logTest(`${description} exists`, 'fail', `Missing: ${filePath}`);
    return false;
  }
}

function checkComponentStructure(filePath, requiredElements) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    logTest(`Component structure: ${path.basename(filePath)}`, 'fail', 'File not found');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const issues = [];
  
  requiredElements.forEach(element => {
    if (!content.includes(element)) {
      issues.push(`Missing: ${element}`);
    }
  });

  if (issues.length === 0) {
    logTest(`Component structure: ${path.basename(filePath)}`, 'pass', 'All required elements found');
    return true;
  } else {
    logTest(`Component structure: ${path.basename(filePath)}`, 'warn', issues.join(', '));
    return false;
  }
}

function checkForAnimations(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return false;
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const animationClasses = [
    'smooth-transition',
    'hover-lift',
    'slide-up',
    'score-reveal',
    'pulse-glow',
    'bounce-in'
  ];
  
  const found = animationClasses.filter(cls => content.includes(cls));
  return found.length;
}

function testComponentFiles() {
  logSection('📦 Component File Tests');

  const components = [
    'components/beast-mode/BeastModeDashboard.tsx',
    'components/beast-mode/Sidebar.tsx',
    'components/beast-mode/SelfImprovement.tsx',
    'components/ui/button.tsx',
    'components/ui/card.tsx',
    'app/globals.css'
  ];

  components.forEach(comp => {
    checkFileExists(comp, path.basename(comp));
  });
}

function testDashboardComponent() {
  logSection('🎯 Dashboard Component Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const fullPath = path.join(process.cwd(), dashboardPath);
  
  if (!fs.existsSync(fullPath)) {
    logTest('Dashboard component exists', 'fail');
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for all tab views
  const requiredViews = [
    'QualityView',
    'IntelligenceView',
    'MarketplaceView',
    'SettingsView'
  ];

  requiredViews.forEach(view => {
    if (content.includes(`function ${view}`) || content.includes(`const ${view}`)) {
      logTest(`${view} component exists`, 'pass');
    } else {
      logTest(`${view} component exists`, 'fail');
    }
  });

  // Check for error handling
  if (content.includes('catch') && content.includes('error')) {
    logTest('Error handling present', 'pass');
  } else {
    logTest('Error handling present', 'warn', 'Some error handling may be missing');
  }

  // Check for loading states
  if (content.includes('isLoading') || content.includes('loading')) {
    logTest('Loading states implemented', 'pass');
  } else {
    logTest('Loading states implemented', 'warn');
  }

  // Check for empty states
  if (content.includes('No ') && (content.includes('yet') || content.includes('empty'))) {
    logTest('Empty states implemented', 'pass');
  } else {
    logTest('Empty states implemented', 'warn');
  }
}

function testAnimations() {
  logSection('✨ Animation Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const cssPath = 'app/globals.css';
  
  const animCount = checkForAnimations(dashboardPath);
  if (animCount > 0) {
    logTest('Animations in dashboard', 'pass', `Found ${animCount} animation classes`);
  } else {
    logTest('Animations in dashboard', 'warn', 'No animation classes found');
  }

  if (fs.existsSync(path.join(process.cwd(), cssPath))) {
    const cssContent = fs.readFileSync(path.join(process.cwd(), cssPath), 'utf-8');
    if (cssContent.includes('@keyframes') || cssContent.includes('animation:')) {
      logTest('CSS animations defined', 'pass');
    } else {
      logTest('CSS animations defined', 'warn');
    }
  }
}

function testAPIStructure() {
  logSection('🔌 API Route Structure Tests');

  const apiRoutes = [
    'app/api/github/scan/route.ts',
    'app/api/beast-mode/conversation/route.ts',
    'app/api/beast-mode/marketplace/recommendations/route.ts',
    'app/api/beast-mode/missions/route.ts',
    'app/api/beast-mode/self-improve/route.ts',
    'app/api/beast-mode/enterprise/teams/route.ts',
    'app/api/beast-mode/enterprise/users/route.ts',
    'app/api/beast-mode/enterprise/repos/route.ts'
  ];

  apiRoutes.forEach(route => {
    checkFileExists(route, path.basename(route, '.ts'));
    
    // Check for proper error handling
    const fullPath = path.join(process.cwd(), route);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('try') && content.includes('catch')) {
        logTest(`Error handling: ${path.basename(route)}`, 'pass');
      } else {
        logTest(`Error handling: ${path.basename(route)}`, 'warn');
      }
    }
  });
}

function testAccessibility() {
  logSection('♿ Accessibility Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const fullPath = path.join(process.cwd(), dashboardPath);
  
  if (!fs.existsSync(fullPath)) return;
  
  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for semantic HTML
  if (content.includes('<button') || content.includes('Button')) {
    logTest('Buttons use semantic elements', 'pass');
  } else {
    logTest('Buttons use semantic elements', 'warn');
  }

  // Check for ARIA labels or alt text
  if (content.includes('aria-') || content.includes('alt=') || content.includes('role=')) {
    logTest('ARIA attributes present', 'pass');
  } else {
    logTest('ARIA attributes present', 'warn', 'Consider adding ARIA labels for better accessibility');
  }

  // Check for keyboard navigation
  if (content.includes('onKeyPress') || content.includes('onKeyDown') || content.includes('tabIndex')) {
    logTest('Keyboard navigation support', 'pass');
  } else {
    logTest('Keyboard navigation support', 'warn', 'Some keyboard shortcuts may be missing');
  }
}

function testResponsiveDesign() {
  logSection('📱 Responsive Design Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const fullPath = path.join(process.cwd(), dashboardPath);
  
  if (!fs.existsSync(fullPath)) return;
  
  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for responsive classes
  const responsiveClasses = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  const found = responsiveClasses.filter(cls => content.includes(cls));
  
  if (found.length >= 3) {
    logTest('Responsive breakpoints used', 'pass', `Found ${found.length} breakpoint prefixes`);
  } else {
    logTest('Responsive breakpoints used', 'warn', `Only found ${found.length} breakpoint prefixes`);
  }

  // Check for mobile-friendly patterns
  if (content.includes('flex-col') && content.includes('sm:flex-row')) {
    logTest('Mobile-first flex patterns', 'pass');
  } else {
    logTest('Mobile-first flex patterns', 'warn');
  }
}

function testCodeQuality() {
  logSection('🔍 Code Quality Tests');

  const dashboardPath = 'components/beast-mode/BeastModeDashboard.tsx';
  const fullPath = path.join(process.cwd(), dashboardPath);
  
  if (!fs.existsSync(fullPath)) return;
  
  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for TypeScript types
  if (content.includes(': any') && content.includes('interface')) {
    const anyCount = (content.match(/: any/g) || []).length;
    const interfaceCount = (content.match(/interface/g) || []).length;
    if (interfaceCount > anyCount) {
      logTest('TypeScript types used', 'pass', `${interfaceCount} interfaces found`);
    } else {
      logTest('TypeScript types used', 'warn', `Many 'any' types found - consider stricter typing`);
    }
  }

  // Check for console.logs (should be minimal in production)
  const consoleLogs = (content.match(/console\.log/g) || []).length;
  if (consoleLogs === 0) {
    logTest('No console.logs in production code', 'pass');
  } else if (consoleLogs < 5) {
    logTest('No console.logs in production code', 'warn', `${consoleLogs} console.logs found`);
  } else {
    logTest('No console.logs in production code', 'fail', `${consoleLogs} console.logs found - remove for production`);
  }

  // Check for error boundaries
  if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
    logTest('Error boundaries implemented', 'pass');
  } else {
    logTest('Error boundaries implemented', 'warn', 'Consider adding error boundaries');
  }
}

async function runAllTests() {
  log('\n🎨 BEAST MODE UI/UX Testing Suite', 'magenta');
  log(`Testing: ${process.cwd()}\n`, 'blue');

  testComponentFiles();
  testDashboardComponent();
  testAnimations();
  testAPIStructure();
  testAccessibility();
  testResponsiveDesign();
  testCodeQuality();

  // Summary
  logSection('📊 Test Summary');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');
  log(`📈 Total: ${passed + failed + warnings}`, 'cyan');

  const successRate = ((passed / (passed + failed + warnings)) * 100).toFixed(1);
  log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  if (failed === 0) {
    log('\n🎉 All critical UI tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Review the output above.', 'yellow');
    process.exit(1);
  }
}

runAllTests();

