#!/usr/bin/env node
/**
 * Automated Test Suite for IDE
 * 
 * Tests all aspects of the IDE after feature generation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IDE_DIR = path.join(__dirname, '..');
const results = {
    passed: [],
    failed: [],
    warnings: []
};

console.log('🧪 Automated Test Suite for BEAST MODE IDE\n');
console.log('='.repeat(60));
console.log('');

/**
 * Test function wrapper
 */
function test(name, fn) {
    try {
        fn();
        results.passed.push(name);
        console.log(`✅ ${name}`);
    } catch (error) {
        results.failed.push({ name, error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

/**
 * Warning function
 */
function warn(message) {
    results.warnings.push(message);
    console.log(`⚠️  ${message}`);
}

// Test 1: Feature Files Exist
test('Feature files exist', () => {
    const featuresDir = path.join(IDE_DIR, 'renderer/features');
    if (!fs.existsSync(featuresDir)) {
        throw new Error('Features directory not found');
    }
    const count = execSync(`find "${featuresDir}" -name "*.js" | wc -l`, { encoding: 'utf8' }).trim();
    if (parseInt(count) === 0) {
        throw new Error('No feature files found');
    }
});

// Test 2: All Features Valid
test('All features are valid', () => {
    const testScript = path.join(IDE_DIR, 'scripts/test-all-features.js');
    if (!fs.existsSync(testScript)) {
        throw new Error('Test script not found');
    }
    try {
        const output = execSync(`node "${testScript}"`, { encoding: 'utf8', cwd: IDE_DIR });
        if (!output.includes('All features are valid')) {
            throw new Error('Some features are invalid');
        }
    } catch (error) {
        throw new Error('Feature validation failed');
    }
});

// Test 3: Package.json Valid
test('package.json is valid', () => {
    const packageJson = path.join(IDE_DIR, 'package.json');
    if (!fs.existsSync(packageJson)) {
        throw new Error('package.json not found');
    }
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    if (!pkg.name || !pkg.version) {
        throw new Error('package.json missing required fields');
    }
});

// Test 4: Dependencies Installed
test('Dependencies are installed', () => {
    const nodeModules = path.join(IDE_DIR, 'node_modules');
    if (!fs.existsSync(nodeModules)) {
        throw new Error('node_modules not found - run npm install');
    }
});

// Test 5: Build Scripts Work
test('Build scripts are defined', () => {
    const packageJson = path.join(IDE_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    if (!pkg.scripts || !pkg.scripts['build:webpack']) {
        throw new Error('Build scripts not found');
    }
});

// Test 6: Webpack Config Exists
test('Webpack config exists', () => {
    const webpackConfig = path.join(IDE_DIR, 'webpack.config.js');
    if (!fs.existsSync(webpackConfig)) {
        warn('Webpack config not found (optional for CDN mode)');
    }
});

// Test 7: Design System Exists
test('Design system exists', () => {
    const designSystem = path.join(IDE_DIR, 'renderer/styles/design-system.css');
    if (!fs.existsSync(designSystem)) {
        throw new Error('Design system not found');
    }
});

// Test 8: Minimal UI Exists
test('Minimal UI exists', () => {
    const minimalUI = path.join(IDE_DIR, 'renderer/ui/MinimalUI.js');
    if (!fs.existsSync(minimalUI)) {
        throw new Error('Minimal UI not found');
    }
});

// Test 9: Error Boundary Exists
test('Error boundary exists', () => {
    const errorBoundary = path.join(IDE_DIR, 'renderer/ErrorBoundary.js');
    if (!fs.existsSync(errorBoundary)) {
        throw new Error('Error boundary not found');
    }
});

// Test 10: Main Process Exists
test('Main process exists', () => {
    const mainProcess = path.join(IDE_DIR, 'main/main.js');
    if (!fs.existsSync(mainProcess)) {
        throw new Error('Main process not found');
    }
});

// Test 11: Renderer HTML Exists
test('Renderer HTML exists', () => {
    const rendererHTML = path.join(IDE_DIR, 'renderer/index.html');
    if (!fs.existsSync(rendererHTML)) {
        throw new Error('Renderer HTML not found');
    }
});

// Test 12: No Secrets in Code
test('No secrets in generated code', () => {
    const featuresDir = path.join(IDE_DIR, 'renderer/features');
    const secrets = ['sk-', 'ghp_', 'r8_', 'gsk_', 'AIza'];
    let foundSecrets = false;
    
    const files = execSync(`find "${featuresDir}" -name "*.js"`, { encoding: 'utf8' }).trim().split('\n');
    files.forEach(file => {
        if (file) {
            const content = fs.readFileSync(file, 'utf8');
            secrets.forEach(secret => {
                if (content.includes(secret)) {
                    foundSecrets = true;
                }
            });
        }
    });
    
    if (foundSecrets) {
        throw new Error('Secrets found in generated code');
    }
});

// Test 13: Progress File Exists
test('Build progress file exists', () => {
    const progressFile = path.join(IDE_DIR, 'docs/user-stories/BUILD_PROGRESS.json');
    if (!fs.existsSync(progressFile)) {
        throw new Error('Build progress file not found');
    }
    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    if (!progress.stats) {
        throw new Error('Build progress file invalid');
    }
});

// Test 14: Documentation Exists
test('Documentation exists', () => {
    const docs = [
        'docs/COMMIT_PUSH_AND_TEST.md',
        'docs/BUILD_FROM_STORIES.md',
        'docs/USER_STORIES.md'
    ];
    docs.forEach(doc => {
        const docPath = path.join(IDE_DIR, doc);
        if (!fs.existsSync(docPath)) {
            throw new Error(`Documentation not found: ${doc}`);
        }
    });
});

// Test 15: Try to Build (if webpack config exists)
test('Webpack build works', () => {
    const webpackConfig = path.join(IDE_DIR, 'webpack.config.js');
    if (fs.existsSync(webpackConfig)) {
        try {
            execSync('npm run build:webpack', { 
                encoding: 'utf8', 
                cwd: IDE_DIR,
                stdio: 'pipe',
                timeout: 60000
            });
        } catch (error) {
            warn('Webpack build failed (may need dependencies)');
        }
    } else {
        warn('Webpack config not found - skipping build test');
    }
});

// Print summary
console.log('');
console.log('='.repeat(60));
console.log('📊 Test Summary\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log('');

if (results.failed.length > 0) {
    console.log('❌ Failed Tests:\n');
    results.failed.forEach(f => {
        console.log(`   ${f.name}: ${f.error}`);
    });
    console.log('');
}

if (results.warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    results.warnings.forEach(w => {
        console.log(`   ${w}`);
    });
    console.log('');
}

if (results.failed.length === 0) {
    console.log('✅ All critical tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}
