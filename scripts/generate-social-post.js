#!/usr/bin/env node

/**
 * Generate Social Media Posts
 * 
 * Generates social media posts based on templates and content
 */

const fs = require('fs');
const path = require('path');

const templates = {
  brandStory: {
    twitter: `🚀 Introducing BEAST MODE

The developer tool we wish existed.

✅ See your code quality in 10 seconds
✅ Automated fixes (we fix it, not just tell you)
✅ Day 2 Operations (code improves while you sleep)

Try free: beast-mode.dev

#CodeQuality #DeveloperTools #BEASTMODE`,
    
    linkedin: `Introducing BEAST MODE: Quality Intelligence for Developers

We built the developer tool we wish existed.

The problem: Code quality tools are too slow, too expensive, too complex.

The solution: BEAST MODE.

✅ Instant feedback (10 seconds, no setup)
✅ Automated fixes (we fix it, not just analyze)
✅ Day 2 Operations (code improves while you sleep)
✅ Context-aware intelligence (answers based on YOUR code)

Try free: beast-mode.dev

#DeveloperTools #CodeQuality #SoftwareDevelopment`,
    
    reddit: `BEAST MODE - Code Quality Tool We Built (Free Tier Available)

Hey r/webdev,

We built a code quality tool that actually fixes code, not just analyzes it.

**What it does:**
- See your code quality in 10 seconds
- Automated fixes (one click, code fixed)
- Day 2 Operations (code improves while you sleep)
- Context-aware answers (based on YOUR code)

**Free tier:** 10 PRs/month, no credit card

**Why we built it:** We were tired of tools that tell you what's wrong but don't fix it.

Try it: beast-mode.dev

Happy to answer questions!`
  },
  
  featureHighlight: {
    automatedFixes: {
      twitter: `💡 BEAST MODE Feature: Automated Fixes

We don't just tell you what's wrong.

We fix it. Automatically.

One click. Code fixed. You're done.

Try it free → beast-mode.dev

#CodeQuality #Automation #BEASTMODE`,
      
      linkedin: `Automated Code Fixes: The Future of Development

Most code quality tools tell you what's wrong. BEAST MODE fixes it.

Here's how it works:

1. Analyze your code
2. Identify issues
3. Fix them automatically
4. You review and merge

Time saved: 3 hours debugging → 10 minutes fixing

Try BEAST MODE free: beast-mode.dev

#CodeQuality #Automation #DeveloperTools`
    },
    
    day2Operations: {
      twitter: `🌙 Day 2 Operations: Wake up to clean code

Silent refactoring runs 2 AM - 6 AM.

Your codebase improves while you sleep.

No manual work. No interruptions. Just better code.

Try free → beast-mode.dev

#Day2Operations #CodeQuality #BEASTMODE`,
      
      linkedin: `Day 2 Operations: Your Codebase Improves While You Sleep

Traditional code quality: Manual reviews, scheduled maintenance, technical debt.

BEAST MODE Day 2 Operations: Silent refactoring runs 2 AM - 6 AM. Your codebase improves automatically.

Results:
- 23 issues fixed overnight
- 5 PRs merged automatically
- 0 manual work required

Try it free: beast-mode.dev

#Day2Operations #CodeQuality #Automation`
    }
  },
  
  developerStory: {
    twitter: `"BEAST MODE makes you a better developer, faster."

My code quality went from 60 to 85 in a month.

I actually sleep better knowing my codebase is improving while I'm not working.

Try free → beast-mode.dev

#DeveloperTools #CodeQuality #BEASTMODE`,
    
    linkedin: `Developer Success Story: How BEAST MODE Improved My Code Quality

"I used to spend hours debugging. Now BEAST MODE catches issues before I even commit. My code quality went from 60 to 85 in a month. I actually sleep better knowing my codebase is improving while I'm not working."

- Developer using BEAST MODE

Try it free: beast-mode.dev

#DeveloperTools #CodeQuality #SuccessStory`
  }
};

function generatePost(type, platform, feature = null) {
  let post;
  
  if (type === 'brandStory') {
    post = templates.brandStory[platform];
  } else if (type === 'featureHighlight') {
    if (!feature || !templates.featureHighlight[feature]) {
      console.error('Feature not found. Available:', Object.keys(templates.featureHighlight));
      return null;
    }
    post = templates.featureHighlight[feature][platform];
  } else if (type === 'developerStory') {
    post = templates.developerStory[platform];
  } else {
    console.error('Type not found. Available: brandStory, featureHighlight, developerStory');
    return null;
  }
  
  return post;
}

function savePost(post, filename) {
  const outputDir = path.join(__dirname, '../content/social-media');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, post, 'utf8');
  console.log(`✅ Saved: ${filepath}`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const type = args[0]; // brandStory, featureHighlight, developerStory
  const platform = args[1]; // twitter, linkedin, reddit
  const feature = args[2]; // automatedFixes, day2Operations (for featureHighlight)
  
  if (!type || !platform) {
    console.log('Usage: node generate-social-post.js <type> <platform> [feature]');
    console.log('');
    console.log('Types:');
    console.log('  - brandStory');
    console.log('  - featureHighlight (requires feature)');
    console.log('  - developerStory');
    console.log('');
    console.log('Platforms:');
    console.log('  - twitter');
    console.log('  - linkedin');
    console.log('  - reddit');
    console.log('');
    console.log('Features (for featureHighlight):');
    console.log('  - automatedFixes');
    console.log('  - day2Operations');
    console.log('');
    console.log('Example:');
    console.log('  node generate-social-post.js brandStory twitter');
    console.log('  node generate-social-post.js featureHighlight twitter automatedFixes');
    process.exit(1);
  }
  
  const post = generatePost(type, platform, feature);
  if (post) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${type}-${platform}-${timestamp}.txt`;
    savePost(post, filename);
    console.log('\n📝 Generated Post:');
    console.log('='.repeat(50));
    console.log(post);
    console.log('='.repeat(50));
  }
}

module.exports = { generatePost, templates };
