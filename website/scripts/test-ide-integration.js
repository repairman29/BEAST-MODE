#!/usr/bin/env node
/**
 * Test IDE Integration
 * 
 * Tests that IDE loads and features are accessible
 */

const http = require('http');

const PORT = 3000;
const IDE_URL = `http://localhost:${PORT}/ide`;

console.log('🧪 Testing IDE Integration\n');
console.log('='.repeat(60));
console.log('');

function testIDE() {
  return new Promise((resolve, reject) => {
    const req = http.get(IDE_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      res.on('end', () => {
        const status = res.statusCode;
        const hasReact = data.includes('react') || data.includes('React');
        const hasMonaco = data.includes('monaco') || data.includes('Monaco');
        const hasIDE = data.includes('BEAST MODE IDE') || data.includes('ide');
        
        resolve({
          status,
          hasReact,
          hasMonaco,
          hasIDE,
          data: data.substring(0, 500), // First 500 chars
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('⏳ Waiting for server to start...\n');
  
  // Wait for server
  for (let i = 0; i < 10; i++) {
    try {
      const result = await testIDE();
      
      console.log('📊 Test Results:\n');
      console.log(`   Status Code: ${result.status}`);
      console.log(`   Has React: ${result.hasReact ? '✅' : '❌'}`);
      console.log(`   Has Monaco: ${result.hasMonaco ? '✅' : '❌'}`);
      console.log(`   Has IDE: ${result.hasIDE ? '✅' : '❌'}`);
      console.log('');
      
      if (result.status === 200 && result.hasIDE) {
        console.log('✅ IDE is accessible!');
        console.log('\n🚀 Next Steps:');
        console.log('   1. Open browser: http://localhost:3000/ide');
        console.log('   2. Test features panel');
        console.log('   3. Test file operations');
        console.log('   4. Test Monaco Editor');
        console.log('   5. Test Terminal');
        return true;
      } else {
        console.log('⚠️  IDE may not be fully loaded');
        return false;
      }
    } catch (error) {
      if (i < 9) {
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`\n❌ Server not responding: ${error.message}`);
        console.log('\n💡 Make sure dev server is running:');
        console.log('   cd website && npm run dev');
        return false;
      }
    }
  }
  
  return false;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});
