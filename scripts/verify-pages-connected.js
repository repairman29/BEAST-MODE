#!/usr/bin/env node

/**
 * Verify All Pages Are Built and Connected
 * 
 * Checks that all pages exist and are properly linked
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../website/app');
const componentsDir = path.join(__dirname, '../website/components');

// Expected pages based on app directory structure
const expectedPages = [
  '/', // home
  '/about',
  '/pricing',
  '/docs',
  '/docs/QUICK_START',
  '/docs/API',
  '/docs/CLI',
  '/docs/ENTERPRISE',
  '/docs/FAQS',
  '/docs/TROUBLESHOOTING',
  '/docs/USER_GUIDE',
  '/docs/ANALYTICS',
  '/docs/3_EASY_STEPS',
  '/docs/FTUE',
  '/docs/plugins',
  '/dashboard',
  '/dashboard/customer',
  '/monitoring',
  '/integrations',
  '/marketplace',
  '/enterprise',
  '/support',
  '/privacy',
  '/terms',
  '/quality',
  '/cost-tracking',
  '/bot-feedback',
  '/ai-features',
  '/blog/brand-story',
  '/admin',
  '/admin/analytics',
  '/admin/monitoring',
  '/admin/performance',
  '/admin/productivity',
  '/admin/bug-tracking',
  '/admin/feedback',
  '/admin/cost-tracking',
];

// Pages that might be missing
const potentiallyMissing = [
  '/admin/plg-usage',
  '/plg-demo',
];

function checkPageExists(route) {
  if (route === '/') {
    const pagePath = path.join(appDir, 'page.tsx');
    return fs.existsSync(pagePath);
  }
  
  const routeParts = route.split('/').filter(Boolean);
  const pagePath = path.join(appDir, ...routeParts, 'page.tsx');
  return fs.existsSync(pagePath);
}

function findLinksInFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const links = [];
  
  // Find href="/..." patterns
  const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
  for (const match of hrefMatches) {
    links.push(match[1]);
  }
  
  // Find Link href patterns
  const linkMatches = content.matchAll(/<Link[^>]*href=["']([^"']+)["']/g);
  for (const match of linkMatches) {
    links.push(match[1]);
  }
  
  // Find router.push patterns
  const routerMatches = content.matchAll(/router\.push\(["']([^"']+)["']/g);
  for (const match of routerMatches) {
    links.push(match[1]);
  }
  
  return links;
}

function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

async function verifyPages() {
  console.log('\n🔍 Verifying All Pages Are Built and Connected\n');
  console.log('='.repeat(60));
  
  const results = {
    existing: [],
    missing: [],
    linked: [],
    unlinked: []
  };
  
  // Check expected pages
  console.log('\n📄 Checking Expected Pages:\n');
  
  expectedPages.forEach(route => {
    const exists = checkPageExists(route);
    if (exists) {
      results.existing.push(route);
      console.log(`   ✅ ${route}`);
    } else {
      results.missing.push(route);
      console.log(`   ❌ ${route} - MISSING`);
    }
  });
  
  // Check potentially missing pages
  console.log('\n⚠️  Checking Potentially Missing Pages:\n');
  potentiallyMissing.forEach(route => {
    const exists = checkPageExists(route);
    if (exists) {
      console.log(`   ✅ ${route} - EXISTS`);
      results.existing.push(route);
    } else {
      console.log(`   ⚠️  ${route} - Not found (may be optional)`);
    }
  });
  
  // Find all component files
  console.log('\n🔗 Scanning for Links:\n');
  const componentFiles = scanDirectory(componentsDir);
  const appFiles = scanDirectory(appDir).filter(f => 
    f.includes('page.tsx') || f.includes('layout.tsx') || f.includes('Navigation')
  );
  
  const allFiles = [...componentFiles, ...appFiles];
  const allLinks = new Set();
  
  allFiles.forEach(file => {
    const links = findLinksInFile(file);
    links.forEach(link => {
      // Only track internal links
      if (link.startsWith('/') && !link.startsWith('//') && !link.startsWith('/api')) {
        allLinks.add(link);
      }
    });
  });
  
  console.log(`   Found ${allLinks.size} unique internal links`);
  
  // Check which pages are linked
  results.existing.forEach(route => {
    if (allLinks.has(route) || route === '/') {
      results.linked.push(route);
    } else {
      results.unlinked.push(route);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`   ✅ Pages Existing: ${results.existing.length}/${expectedPages.length}`);
  console.log(`   ❌ Pages Missing: ${results.missing.length}`);
  console.log(`   🔗 Pages Linked: ${results.linked.length}`);
  console.log(`   ⚠️  Pages Unlinked: ${results.unlinked.length}`);
  
  if (results.missing.length > 0) {
    console.log('\n❌ Missing Pages:');
    results.missing.forEach(route => {
      console.log(`   • ${route}`);
    });
  }
  
  if (results.unlinked.length > 0) {
    console.log('\n⚠️  Unlinked Pages (exist but not linked anywhere):');
    results.unlinked.forEach(route => {
      console.log(`   • ${route}`);
    });
  }
  
  // Check Navigation component specifically
  console.log('\n🧭 Checking Navigation Component:\n');
  const navPath = path.join(componentsDir, 'layout/Navigation.tsx');
  if (fs.existsSync(navPath)) {
    const navContent = fs.readFileSync(navPath, 'utf8');
    const navLinks = findLinksInFile(navPath);
    console.log(`   ✅ Navigation component exists`);
    console.log(`   🔗 Links found in Navigation: ${navLinks.length}`);
    navLinks.forEach(link => {
      console.log(`      • ${link}`);
    });
  } else {
    console.log(`   ❌ Navigation component not found`);
  }
  
  // Final status
  console.log('\n' + '='.repeat(60));
  if (results.missing.length === 0 && results.unlinked.length === 0) {
    console.log('\n✅ All pages are built and connected!\n');
  } else {
    console.log('\n⚠️  Some pages need attention\n');
    console.log('📋 Recommendations:');
    if (results.missing.length > 0) {
      console.log('   1. Create missing pages');
    }
    if (results.unlinked.length > 0) {
      console.log('   2. Add links to Navigation or other components');
    }
    console.log('');
  }
  
  return results;
}

if (require.main === module) {
  verifyPages()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyPages };
