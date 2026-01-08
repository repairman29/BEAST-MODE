#!/usr/bin/env node
/**
 * Direct API Test - Bypass extension to test API directly
 */

const axios = require('axios');

const API_URL = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

async function testQualityAPI() {
  console.log('🧪 Testing BEAST MODE Quality API directly...\n');
  console.log(`API URL: ${API_URL}\n`);

  try {
    const testData = {
      repo: 'test/repo',
      features: {
        lines: 100,
        hasTests: true,
        hasComments: true,
        complexity: 50
      }
    };

    console.log('📤 Sending request:', JSON.stringify(testData, null, 2));
    console.log('\n');

    const response = await axios.post(`${API_URL}/api/repos/quality`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS!\n');
    console.log('Response status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.quality !== undefined) {
      console.log(`\n✨ Quality Score: ${(response.data.quality * 100).toFixed(1)}%`);
    }

    if (response.data.warning) {
      console.log(`\n⚠️  Warning: ${response.data.warning}`);
    }

    if (response.data.source) {
      console.log(`📊 Source: ${response.data.source}`);
    }

  } catch (error) {
    console.log('❌ FAILED!\n');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received');
      console.log('Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      });
      console.log('Error message:', error.message);
    } else {
      console.log('Error:', error.message);
    }
    
    process.exit(1);
  }
}

testQualityAPI();
