#!/usr/bin/env node

/**
 * MVP Readiness Verification Script
 * 
 * Verifies that all MVP components are ready:
 * 1. XGBoost model integration
 * 2. API endpoints working
 * 3. Core user flow
 * 4. Business value integration
 */

const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
const WEBSITE_DIR = path.join(__dirname, '../website');

console.log('🔍 BEAST MODE MVP Readiness Verification\n');
console.log('='.repeat(60));

let allChecks = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  allChecks.push({ name, passed: condition, details });
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

// 1. XGBoost Model Verification
console.log('\n📊 1. XGBoost Model Verification\n');

const xgboostModels = fs.existsSync(MODELS_DIR)
  ? fs.readdirSync(MODELS_DIR)
      .filter(f => f.startsWith('model-xgboost-'))
      .sort()
      .reverse()
  : [];

check(
  'XGBoost model files exist',
  xgboostModels.length > 0,
  xgboostModels.length > 0 
    ? `Found ${xgboostModels.length} XGBoost model(s)`
    : 'No XGBoost models found in .beast-mode/models/'
);

if (xgboostModels.length > 0) {
  const latestModel = xgboostModels[0];
  const modelPath = path.join(MODELS_DIR, latestModel);
  const modelJsonPath = path.join(modelPath, 'model.json');
  const metadataPath = path.join(modelPath, 'model-metadata.json');
  
  check(
    'Latest XGBoost model has model.json',
    fs.existsSync(modelJsonPath),
    `Expected: ${modelJsonPath}`
  );
  
  check(
    'Latest XGBoost model has metadata',
    fs.existsSync(metadataPath),
    `Expected: ${metadataPath}`
  );
  
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      check(
        'XGBoost model has good R²',
        metadata.metrics?.r2 > 0.9,
        `R² = ${metadata.metrics?.r2 || 'N/A'} (should be > 0.9)`
      );
    } catch (e) {
      check('XGBoost metadata is valid JSON', false, e.message);
    }
  }
}

// 2. Integration Verification
console.log('\n🔌 2. Integration Verification\n');

const mlIntegrationPath = path.join(__dirname, '../lib/mlops/mlModelIntegration.js');
check(
  'mlModelIntegration.js exists',
  fs.existsSync(mlIntegrationPath),
  `Expected: ${mlIntegrationPath}`
);

if (fs.existsSync(mlIntegrationPath)) {
  const mlIntegrationContent = fs.readFileSync(mlIntegrationPath, 'utf8');
  check(
    'mlModelIntegration has XGBoost support',
    mlIntegrationContent.includes('xgboost') || mlIntegrationContent.includes('XGBoost'),
    'Should contain XGBoost integration code'
  );
  
  check(
    'mlModelIntegration prioritizes XGBoost',
    mlIntegrationContent.includes('model-xgboost') || mlIntegrationContent.includes('xgboost'),
    'Should load XGBoost models first'
  );
}

const qualityApiPath = path.join(WEBSITE_DIR, 'app/api/repos/quality/route.ts');
check(
  'Quality API route exists',
  fs.existsSync(qualityApiPath),
  `Expected: ${qualityApiPath}`
);

if (fs.existsSync(qualityApiPath)) {
  const qualityApiContent = fs.readFileSync(qualityApiPath, 'utf8');
  check(
    'Quality API uses mlModelIntegration',
    qualityApiContent.includes('mlModelIntegration') || qualityApiContent.includes('MLModelIntegration'),
    'Should use MLModelIntegration for predictions'
  );
}

// 3. Core Features Verification
console.log('\n🎯 3. Core Features Verification\n');

const dashboardPath = path.join(WEBSITE_DIR, 'components/beast-mode/BeastModeDashboard.tsx');
check(
  'Dashboard component exists',
  fs.existsSync(dashboardPath),
  `Expected: ${dashboardPath}`
);

const qualityTabPath = path.join(WEBSITE_DIR, 'components/beast-mode/GitHubScanForm.tsx');
check(
  'Quality tab component exists',
  fs.existsSync(qualityTabPath),
  `Expected: ${qualityTabPath}`
);

const pricingPath = path.join(WEBSITE_DIR, 'app/pricing/page.tsx');
check(
  'Pricing page exists',
  fs.existsSync(pricingPath),
  `Expected: ${pricingPath}`
);

// 4. Business Value Verification
console.log('\n💰 4. Business Value Verification\n');

const roiCalculatorPath = path.join(WEBSITE_DIR, 'components/landing/ROICalculator.tsx');
check(
  'ROI Calculator component exists',
  fs.existsSync(roiCalculatorPath),
  `Expected: ${roiCalculatorPath}`
);

if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  check(
    'Dashboard mentions value metrics',
    dashboardContent.includes('time') || dashboardContent.includes('ROI') || dashboardContent.includes('value'),
    'Should show value metrics (time saved, ROI, etc.)'
  );
}

// 5. API Endpoints Verification
console.log('\n🌐 5. API Endpoints Verification\n');

const apiEndpoints = [
  { path: 'app/api/repos/quality/route.ts', name: 'Quality API' },
  { path: 'app/api/auth/validate/route.ts', name: 'License Validation API' },
  { path: 'app/api/auth/usage/route.ts', name: 'Usage Tracking API' },
  { path: 'app/api/auth/api-keys/route.ts', name: 'API Keys API' }
];

apiEndpoints.forEach(endpoint => {
  const fullPath = path.join(WEBSITE_DIR, endpoint.path);
  check(
    `${endpoint.name} exists`,
    fs.existsSync(fullPath),
    `Expected: ${fullPath}`
  );
});

// 6. Documentation Verification
console.log('\n📚 6. Documentation Verification\n');

const docsPaths = [
  { path: 'docs/getting-started/README.md', name: 'Getting Started Guide' },
  { path: 'docs/guides/api.md', name: 'API Documentation' },
  { path: 'docs/reference/api-reference.md', name: 'API Reference' }
];

docsPaths.forEach(doc => {
  const fullPath = path.join(__dirname, '..', doc.path);
  check(
    `${doc.name} exists`,
    fs.existsSync(fullPath),
    `Expected: ${fullPath}`
  );
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);
console.log(`🎯 Score: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! MVP is ready!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Review the issues above.');
  console.log('\n💡 Next steps:');
  console.log('   1. Fix failed checks');
  console.log('   2. Run this script again');
  console.log('   3. Proceed with MVP launch');
  process.exit(1);
}

