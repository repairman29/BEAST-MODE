#!/usr/bin/env node
/**
 * Use BEAST MODE APIs to Improve IDE
 * 
 * This script demonstrates how to use BEAST MODE's APIs
 * to improve the IDE codebase.
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
            }
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
        req.write(postData);
        req.end();
    });
}

/**
 * Analyze IDE code quality using Self-Improve API
 */
async function analyzeIDEQuality() {
    console.log('🔍 Analyzing IDE code quality with BEAST MODE...\n');
    
    const files = [
        'renderer/app.js',
        'main/main.js',
        'renderer/index.html'
    ];
    
    const fileContents = files.map(file => {
        const filePath = path.join(IDE_DIR, file);
        if (!fs.existsSync(filePath)) return null;
        return {
            path: file,
            content: fs.readFileSync(filePath, 'utf8')
        };
    }).filter(Boolean);
    
    try {
        const result = await callBeastModeAPI('/api/beast-mode/self-improve', {
            files: fileContents,
            targetScore: 95
        });
        
        return result;
    } catch (error) {
        console.warn('⚠️  Could not reach BEAST MODE API:', error.message);
        console.warn('   Make sure BEAST MODE dev server is running:');
        console.warn('   cd BEAST-MODE-PRODUCT/website && npm run dev\n');
        return null;
    }
}

/**
 * Generate improved code using Codebase Chat API
 */
async function generateImprovedCode(prompt) {
    console.log(`✨ Generating improved code: ${prompt}\n`);
    
    try {
        const result = await callBeastModeAPI('/api/codebase/chat', {
            sessionId: 'ide-improvement-session',
            message: prompt,
            repo: 'BEAST-MODE-PRODUCT',
            useLLM: true
        });
        
        return result;
    } catch (error) {
        console.warn('⚠️  Could not generate code:', error.message);
        return null;
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🛡️ BEAST MODE IDE - Using BEAST MODE APIs\n');
    console.log('='.repeat(60));
    console.log('');
    
    // Step 1: Analyze quality
    console.log('📊 Step 1: Code Quality Analysis');
    console.log('-'.repeat(60));
    const qualityResult = await analyzeIDEQuality();
    
    if (qualityResult) {
        if (qualityResult.currentScore) {
            console.log(`Quality Score: ${qualityResult.currentScore}/100\n`);
        }
        
        if (qualityResult.issues && qualityResult.issues.length > 0) {
            console.log(`Found ${qualityResult.issues.length} issues:\n`);
            qualityResult.issues.slice(0, 10).forEach((issue, i) => {
                console.log(`${i + 1}. ${issue.file || 'Unknown'}: ${issue.message || issue.description || 'Issue found'}`);
                if (issue.priority) console.log(`   Priority: ${issue.priority}`);
            });
            if (qualityResult.issues.length > 10) {
                console.log(`   ... and ${qualityResult.issues.length - 10} more issues`);
            }
        }
        
        if (qualityResult.recommendations && qualityResult.recommendations.length > 0) {
            console.log(`\nRecommendations: ${qualityResult.recommendations.length}\n`);
            qualityResult.recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`${i + 1}. ${rec.title || 'Recommendation'}`);
                if (rec.priority) console.log(`   Priority: ${rec.priority}`);
            });
        }
    } else {
        console.log('⚠️  Could not analyze quality (API not available)');
        console.log('   Start BEAST MODE dev server: cd BEAST-MODE-PRODUCT/website && npm run dev\n');
    }
    
    console.log('');
    console.log('💡 Available BEAST MODE APIs:');
    console.log('-'.repeat(60));
    console.log('1. /api/beast-mode/self-improve - Analyze and improve code');
    console.log('2. /api/codebase/chat - Conversational code generation');
    console.log('3. /api/codebase/refactor - Automated refactoring');
    console.log('4. /api/repos/quality/generate-feature - Generate features');
    console.log('5. /api/codebase/tests/generate - Generate tests');
    console.log('6. /api/beast-mode/heal - Self-healing');
    console.log('7. /api/beast-mode/intelligence/code-review - Code review');
    console.log('');
    console.log('📄 See docs/BEAST_MODE_CAPABILITIES.md for details');
    console.log('');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { analyzeIDEQuality, generateImprovedCode };
