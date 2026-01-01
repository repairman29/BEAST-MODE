#!/usr/bin/env node

/**
 * Collect deployment logs from all sources (Vercel, GitHub, etc.)
 * and analyze for failures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../logs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(outputDir, `deployment-logs-${timestamp}.txt`);

const logs = [];

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  logs.push(line);
}

function exec(command, description) {
  log(`\n${'='.repeat(80)}`);
  log(`🔍 ${description}`);
  log(`${'='.repeat(80)}`);
  log(`Command: ${command}`);
  log('');
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '../website'),
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    log(output);
    return { success: true, output };
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    if (error.stdout) log(`STDOUT: ${error.stdout}`);
    if (error.stderr) log(`STDERR: ${error.stderr}`);
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

async function main() {
  console.log('');
  console.log('📋 Collecting Deployment Logs');
  console.log('============================\n');
  
  log('Deployment Log Collection Started');
  log(`Timestamp: ${new Date().toISOString()}`);
  log('');
  
  // 1. Vercel Deployments
  log('\n' + '='.repeat(80));
  log('1. VERCEL DEPLOYMENTS');
  log('='.repeat(80));
  
  const vercelList = exec('vercel list --limit 20', 'Vercel Deployment List');
  
  // Get latest deployment ID if available
  let latestDeployment = null;
  if (vercelList.success && vercelList.output) {
    const lines = vercelList.output.split('\n');
    for (const line of lines) {
      if (line.includes('https://') || line.match(/[a-z0-9]{24}/)) {
        const match = line.match(/([a-z0-9]{24})/);
        if (match) {
          latestDeployment = match[1];
          break;
        }
      }
    }
  }
  
  if (latestDeployment) {
    exec(`vercel inspect ${latestDeployment}`, 'Vercel Deployment Details');
    exec(`vercel logs ${latestDeployment} --output raw`, 'Vercel Deployment Logs');
  } else {
    exec('vercel logs --follow=false --limit=100', 'Vercel Recent Logs');
  }
  
  // 2. Vercel Build Logs
  log('\n' + '='.repeat(80));
  log('2. VERCEL BUILD LOGS');
  log('='.repeat(80));
  
  exec('vercel logs --follow=false', 'Vercel Build Logs');
  
  // 3. Check Vercel Project Status
  log('\n' + '='.repeat(80));
  log('3. VERCEL PROJECT STATUS');
  log('='.repeat(80));
  
  try {
    const projectInfo = execSync('vercel inspect', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '../website'),
      stdio: 'pipe'
    });
    log(projectInfo);
  } catch (e) {
    log('Could not get project info');
  }
  
  // 4. GitHub Actions (if available)
  log('\n' + '='.repeat(80));
  log('4. GITHUB ACTIONS');
  log('='.repeat(80));
  
  try {
    const ghRuns = execSync('gh run list --limit 10', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log('GitHub Actions Runs:');
    log(ghRuns);
    
    // Get latest run ID
    const runLines = ghRuns.split('\n').filter(l => l.trim());
    if (runLines.length > 1) {
      const latestRun = runLines[1].split(/\s+/)[0];
      if (latestRun) {
        try {
          const runLogs = execSync(`gh run view ${latestRun} --log`, {
            encoding: 'utf8',
            stdio: 'pipe',
            maxBuffer: 10 * 1024 * 1024
          });
          log(`\nGitHub Run ${latestRun} Logs:`);
          log(runLogs);
        } catch (e) {
          log(`Could not get logs for run ${latestRun}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    log('GitHub CLI not available or not authenticated');
    log(`Error: ${e.message}`);
  }
  
  // 5. Local Build Check
  log('\n' + '='.repeat(80));
  log('5. LOCAL BUILD CHECK');
  log('='.repeat(80));
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../website/package.json'), 'utf8'));
    log('Package.json scripts:');
    log(JSON.stringify(packageJson.scripts, null, 2));
  } catch (e) {
    log('Could not read package.json');
  }
  
  // 6. Environment Check
  log('\n' + '='.repeat(80));
  log('6. ENVIRONMENT VARIABLES CHECK');
  log('='.repeat(80));
  
  exec('vercel env ls', 'Vercel Environment Variables List');
  
  // 7. Analyze for errors
  log('\n' + '='.repeat(80));
  log('7. ERROR ANALYSIS');
  log('='.repeat(80));
  
  const allLogs = logs.join('\n');
  const errors = [];
  
  // Common error patterns
  const errorPatterns = [
    /error:/gi,
    /failed/gi,
    /exception/gi,
    /build failed/gi,
    /deployment failed/gi,
    /500/gi,
    /404/gi,
    /timeout/gi,
    /ENOENT/gi,
    /MODULE_NOT_FOUND/gi,
    /Cannot find module/gi,
    /syntax error/gi,
    /TypeError/gi,
    /ReferenceError/gi
  ];
  
  const lines = allLogs.split('\n');
  lines.forEach((line, index) => {
    errorPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        errors.push({
          line: index + 1,
          content: line.trim(),
          context: lines.slice(Math.max(0, index - 2), index + 3).join('\n')
        });
      }
    });
  });
  
  if (errors.length > 0) {
    log(`\nFound ${errors.length} potential errors:\n`);
    errors.slice(0, 50).forEach((error, i) => {
      log(`\nError ${i + 1} (Line ${error.line}):`);
      log(error.content);
      log(`Context:\n${error.context}`);
    });
  } else {
    log('\nNo obvious errors found in logs.');
  }
  
  // Save to file
  fs.writeFileSync(logFile, logs.join('\n'));
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Logs collected!');
  console.log('='.repeat(80));
  console.log(`\n📄 Saved to: ${logFile}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Total log lines: ${logs.length}`);
  console.log(`   • Potential errors found: ${errors.length}`);
  console.log(`\n💡 Review the log file for detailed information.\n`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

