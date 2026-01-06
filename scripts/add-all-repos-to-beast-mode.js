#!/usr/bin/env node

/**
 * Add All Repositories to BEAST MODE
 * 
 * Adds all repositories from .cursorrules to BEAST MODE
 */

const axios = require('axios');

const BASE_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';

const repos = [
  { url: 'https://github.com/repairman29/smugglers', team: 'Main' },
  { url: 'https://github.com/repairman29/smuggler', team: 'Game' },
  { url: 'https://github.com/repairman29/ai-gm-service', team: 'AI Services' },
  { url: 'https://github.com/repairman29/oracle', team: 'AI Services' },
  { url: 'https://github.com/repairman29/code-roach', team: 'AI Services' },
  { url: 'https://github.com/repairman29/daisy-chain', team: 'AI Services' },
  { url: 'https://github.com/repairman29/BEAST-MODE', team: 'Platform' },
];

async function addRepos() {
  console.log('📦 Adding all repositories to BEAST MODE...\n');
  console.log(`🌐 API URL: ${BASE_URL}\n`);
  
  let successCount = 0;
  let alreadyExistsCount = 0;
  let errorCount = 0;
  
  for (const repo of repos) {
    try {
      process.stdout.write(`Adding: ${repo.url} (${repo.team})... `);
      const response = await axios.post(`${BASE_URL}/api/beast-mode/enterprise/repos`, {
        url: repo.url,
        team: repo.team,
      }, {
        validateStatus: () => true,
        timeout: 10000,
      });
      
      if (response.status === 201) {
        console.log('✅ Added');
        successCount++;
      } else if (response.status === 409) {
        console.log('⚠️  Already exists');
        alreadyExistsCount++;
      } else {
        console.log(`❌ Failed: ${response.status}`);
        if (response.data && response.data.error) {
          console.log(`   Error: ${response.data.error}`);
        }
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${successCount}`);
  console.log(`  ⚠️  Already exists: ${alreadyExistsCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📦 Total: ${repos.length}`);
  
  if (successCount + alreadyExistsCount === repos.length) {
    console.log('\n✅ All repositories are now connected to BEAST MODE!');
  } else {
    console.log('\n⚠️  Some repositories could not be added. Check errors above.');
  }
}

addRepos().catch(console.error);

