#!/usr/bin/env node
/**
 * Integrate Generated Features into IDE
 * 
 * Automatically integrates all generated features into the IDE
 */

const fs = require('fs');
const path = require('path');

const IDE_DIR = path.join(__dirname, '..');
const FEATURES_DIR = path.join(IDE_DIR, 'renderer/features');
const APP_JS = path.join(IDE_DIR, 'renderer/app.js');

console.log('🔗 Integrating Generated Features into IDE\n');
console.log('='.repeat(60));
console.log('');

// Read current app.js
let appJs = fs.readFileSync(APP_JS, 'utf8');

// Get all feature categories
const categories = fs.readdirSync(FEATURES_DIR).filter(item => {
    const itemPath = path.join(FEATURES_DIR, item);
    return fs.statSync(itemPath).isDirectory();
});

console.log(`📁 Found ${categories.length} feature categories\n`);

// Create feature registry
const featureRegistry = {};

categories.forEach(cat => {
    const catPath = path.join(FEATURES_DIR, cat);
    const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));
    
    featureRegistry[cat] = files.map(file => {
        const filePath = path.join(catPath, file);
        const metaPath = filePath.replace('.js', '.meta.json');
        
        let metadata = {};
        if (fs.existsSync(metaPath)) {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        }
        
        return {
            id: file.replace('.js', ''),
            file: `features/${cat}/${file}`,
            metadata
        };
    });
    
    console.log(`   ${cat}: ${files.length} features`);
});

// Create feature loader
const featureLoader = `
/**
 * Feature Registry - Auto-generated
 * Loads all generated features from user stories
 */

const featureRegistry = ${JSON.stringify(featureRegistry, null, 2)};

/**
 * Initialize all features
 */
async function initializeFeatures() {
    console.log('🚀 Initializing generated features...');
    
    const initPromises = [];
    
    Object.entries(featureRegistry).forEach(([category, features]) => {
        features.forEach(feature => {
            try {
                // Dynamic import for features
                const featureModule = require(\`./\${feature.file}\`);
                if (featureModule && typeof featureModule.init === 'function') {
                    initPromises.push(
                        Promise.resolve(featureModule.init()).catch(err => {
                            console.warn(\`Failed to initialize \${feature.id}:\`, err);
                        })
                    );
                }
            } catch (error) {
                console.warn(\`Failed to load \${feature.id}:\`, error.message);
            }
        });
    });
    
    await Promise.all(initPromises);
    console.log(\`✅ Initialized \${Object.values(featureRegistry).flat().length} features\`);
}

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFeatures);
} else {
    initializeFeatures();
}
`;

// Write feature loader
const featureLoaderPath = path.join(IDE_DIR, 'renderer/features/feature-loader.js');
fs.writeFileSync(featureLoaderPath, featureLoader, 'utf8');
console.log(`\n✅ Created feature loader: features/feature-loader.js\n`);

// Update index.html to include feature loader
const indexHtmlPath = path.join(IDE_DIR, 'renderer/index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

if (!indexHtml.includes('feature-loader.js')) {
    // Add feature loader before app.js
    indexHtml = indexHtml.replace(
        '<script src="ErrorBoundary.js"></script>',
        '<script src="ErrorBoundary.js"></script>\n    <script src="features/feature-loader.js"></script>'
    );
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log('✅ Updated index.html to include feature loader\n');
}

// Create feature integration summary
const summary = {
    totalFeatures: Object.values(featureRegistry).flat().length,
    categories: Object.keys(featureRegistry).length,
    byCategory: Object.entries(featureRegistry).reduce((acc, [cat, features]) => {
        acc[cat] = features.length;
        return acc;
    }, {}),
    integrated: true,
    timestamp: new Date().toISOString()
};

const summaryPath = path.join(IDE_DIR, 'docs/FEATURE_INTEGRATION.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

console.log('='.repeat(60));
console.log('📊 Integration Summary\n');
console.log(`Total Features: ${summary.totalFeatures}`);
console.log(`Categories: ${summary.categories}`);
console.log('\nBy Category:');
Object.entries(summary.byCategory).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
});
console.log('\n✅ Features integrated into IDE!');
console.log('');
