const axios = require('axios');

async function test() {
  try {
    const response = await axios.post('http://localhost:3000/api/repos/quality/improve', {
      repo: 'repairman29/smugglers',
      targetQuality: 1.0,
      dryRun: true
    });
    console.log('✅ Success:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

test();
