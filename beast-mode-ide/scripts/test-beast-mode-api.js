#!/usr/bin/env node
/**
 * Test BEAST MODE API Connection
 */

const http = require('http');

const BEAST_MODE_API = process.env.BEAST_MODE_API || 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Testing BEAST MODE API...\n');
    
    // Test health endpoint
    try {
        const healthUrl = new URL('/api/health', BEAST_MODE_API);
        const res = await new Promise((resolve, reject) => {
            http.get(healthUrl, (res) => {
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve({ raw: body });
                    }
                });
            }).on('error', reject);
        });
        console.log('✅ Health endpoint:', res);
    } catch (error) {
        console.log('❌ Health endpoint failed:', error.message);
    }
    
    // Test codebase chat endpoint
    try {
        const chatUrl = new URL('/api/codebase/chat', BEAST_MODE_API);
        const postData = JSON.stringify({
            sessionId: 'test',
            message: 'Generate a simple hello world function in JavaScript',
            repo: 'BEAST-MODE-PRODUCT',
            useLLM: true
        });
        
        const res = await new Promise((resolve, reject) => {
            const req = http.request(chatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
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
        
        console.log('\n✅ Chat endpoint response:');
        console.log('Keys:', Object.keys(res));
        console.log('Sample:', JSON.stringify(res, null, 2).substring(0, 500));
    } catch (error) {
        console.log('❌ Chat endpoint failed:', error.message);
    }
}

testAPI().catch(console.error);
