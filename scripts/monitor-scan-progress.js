#!/usr/bin/env node

/**
 * Monitor Scan Progress
 * 
 * Shows real-time progress and findings from repository scanning
 */

const fs = require('fs-extra');
const path = require('path');
const { getAuditTrail } = require('../lib/mlops/auditTrail');

const SCAN_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const DISCOVERED_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
const AUDIT_DIR = path.join(__dirname, '../.beast-mode/audit');

/**
 * Get latest discovery file
 */
function getLatestDiscovery() {
  if (!fs.existsSync(DISCOVERED_DIR)) return null;
  
  const files = fs.readdirSync(DISCOVERED_DIR)
    .filter(f => f.startsWith('high-value-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) return null;
  
  return JSON.parse(fs.readFileSync(path.join(DISCOVERED_DIR, files[0]), 'utf8'));
}

/**
 * Get latest scan file
 */
function getLatestScan() {
  if (!fs.existsSync(SCAN_DIR)) return null;
  
  const files = fs.readdirSync(SCAN_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) return null;
  
  return JSON.parse(fs.readFileSync(path.join(SCAN_DIR, files[0]), 'utf8'));
}

/**
 * Get recent audit logs
 */
async function getRecentAuditLogs() {
  const auditTrail = await getAuditTrail();
  const entries = await auditTrail.query({
    operation: 'repository_scan',
    limit: 1000,
  });
  
  return entries;
}

/**
 * Analyze findings
 */
function analyzeFindings(discovery, scan, auditLogs) {
  const findings = {
    discovery: null,
    scanning: {
      total: 0,
      scanned: 0,
      optedOut: 0,
      failed: 0,
      inProgress: false,
    },
    quality: {
      avgScore: 0,
      scoreRange: { min: 0, max: 0 },
      languages: {},
    },
    repositories: {
      byLanguage: {},
      byLicense: {},
      topScored: [],
      optedOut: [],
    },
    features: {
      totalFeatures: 0,
      examplesWithFeatures: 0,
    },
  };

  // Discovery findings
  if (discovery) {
    findings.discovery = {
      total: discovery.statistics?.total || 0,
      avgScore: discovery.statistics?.avgScore || 0,
      languages: discovery.statistics?.byLanguage || {},
      discoveredAt: discovery.metadata?.discoveredAt,
    };
  }

  // Scan findings
  if (scan) {
    findings.scanning = {
      total: scan.metadata?.totalRepos || 0,
      scanned: scan.metadata?.successful || 0,
      optedOut: scan.metadata?.optedOut || 0,
      failed: (scan.metadata?.totalRepos || 0) - (scan.metadata?.successful || 0) - (scan.metadata?.optedOut || 0),
      optedOutRepos: scan.metadata?.optedOutRepos || [],
      scannedAt: scan.metadata?.scannedAt,
    };

    // Analyze training data
    if (scan.trainingData && scan.trainingData.length > 0) {
      findings.features.examplesWithFeatures = scan.trainingData.length;
      findings.features.totalFeatures = scan.trainingData[0]?.features 
        ? Object.keys(scan.trainingData[0].features).length 
        : 0;

      // Language distribution
      scan.trainingData.forEach(repo => {
        const lang = repo.language || 'Unknown';
        findings.repositories.byLanguage[lang] = (findings.repositories.byLanguage[lang] || 0) + 1;
      });

      // License distribution
      scan.trainingData.forEach(repo => {
        const license = repo.license || 'None';
        findings.repositories.byLicense[license] = (findings.repositories.byLicense[license] || 0) + 1;
      });

      // Top scored (if available)
      const withScores = scan.trainingData.filter(r => r.score !== undefined).sort((a, b) => b.score - a.score);
      findings.repositories.topScored = withScores.slice(0, 10);
    }
  }

  // Check if scanning is in progress
  if (auditLogs && auditLogs.length > 0) {
    const recentScans = auditLogs.filter(e => {
      const time = new Date(e.timestamp);
      const now = new Date();
      return (now - time) < 5 * 60 * 1000; // Last 5 minutes
    });

    findings.scanning.inProgress = recentScans.length > 0;
    findings.scanning.recentScans = recentScans.length;
  }

  return findings;
}

/**
 * Display findings
 */
function displayFindings(findings) {
  console.log('\n📊 Discovery & Scanning Progress Report\n');
  console.log('='.repeat(60));

  // Discovery
  if (findings.discovery) {
    console.log('\n🔍 Discovery Results:');
    console.log(`   Total Repositories: ${findings.discovery.total}`);
    console.log(`   Average Score: ${findings.discovery.avgScore.toFixed(2)}/100`);
    console.log(`   Discovered At: ${findings.discovery.discoveredAt || 'Unknown'}`);
    
    if (Object.keys(findings.discovery.languages).length > 0) {
      console.log('\n   Language Distribution:');
      Object.entries(findings.discovery.languages)
        .sort((a, b) => b[1] - a[1])
        .forEach(([lang, count]) => {
          console.log(`      ${lang}: ${count} repos`);
        });
    }
  }

  // Scanning progress
  console.log('\n📡 Scanning Progress:');
  if (findings.scanning.inProgress) {
    console.log(`   Status: 🟢 IN PROGRESS`);
    console.log(`   Recent Activity: ${findings.scanning.recentScans} scans in last 5 minutes`);
  } else if (findings.scanning.scanned > 0) {
    console.log(`   Status: ✅ COMPLETE`);
  } else {
    console.log(`   Status: ⏳ NOT STARTED`);
  }

  if (findings.scanning.total > 0) {
    const progress = (findings.scanning.scanned / findings.scanning.total) * 100;
    console.log(`   Progress: ${findings.scanning.scanned}/${findings.scanning.total} (${progress.toFixed(1)}%)`);
    console.log(`   Successful: ${findings.scanning.scanned}`);
    console.log(`   Opted Out: ${findings.scanning.optedOut}`);
    console.log(`   Failed: ${findings.scanning.failed}`);
  }

  // Quality metrics
  if (findings.scanning.scanned > 0) {
    console.log('\n📈 Quality Metrics:');
    console.log(`   Repositories Scanned: ${findings.scanning.scanned}`);
    console.log(`   Features per Repo: ${findings.features.totalFeatures}`);
    console.log(`   Examples with Features: ${findings.features.examplesWithFeatures}`);
  }

  // Language distribution (from scan)
  if (Object.keys(findings.repositories.byLanguage).length > 0) {
    console.log('\n🌍 Language Distribution (Scanned):');
    Object.entries(findings.repositories.byLanguage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([lang, count]) => {
        const pct = (count / findings.scanning.scanned * 100).toFixed(1);
        console.log(`   ${lang}: ${count} repos (${pct}%)`);
      });
  }

  // License distribution
  if (Object.keys(findings.repositories.byLicense).length > 0) {
    console.log('\n📜 License Distribution:');
    Object.entries(findings.repositories.byLicense)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([license, count]) => {
        console.log(`   ${license}: ${count} repos`);
      });
  }

  // Top scored repos
  if (findings.repositories.topScored.length > 0) {
    console.log('\n⭐ Top Scored Repositories:');
    findings.repositories.topScored.slice(0, 5).forEach((repo, i) => {
      console.log(`   ${i + 1}. ${repo.repo} - Score: ${repo.score?.toFixed(2) || 'N/A'}`);
    });
  }

  // Opted out repos
  if (findings.scanning.optedOutRepos && findings.scanning.optedOutRepos.length > 0) {
    console.log('\n⏭️  Repositories That Opted Out:');
    findings.scanning.optedOutRepos.slice(0, 10).forEach(repo => {
      console.log(`   - ${repo}`);
    });
    if (findings.scanning.optedOutRepos.length > 10) {
      console.log(`   ... and ${findings.scanning.optedOutRepos.length - 10} more`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Monitor in real-time
 */
async function monitorRealTime(interval = 5000) {
  console.log('🔍 Starting Real-Time Progress Monitor\n');
  console.log('Press Ctrl+C to stop\n');

  let lastCount = 0;

  const monitor = setInterval(async () => {
    // Clear screen (optional - comment out if you want to see history)
    // process.stdout.write('\x1B[2J\x1B[0f');

    const discovery = getLatestDiscovery();
    const scan = getLatestScan();
    const auditLogs = await getRecentAuditLogs();

    const findings = analyzeFindings(discovery, scan, auditLogs);
    
    // Show progress
    const currentCount = findings.scanning.scanned;
    const newScans = currentCount - lastCount;
    lastCount = currentCount;

    if (newScans > 0) {
      console.log(`\n✅ Progress: ${currentCount}/${findings.scanning.total} scanned (+${newScans} new)`);
    }

    displayFindings(findings);

    // Check if complete
    if (findings.scanning.scanned > 0 && 
        findings.scanning.scanned >= findings.scanning.total &&
        !findings.scanning.inProgress) {
      console.log('\n🎉 Scanning Complete!\n');
      clearInterval(monitor);
      process.exit(0);
    }
  }, interval);

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Monitoring stopped\n');
    clearInterval(monitor);
    process.exit(0);
  });
}

/**
 * Show current status (one-time)
 */
async function showStatus() {
  const discovery = getLatestDiscovery();
  const scan = getLatestScan();
  const auditLogs = await getRecentAuditLogs();

  const findings = analyzeFindings(discovery, scan, auditLogs);
  displayFindings(findings);

  // Show recent audit activity
  if (auditLogs && auditLogs.length > 0) {
    const recent = auditLogs
      .filter(e => {
        const time = new Date(e.timestamp);
        const now = new Date();
        return (now - time) < 10 * 60 * 1000; // Last 10 minutes
      })
      .slice(0, 10);

    if (recent.length > 0) {
      console.log('📝 Recent Activity (Last 10 minutes):');
      recent.forEach(entry => {
        const time = new Date(entry.timestamp);
        const ago = Math.floor((Date.now() - time) / 1000);
        console.log(`   ${ago}s ago: ${entry.operation} - ${entry.details?.repo || 'N/A'}`);
      });
      console.log('');
    }
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch') || args.includes('-w');

  if (watch) {
    await monitorRealTime(5000); // Update every 5 seconds
  } else {
    await showStatus();
  }
}

main().catch(console.error);

