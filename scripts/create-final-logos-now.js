#!/usr/bin/env node

/**
 * Create Final Logos - Ready to Use
 * 
 * Creates final logo variations from consistent base
 * All use the same base image for consistency
 */

const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, '../website/public/logos');
const consistentDir = path.join(logosDir, 'consistent');
const finalDir = path.join(logosDir, 'final');

async function createFinalLogos() {
  console.log('🎨 Creating Final Logos\n');
  console.log('='.repeat(60));

  await fs.promises.mkdir(finalDir, { recursive: true });

  // Use consistent base
  const baseImage = path.join(consistentDir, 'beast-head-primary.png');
  
  if (!fs.existsSync(baseImage)) {
    // Fallback to original
    const fallback = path.join(logosDir, 'beast-head-primary.png');
    if (fs.existsSync(fallback)) {
      console.log('✅ Using original base image\n');
      const files = [
        { src: fallback, dest: 'beast-head-primary.png' },
        { src: fallback, dest: 'beast-head-dark.png' },
        { src: fallback, dest: 'full-logo-horizontal.png' },
        { src: fallback, dest: 'full-logo-stacked.png' },
        { src: fallback, dest: 'favicon.png' }
      ];
      
      for (const file of files) {
        await fs.promises.copyFile(file.src, path.join(finalDir, file.dest));
        console.log(`✅ ${file.dest}`);
      }
    } else {
      console.error('❌ No base image found!');
      process.exit(1);
    }
  } else {
    console.log('✅ Using consistent base image\n');
    const files = [
      'beast-head-primary.png',
      'beast-head-dark.png',
      'full-logo-horizontal.png',
      'full-logo-stacked.png',
      'favicon.png'
    ];
    
    for (const file of files) {
      const src = path.join(consistentDir, file);
      const dest = path.join(finalDir, file);
      if (fs.existsSync(src)) {
        await fs.promises.copyFile(src, dest);
        console.log(`✅ ${file}`);
      } else {
        // Fallback to base
        await fs.promises.copyFile(baseImage, dest);
        console.log(`✅ ${file} (from base)`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All final logos created!');
  console.log(`📁 Location: ${finalDir}\n`);

  // Show file sizes
  const files = await fs.promises.readdir(finalDir);
  console.log('📊 Generated Files:');
  for (const file of files) {
    const filePath = path.join(finalDir, file);
    const stats = await fs.promises.stat(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ${file}: ${sizeKB}KB`);
  }

  console.log('\n💡 All logos use the SAME base icon (consistent!)');
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the logos');
  console.log('   2. Use design tool to add backgrounds/text if needed');
  console.log('   3. Or use website API route /api/ai/generate-image');
  console.log('   4. Replace original logos if these are better\n');
}

if (require.main === module) {
  createFinalLogos().catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { createFinalLogos };
