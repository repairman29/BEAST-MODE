#!/usr/bin/env node

/**
 * Create Logos - Simple Version (No Sharp Required)
 * 
 * Uses Replicate to create all logo variations from base image
 * Maintains consistency by using same base for all
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment
function loadEnv() {
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const logosDir = path.join(__dirname, '../website/public/logos');
const outputDir = path.join(__dirname, '../website/public/logos/final');

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // Handle both string URLs and arrays
    const imageUrl = typeof url === 'string' ? url : (Array.isArray(url) ? url[0] : url);
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      reject(new Error('Invalid image URL'));
      return;
    }
    
    const protocol = imageUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function remixWithReplicate(inputImagePath, prompt, outputPath) {
  const Replicate = require('replicate');
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY
  });

  if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_TOKEN not found');
  }

  console.log(`   🎨 ${prompt.substring(0, 60)}...`);
  
  // Read image as base64
  const imageBuffer = fs.readFileSync(inputImagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const imageDataUri = `data:image/png;base64,${imageBase64}`;

  try {
    console.log('   ⏳ Calling Replicate...');
    
    // Handle rate limiting with retries
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        // Try flux-schnell first (faster, cheaper), fallback to flux-dev
        let model = "black-forest-labs/flux-schnell";
        let output;
        
        try {
          output = await replicate.run(model, {
            input: {
              image: imageDataUri,
              prompt: prompt,
              num_outputs: 1,
              guidance_scale: 3.5,
              num_inference_steps: 4,
              output_format: "png"
            }
          });
        } catch (e) {
          // Fallback to flux-dev if schnell fails
          console.log('   ⏳ Trying flux-dev...');
          model = "black-forest-labs/flux-dev";
          output = await replicate.run(model, {
            input: {
              prompt: prompt,
              num_outputs: 1,
              guidance_scale: 3.5,
              num_inference_steps: 28,
              output_format: "png"
            }
          });
        }

        // Handle different response formats
        // Replicate returns async iterators or direct URLs
        let imageUrl;
        
        // If it's an async iterator, we need to wait for it
        if (output && typeof output[Symbol.asyncIterator] === 'function') {
          console.log('   ⏳ Waiting for async result...');
          for await (const item of output) {
            if (typeof item === 'string') {
              imageUrl = item;
              break;
            } else if (item && typeof item === 'object') {
              imageUrl = item.url || item.image || item;
              if (typeof imageUrl === 'string') break;
            }
          }
        } else if (typeof output === 'string') {
          imageUrl = output;
        } else if (Array.isArray(output)) {
          // Find first string URL in array
          for (const item of output) {
            if (typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))) {
              imageUrl = item;
              break;
            } else if (item && typeof item === 'object') {
              const url = item.url || item.image || item.output;
              if (typeof url === 'string') {
                imageUrl = url;
                break;
              }
            }
          }
          // If no URL found, try first element
          if (!imageUrl && output[0]) {
            imageUrl = output[0];
          }
        } else if (output && typeof output === 'object') {
          imageUrl = output.url || output.image || output.output || output[0];
        } else {
          imageUrl = output;
        }

        // Final check - if still not a string, log and try to extract
        if (imageUrl && typeof imageUrl === 'object') {
          imageUrl = imageUrl.url || imageUrl.image || imageUrl[0] || String(imageUrl);
        }

        if (!imageUrl || typeof imageUrl !== 'string' || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:'))) {
          console.log('   ⚠️  Response format:', typeof output, Array.isArray(output) ? `(array[${output.length}])` : '');
          console.log('   ⚠️  Sample:', JSON.stringify(output).substring(0, 300));
          throw new Error(`Invalid response format: got ${typeof imageUrl}, expected string URL`);
        }
        
        console.log('   ✅ Got image URL');

        console.log('   ⏳ Downloading...');
        await downloadImage(imageUrl, outputPath);
        console.log(`   ✅ Saved`);
        return outputPath;
      } catch (error) {
        lastError = error;
        
        // Check for rate limit
        if (error.message && error.message.includes('429')) {
          const retryAfter = error.message.match(/retry_after[":\s]+(\d+)/i);
          const waitTime = retryAfter ? parseInt(retryAfter[1]) * 1000 : 10000;
          console.log(`   ⏳ Rate limited, waiting ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries--;
        } else {
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Failed after retries');
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🎨 Creating Final Logos with Replicate\n');
  console.log('='.repeat(60));

  if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    console.log('\n📋 Set it in website/.env.local:');
    console.log('   REPLICATE_API_TOKEN=r8_...\n');
    process.exit(1);
  }

  console.log('✅ Replicate API token found\n');

  await fs.promises.mkdir(outputDir, { recursive: true });

  // Use best base image
  const baseImage = path.join(logosDir, 'beast-head-primary.png');
  if (!fs.existsSync(baseImage)) {
    console.error('❌ Base image not found:', baseImage);
    process.exit(1);
  }

  console.log(`✅ Using base: ${path.basename(baseImage)}\n`);

  const variations = [
    {
      name: 'beast-head-primary',
      prompt: 'Keep this exact beast head icon, place on white background, no text, professional tech company style, clean, 1024x1024'
    },
    {
      name: 'beast-head-dark',
      prompt: 'Keep this exact beast head icon, place on dark background (#1F2937), no text, professional tech company style, clean, 1024x1024'
    },
    {
      name: 'full-logo-horizontal',
      prompt: 'Keep this exact beast head icon on the left, add "BEAST MODE" text on the right in bold uppercase sans-serif font (Inter Bold), blue (#3B82F6), professional tech company style, horizontal layout, white background, clean and modern, 1024x512'
    },
    {
      name: 'full-logo-stacked',
      prompt: 'Keep this exact beast head icon on top, add "BEAST MODE" text below in bold uppercase sans-serif font (Inter Bold), blue (#3B82F6), professional tech company style, vertical stacked layout, white background, clean and modern, 512x1024'
    },
    {
      name: 'favicon',
      prompt: 'Keep this exact beast head icon, simplify for small sizes, white background, professional, 512x512'
    }
  ];

  console.log(`📋 Processing ${variations.length} variations...\n`);

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    try {
      console.log(`[${i + 1}/${variations.length}] ${variation.name}...`);
      const outputPath = path.join(outputDir, `${variation.name}.png`);
      await remixWithReplicate(baseImage, variation.prompt, outputPath);
      console.log('');
      
      // Wait between requests (rate limit - free tier is 6/min with burst of 1)
      if (i < variations.length - 1) {
        const waitTime = 12000; // 12 seconds to stay under 6/min limit
        console.log(`   ⏳ Waiting ${waitTime/1000}s (rate limit)...\n`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('\n✅ All logos created!');
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
  console.log('   1. Review the logos');
  console.log('   2. Replace original logos if these are better');
  console.log('   3. Create favicon.ico (16x16, 32x32) from favicon.png\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { remixWithReplicate };
