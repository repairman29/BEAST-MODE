#!/usr/bin/env node

/**
 * Launch Marketing Campaign
 * Uses BEAST MODE to automate marketing launch
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 BEAST MODE: Launching Marketing Campaign');
console.log('============================================================\n');

const EXTENSION_ROOT = path.join(__dirname, '../..', 'beast-mode-extension');

// Check marketing materials
console.log('[1/4] Checking Marketing Materials...\n');

const materials = {
  blog: path.join(EXTENSION_ROOT, 'BLOG_POST.md'),
  twitter: path.join(EXTENSION_ROOT, 'TWITTER_ANNOUNCEMENT.md'),
  marketplace: path.join(EXTENSION_ROOT, 'MARKETPLACE_LISTING.md')
};

let allReady = true;
Object.entries(materials).forEach(([name, filePath]) => {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${name}: ${(stats.size / 1024).toFixed(1)}KB`);
  } else {
    console.log(`   ❌ ${name}: Missing`);
    allReady = false;
  }
});

if (!allReady) {
  console.log('\n⚠️  Some marketing materials are missing');
} else {
  console.log('\n✅ All marketing materials ready');
}

// Generate social media posts
console.log('\n[2/4] Generating Social Media Posts...\n');

const linkedinPost = `🚀 Excited to announce BEAST MODE VS Code Extension!

The only extension that:
🛡️ Prevents committing secrets
🏗️ Enforces architecture
✨ Self-heals code quality
🧠 Provides AI context

Now available in VS Code Marketplace!

Try it free: https://marketplace.visualstudio.com/items?itemName=beast-mode.beast-mode

#VSCode #CodeQuality #DevTools #AI #Security #Enterprise`;

const linkedinPath = path.join(EXTENSION_ROOT, 'LINKEDIN_POST.md');
fs.writeFileSync(linkedinPath, linkedinPost);
console.log('   ✅ LinkedIn post created');

const productHuntPost = `BEAST MODE - Enterprise Quality Intelligence Platform

🛡️ Secret Interceptor - Prevents committing secrets automatically
🏗️ Architecture Enforcement - Blocks bad patterns
✨ Self-Healing - Improves code quality automatically
🧠 Oracle AI - AI-powered code assistance

The only VS Code extension that combines all these features.

Perfect for enterprise teams who need:
- Security (prevent secret leaks)
- Quality (automated improvement)
- Architecture (prevent technical debt)
- AI assistance (context-aware help)

Try it free: https://beast-mode.dev`;

const productHuntPath = path.join(EXTENSION_ROOT, 'PRODUCT_HUNT_POST.md');
fs.writeFileSync(productHuntPath, productHuntPost);
console.log('   ✅ Product Hunt post created');

// Generate email template
console.log('\n[3/4] Generating Email Template...\n');

const emailTemplate = `Subject: 🚀 BEAST MODE VS Code Extension Now Available!

Hi [Name],

I'm excited to announce that BEAST MODE is now available as a VS Code extension!

BEAST MODE is the only VS Code extension that:
- 🛡️ Prevents committing secrets (API keys, tokens, etc.)
- 🏗️ Enforces architecture patterns
- ✨ Self-heals code quality automatically
- 🧠 Provides AI-powered code assistance

Perfect for enterprise teams who need security, quality, and AI assistance in one tool.

Try it free: https://marketplace.visualstudio.com/items?itemName=beast-mode.beast-mode

Learn more: https://beast-mode.dev

Best,
BEAST MODE Team`;

const emailPath = path.join(EXTENSION_ROOT, 'EMAIL_TEMPLATE.md');
fs.writeFileSync(emailPath, emailTemplate);
console.log('   ✅ Email template created');

// Generate launch checklist
console.log('\n[4/4] Generating Launch Checklist...\n');

const checklist = `# Marketing Launch Checklist

## Pre-Launch
- [ ] Extension published to VS Code Marketplace
- [ ] Website updated with extension link
- [ ] All marketing materials reviewed

## Launch Day
- [ ] Publish blog post
- [ ] Post Twitter/X thread
- [ ] Share on LinkedIn
- [ ] Post on Product Hunt (optional)
- [ ] Send email newsletter (if applicable)
- [ ] Update website homepage

## Post-Launch
- [ ] Monitor extension installs
- [ ] Respond to reviews
- [ ] Track social media engagement
- [ ] Collect user feedback
- [ ] Iterate based on feedback

## Materials Ready
- ✅ Blog post: BLOG_POST.md
- ✅ Twitter thread: TWITTER_ANNOUNCEMENT.md
- ✅ LinkedIn post: LINKEDIN_POST.md
- ✅ Product Hunt post: PRODUCT_HUNT_POST.md
- ✅ Email template: EMAIL_TEMPLATE.md
- ✅ Marketplace listing: MARKETPLACE_LISTING.md

## Links
- Extension: https://marketplace.visualstudio.com/items?itemName=beast-mode.beast-mode
- Website: https://beast-mode.dev
- Documentation: https://beast-mode.dev/docs
`;

const checklistPath = path.join(EXTENSION_ROOT, 'LAUNCH_CHECKLIST.md');
fs.writeFileSync(checklistPath, checklist);
console.log('   ✅ Launch checklist created');

console.log('\n============================================================');
console.log('✅ Marketing Campaign Ready!');
console.log('\n📋 Next Steps:');
console.log('   1. Review all materials in beast-mode-extension/');
console.log('   2. Publish blog post');
console.log('   3. Post on social media');
console.log('   4. Share with community');
console.log('\n📄 Files Created:');
console.log('   • LINKEDIN_POST.md');
console.log('   • PRODUCT_HUNT_POST.md');
console.log('   • EMAIL_TEMPLATE.md');
console.log('   • LAUNCH_CHECKLIST.md');
