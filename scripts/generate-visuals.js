#!/usr/bin/env node

/**
 * BEAST MODE - Visual Assets Generator
 * 
 * Automatically generates high-fidelity visual assets from:
 * - Mermaid diagrams (.mmd files)
 * - HTML/CSS templates
 * - Puppeteer screenshots
 * - FFmpeg GIF creation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');
const VISUALS_DIR = path.join(__dirname, '../visuals');
const DIAGRAMS_DIR = path.join(VISUALS_DIR, 'mermaid');
const HTML_DIR = path.join(VISUALS_DIR, 'html');

// Ensure directories exist
[ASSETS_DIR, VISUALS_DIR, DIAGRAMS_DIR, HTML_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

/**
 * Check if command exists
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate Mermaid diagram
 */
function generateMermaid(inputFile, outputFile) {
  // Try npx first (local install), then global
  const mermaidCmd = commandExists('mmdc') ? 'mmdc' : 'npx @mermaid-js/mermaid-cli';
  
  try {
    execSync(`${mermaidCmd} -i ${inputFile} -o ${outputFile} -w 1200 -H 800`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ Generated: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate ${outputFile}:`, error.message);
    return false;
  }
}

/**
 * Generate HTML-based visual with Puppeteer
 */
async function generateHTMLVisual(htmlFile, outputFile) {
  try {
    // Use dynamic require to handle missing puppeteer gracefully
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      console.warn('⚠️  Puppeteer not found. Install with: npm install puppeteer');
      return false;
    }
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Use absolute path for file:// protocol
    const absolutePath = path.resolve(htmlFile);
    await page.goto(`file://${absolutePath}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ 
      path: outputFile, 
      fullPage: true,
      type: 'png'
    });
    
    await browser.close();
    console.log(`✅ Generated: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate ${outputFile}:`, error.message);
    return false;
  }
}

/**
 * Generate GIF from frames
 */
function generateGIF(framesDir, outputFile, fps = 1) {
  if (!commandExists('ffmpeg')) {
    console.warn('⚠️  FFmpeg not found. Install with: brew install ffmpeg');
    return false;
  }

  try {
    execSync(
      `ffmpeg -framerate ${fps} -i ${framesDir}/frame-%02d.png -loop 0 ${outputFile}`,
      { stdio: 'inherit' }
    );
    console.log(`✅ Generated: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate ${outputFile}:`, error.message);
    return false;
  }
}

/**
 * Main generation function
 */
async function generateAllVisuals() {
  console.log('🎨 BEAST MODE Visual Assets Generator\n');
  console.log('Generating high-fidelity visual assets...\n');

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  // 1. Architecture Diagram (Mermaid)
  const archInput = path.join(DIAGRAMS_DIR, 'architecture.mmd');
  const archOutput = path.join(ASSETS_DIR, 'governance-layer-architecture.png');
  if (fs.existsSync(archInput)) {
    if (generateMermaid(archInput, archOutput)) {
      results.success.push('Architecture Diagram');
    } else {
      results.failed.push('Architecture Diagram');
    }
  } else {
    results.skipped.push('Architecture Diagram (file not found)');
  }

  // 2. Silent Janitor Workflow (Mermaid)
  const cycleInput = path.join(DIAGRAMS_DIR, 'overnight-cycle.mmd');
  const cycleOutput = path.join(ASSETS_DIR, 'overnight-refactoring-cycle.png');
  if (fs.existsSync(cycleInput)) {
    if (generateMermaid(cycleInput, cycleOutput)) {
      results.success.push('Silent Janitor Workflow');
    } else {
      results.failed.push('Silent Janitor Workflow');
    }
  } else {
    results.skipped.push('Silent Janitor Workflow (file not found)');
  }

  // 3. Dual-Brand Strategy (HTML/CSS)
  const mulletHTML = path.join(HTML_DIR, 'mullet-strategy.html');
  const mulletOutput = path.join(ASSETS_DIR, 'mullet-strategy-dual-brand.png');
  if (fs.existsSync(mulletHTML)) {
    if (await generateHTMLVisual(mulletHTML, mulletOutput)) {
      results.success.push('Dual-Brand Strategy');
    } else {
      results.failed.push('Dual-Brand Strategy');
    }
  } else {
    results.skipped.push('Dual-Brand Strategy (file not found)');
  }

  // 4. Vibe Ops Workflow (Mermaid)
  const vibeOpsInput = path.join(DIAGRAMS_DIR, 'vibe-ops.mmd');
  const vibeOpsOutput = path.join(ASSETS_DIR, 'english-as-source-code-workflow.png');
  if (fs.existsSync(vibeOpsInput)) {
    if (generateMermaid(vibeOpsInput, vibeOpsOutput)) {
      results.success.push('Vibe Ops Workflow');
    } else {
      results.failed.push('Vibe Ops Workflow');
    }
  } else {
    results.skipped.push('Vibe Ops Workflow (file not found)');
  }

  // 5. The 3 Walls (Mermaid)
  const wallsInput = path.join(DIAGRAMS_DIR, 'three-walls.mmd');
  const wallsOutput = path.join(ASSETS_DIR, 'three-walls-solution-map.png');
  if (fs.existsSync(wallsInput)) {
    if (generateMermaid(wallsInput, wallsOutput)) {
      results.success.push('The 3 Walls Solution Map');
    } else {
      results.failed.push('The 3 Walls Solution Map');
    }
  } else {
    results.skipped.push('The 3 Walls Solution Map (file not found)');
  }

  // 6. Before/After Transformation (HTML/CSS)
  const beforeAfterHTML = path.join(HTML_DIR, 'before-after.html');
  const beforeAfterOutput = path.join(ASSETS_DIR, 'before-after-transformation.png');
  if (fs.existsSync(beforeAfterHTML)) {
    if (await generateHTMLVisual(beforeAfterHTML, beforeAfterOutput)) {
      results.success.push('Before/After Transformation');
    } else {
      results.failed.push('Before/After Transformation');
    }
  } else {
    results.skipped.push('Before/After Transformation (file not found)');
  }

  // 7. Market Positioning Map (Mermaid)
  const marketInput = path.join(DIAGRAMS_DIR, 'market-positioning.mmd');
  const marketOutput = path.join(ASSETS_DIR, 'market-positioning-map.png');
  if (fs.existsSync(marketInput)) {
    if (generateMermaid(marketInput, marketOutput)) {
      results.success.push('Market Positioning Map');
    } else {
      results.failed.push('Market Positioning Map');
    }
  } else {
    results.skipped.push('Market Positioning Map (file not found)');
  }

  // 8. Mandatory GIF (if frames exist)
  const gifFramesDir = path.join(HTML_DIR, 'gif-frames');
  const gifOutput = path.join(ASSETS_DIR, 'janitor-transformation-demo.gif');
  if (fs.existsSync(gifFramesDir)) {
    if (generateGIF(gifFramesDir, gifOutput)) {
      results.success.push('Mandatory GIF');
    } else {
      results.failed.push('Mandatory GIF');
    }
  } else {
    results.skipped.push('Mandatory GIF (frames not found)');
  }

  // Summary
  console.log('\n📊 Generation Summary:');
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);

  if (results.success.length > 0) {
    console.log('\n✅ Generated:');
    results.success.forEach(item => console.log(`   - ${item}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(item => console.log(`   - ${item}`));
  }

  if (results.skipped.length > 0) {
    console.log('\n⏭️  Skipped:');
    results.skipped.forEach(item => console.log(`   - ${item}`));
  }

  console.log(`\n📁 Assets saved to: ${ASSETS_DIR}`);
}

// Run if called directly
if (require.main === module) {
  generateAllVisuals().catch(console.error);
}

module.exports = { generateAllVisuals, generateMermaid, generateHTMLVisual, generateGIF };

