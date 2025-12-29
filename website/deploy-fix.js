#!/usr/bin/env node

/**
 * Manual Vercel Deployment Fix
 * Bypasses project settings issues by directly updating build configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Vercel Deployment Configuration...\n');

// Update vercel.json with explicit settings
const vercelConfig = {
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "rootDirectory": ".",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('✅ Updated vercel.json with correct configuration');

// Create a .vercelignore to ensure clean builds
const vercelIgnore = `
.vercel
.env
.env.local
.vercelignore
.next
node_modules
*.log
`;

fs.writeFileSync('.vercelignore', vercelIgnore);
console.log('✅ Created .vercelignore for clean builds');

console.log('\n🚀 Next Steps:');
console.log('1. Commit and push these changes to your repository');
console.log('2. Vercel will auto-deploy with the new configuration');
console.log('3. Or manually trigger deployment in Vercel dashboard');

console.log('\n🌐 Domain Setup:');
console.log('1. Go to Vercel dashboard → Project Settings → Domains');
console.log('2. Add beast-mode.dev');
console.log('3. Copy DNS records to Porkbun');
console.log('4. Wait 5-10 minutes for propagation');

console.log('\n🔗 Current working URL:');
console.log('https://beast-mode-landing-7kg9opher-jeff-adkins-projects.vercel.app/');
