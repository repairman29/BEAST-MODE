#!/usr/bin/env node

/**
 * Create Consistent Logos from Base Image
 * 
 * Takes the best base logo and creates all variations from it
 * Uses Sharp for image manipulation to maintain consistency
 */

const fs = require('fs');
const path = require('path');

// Try to require sharp, fallback to basic operations
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp not installed. Installing...');
  console.log('   Run: npm install sharp');
  process.exit(1);
}

const logosDir = path.join(__dirname, '../website/public/logos');
const outputDir = path.join(__dirname, '../website/public/logos/consistent');

async function createConsistentLogos() {
  console.log('🎨 Creating Consistent Logo Variations\n');
  console.log('='.repeat(60));

  // Find the best base image
  const baseImages = [
    'beast-head-primary.png',
    'beast-head-dark.png',
    'full-logo-horizontal.png',
    'full-logo-stacked.png'
  ];

  let baseImagePath = null;
  for (const img of baseImages) {
    const fullPath = path.join(logosDir, img);
    if (fs.existsSync(fullPath)) {
      baseImagePath = fullPath;
      console.log(`✅ Using base: ${img}\n`);
      break;
    }
  }

  if (!baseImagePath) {
    console.error('❌ No base logo found!');
    process.exit(1);
  }

  await fs.promises.mkdir(outputDir, { recursive: true });

  const baseImage = sharp(baseImagePath);
  const metadata = await baseImage.metadata();
  console.log(`   Base image: ${metadata.width}x${metadata.height}\n`);

  // 1. Beast head primary (light background)
  console.log('[1/5] beast-head-primary.png...');
  await baseImage
    .clone()
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'beast-head-primary.png'));
  console.log('   ✅ Created (white background)');

  // 2. Beast head dark (dark background)
  console.log('[2/5] beast-head-dark.png...');
  await baseImage
    .clone()
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 31, g: 41, b: 55, alpha: 1 } // #1F2937
    })
    .png()
    .toFile(path.join(outputDir, 'beast-head-dark.png'));
  console.log('   ✅ Created (dark background)');

  // 3. Full logo horizontal - icon on left, space for text on right
  console.log('[3/5] full-logo-horizontal.png...');
  await baseImage
    .clone()
    .resize(512, 512, { fit: 'contain' })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 512,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'full-logo-horizontal.png'));
  console.log('   ✅ Created (icon + space for text)');

  // 4. Full logo stacked - icon on top, space for text below
  console.log('[4/5] full-logo-stacked.png...');
  await baseImage
    .clone()
    .resize(512, 512, { fit: 'contain' })
    .extend({
      top: 0,
      bottom: 512,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'full-logo-stacked.png'));
  console.log('   ✅ Created (icon + space for text)');

  // 5. Favicon - optimized for small sizes
  console.log('[5/5] favicon.png...');
  await baseImage
    .clone()
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'favicon.png'));
  console.log('   ✅ Created (512x512, can be resized to 32x32)');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All consistent variations created!');
  console.log(`📁 Location: ${outputDir}\n`);

  // Show file sizes
  const files = await fs.promises.readdir(outputDir);
  console.log('📊 Generated Files:');
  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const stats = await fs.promises.stat(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ${file}: ${sizeKB}KB`);
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Review the consistent logos');
  console.log('   2. Add "BEAST MODE" text to full logos (using design tool)');
  console.log('   3. Replace original logos if these are better');
  console.log('   4. Create favicon.ico from favicon.png (16x16, 32x32)\n');
}

if (require.main === module) {
  createConsistentLogos().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { createConsistentLogos };
