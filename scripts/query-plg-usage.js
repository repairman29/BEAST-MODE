#!/usr/bin/env node
/**
 * Query PLG Component Usage Stats
 * 
 * Shows which components are used most
 */

const fetch = require('node-fetch');

const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';
const DAYS = process.argv[2] ? parseInt(process.argv[2]) : 30;
const COMPONENT_TYPE = process.argv[3] || null;

async function queryUsage() {
  console.log('📊 PLG Component Usage Stats\n');
  console.log('='.repeat(70));
  console.log();

  try {
    let url = `${API_BASE}/api/plg/usage?days=${DAYS}`;
    if (COMPONENT_TYPE) {
      url += `&type=${COMPONENT_TYPE}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log(`📈 Usage Stats (Last ${DAYS} days):`);
    console.log(`   Total events: ${data.total}`);
    console.log(`   Unique components: ${data.components.length}`);
    console.log();

    if (data.components.length === 0) {
      console.log('⚠️  No component usage tracked yet');
      console.log('   Components will start tracking when used');
      return;
    }

    console.log('🏆 Top Components:');
    console.log();
    
    data.components.forEach((comp: any, idx: number) => {
      const percentage = data.total > 0 ? (comp.count / data.total * 100).toFixed(1) : '0.0';
      console.log(`${(idx + 1).toString().padStart(2)}. ${comp.componentName.padEnd(25)} ${comp.componentType.padEnd(10)} ${comp.count.toString().padStart(4)} uses (${percentage}%)`);
      console.log(`    Unique repos: ${comp.uniqueRepos}, Unique users: ${comp.uniqueUsers}`);
    });

    console.log();
    console.log('💡 Insights:');
    const mostUsed = data.components[0];
    if (mostUsed) {
      console.log(`   Most used: ${mostUsed.componentName} (${mostUsed.count} uses)`);
    }
    
    const byType: Record<string, number> = {};
    data.components.forEach((comp: any) => {
      byType[comp.componentType] = (byType[comp.componentType] || 0) + comp.count;
    });
    
    console.log('   By type:');
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`     ${type}: ${count} uses`);
      });

    console.log();
    console.log('🎯 Recommendations:');
    if (data.components.length > 0) {
      console.log(`   ✅ Build more features using ${data.components[0].componentName}`);
      console.log(`   ✅ Focus on ${data.components[0].componentType} components`);
    }
    
    const unusedTypes = ['badge', 'widget', 'button', 'cards'].filter(
      type => !data.components.some((c: any) => c.componentType === type)
    );
    if (unusedTypes.length > 0) {
      console.log(`   ⚠️  ${unusedTypes.join(', ')} components not used yet - consider promoting`);
    }

    console.log();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log();
    console.log('💡 Make sure:');
    console.log('   1. API server is running');
    console.log('   2. Database table exists (run setup-plg-monitoring.js)');
    console.log('   3. Components are being used (tracking enabled)');
  }
}

queryUsage();
