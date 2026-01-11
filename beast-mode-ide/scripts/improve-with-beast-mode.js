#!/usr/bin/env node
/**
 * Use BEAST MODE to Actually Improve IDE
 * 
 * This script uses BEAST MODE APIs to generate and apply improvements
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BEAST_MODE_API = process.env.BEAST_MODE_API || 'http://localhost:3000';
const IDE_DIR = path.join(__dirname, '..');

/**
 * Call BEAST MODE API
 */
async function callBeastModeAPI(endpoint, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BEAST_MODE_API);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const postData = JSON.stringify(data);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 30000
        };
        
        const req = client.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ raw: body, status: res.statusCode });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.write(postData);
        req.end();
    });
}

/**
 * Read IDE files
 */
function readIDEFiles() {
    const files = [
        'renderer/app.js',
        'main/main.js',
        'renderer/index.html'
    ];
    
    return files.map(file => {
        const filePath = path.join(IDE_DIR, file);
        if (!fs.existsSync(filePath)) return null;
        return {
            path: file,
            content: fs.readFileSync(filePath, 'utf8')
        };
    }).filter(Boolean);
}

/**
 * Step 1: Analyze quality
 */
async function analyzeQuality() {
    console.log('📊 Step 1: Analyzing IDE code quality...\n');
    
    const files = readIDEFiles();
    
    try {
        const result = await callBeastModeAPI('/api/beast-mode/self-improve', {
            files: files,
            targetScore: 95
        });
        
        return result;
    } catch (error) {
        console.warn(`⚠️  Could not analyze quality: ${error.message}`);
        return null;
    }
}

/**
 * Step 2: Generate improvements using codebase chat
 */
async function generateImprovements(issues) {
    console.log('✨ Step 2: Generating improvements with BEAST MODE...\n');
    
    const improvements = [];
    
    // Priority improvements
    const priorityPrompts = [
        {
            name: 'Bundle Monaco Editor Locally',
            prompt: 'Generate a webpack or vite configuration to bundle Monaco Editor locally in an Electron app. The current code loads Monaco from CDN which requires internet. We need offline support. Include the necessary loaders and configuration.'
        },
        {
            name: 'Add TypeScript Support',
            prompt: 'Add TypeScript support to the Electron IDE. Convert the main files to TypeScript, add proper type definitions, and create a tsconfig.json. The IDE currently uses plain JavaScript.'
        },
        {
            name: 'Add Error Boundaries',
            prompt: 'Add React error boundary components to the Electron IDE renderer. Create error boundaries that catch errors gracefully and display helpful error messages with copy functionality.'
        }
    ];
    
    for (const item of priorityPrompts) {
        console.log(`  Generating: ${item.name}...`);
        try {
            const result = await callBeastModeAPI('/api/codebase/chat', {
                sessionId: 'ide-improvement-session',
                message: item.prompt,
                repo: 'BEAST-MODE-PRODUCT',
                useLLM: true
            });
            
            if (result && result.code) {
                improvements.push({
                    name: item.name,
                    code: result.code,
                    description: result.message || item.prompt
                });
                console.log(`  ✅ Generated: ${item.name}`);
            }
        } catch (error) {
            console.warn(`  ⚠️  Could not generate ${item.name}: ${error.message}`);
        }
    }
    
    return improvements;
}

/**
 * Step 3: Apply improvements
 */
async function applyImprovements(improvements) {
    console.log('\n🚀 Step 3: Applying improvements...\n');
    
    for (const improvement of improvements) {
        console.log(`  Applying: ${improvement.name}...`);
        
        // Save generated code to files
        const outputDir = path.join(IDE_DIR, 'generated-improvements');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const fileName = improvement.name.toLowerCase().replace(/\s+/g, '-') + '.js';
        const filePath = path.join(outputDir, fileName);
        
        fs.writeFileSync(filePath, improvement.code, 'utf8');
        console.log(`  ✅ Saved to: ${filePath}`);
    }
    
    return improvements.length;
}

/**
 * Main function
 */
async function main() {
    console.log('🛡️ BEAST MODE IDE - Automated Improvement\n');
    console.log('='.repeat(60));
    console.log('');
    
    // Step 1: Analyze
    const qualityResult = await analyzeQuality();
    
    if (qualityResult) {
        console.log(`Quality Score: ${qualityResult.currentScore || 'N/A'}/100`);
        if (qualityResult.issues) {
            console.log(`Issues Found: ${qualityResult.issues.length}`);
        }
        console.log('');
    }
    
    // Step 2: Generate improvements
    const improvements = await generateImprovements(qualityResult?.issues || []);
    
    if (improvements.length > 0) {
        console.log(`\n✅ Generated ${improvements.length} improvements\n`);
        
        // Step 3: Apply improvements
        const applied = await applyImprovements(improvements);
        
        console.log('');
        console.log('='.repeat(60));
        console.log(`✅ Improvement Complete!`);
        console.log('');
        console.log(`📁 Generated files saved to: generated-improvements/`);
        console.log(`📋 Review the generated code and integrate into IDE`);
        console.log('');
    } else {
        console.log('\n⚠️  No improvements generated (API may not be available)');
        console.log('   Start BEAST MODE: cd BEAST-MODE-PRODUCT/website && npm run dev\n');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { analyzeQuality, generateImprovements, applyImprovements };
