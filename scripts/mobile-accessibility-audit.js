#!/usr/bin/env node

/**
 * Mobile & Accessibility Audit Script
 * Checks for mobile responsiveness and accessibility issues
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const issues = {
  mobile: [],
  accessibility: []
};

async function auditFiles() {
  console.log('🔍 Auditing components for mobile & accessibility...\n');

  const componentFiles = await glob('website/components/**/*.tsx', {
    cwd: path.join(__dirname, '..'),
    absolute: true
  });

  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), file);

    // Check for mobile responsiveness
    if (content.includes('grid grid-cols-2') && !content.includes('md:grid-cols')) {
      issues.mobile.push({
        file: relativePath,
        issue: 'Grid with 2 columns missing mobile breakpoint',
        fix: 'Add md:grid-cols-2 or grid-cols-1 md:grid-cols-2'
      });
    }

    if (content.includes('grid grid-cols-3') && !content.includes('md:grid-cols')) {
      issues.mobile.push({
        file: relativePath,
        issue: 'Grid with 3 columns missing mobile breakpoint',
        fix: 'Add md:grid-cols-3 or grid-cols-1 md:grid-cols-3'
      });
    }

    // Check for accessibility
    if (content.includes('<button') && !content.includes('aria-label') && !content.includes('aria-labelledby')) {
      const buttonMatches = content.match(/<button[^>]*>([^<]+)</g);
      if (buttonMatches) {
        const hasText = buttonMatches.some(match => {
          const text = match.replace(/<button[^>]*>/, '').trim();
          return text.length > 0 && !text.match(/^[^a-zA-Z]*$/);
        });
        if (!hasText) {
          issues.accessibility.push({
            file: relativePath,
            issue: 'Button missing aria-label',
            fix: 'Add aria-label to icon-only buttons'
          });
        }
      }
    }

    if (content.includes('<img') && !content.includes('alt=')) {
      issues.accessibility.push({
        file: relativePath,
        issue: 'Image missing alt attribute',
        fix: 'Add alt attribute to all images'
      });
    }
  }

  // Report
  console.log('📱 Mobile Responsiveness Issues:');
  if (issues.mobile.length === 0) {
    console.log('   ✅ No issues found\n');
  } else {
    issues.mobile.forEach(issue => {
      console.log(`   ⚠️  ${issue.file}`);
      console.log(`      ${issue.issue}`);
      console.log(`      Fix: ${issue.fix}\n`);
    });
  }

  console.log('♿ Accessibility Issues:');
  if (issues.accessibility.length === 0) {
    console.log('   ✅ No issues found\n');
  } else {
    issues.accessibility.forEach(issue => {
      console.log(`   ⚠️  ${issue.file}`);
      console.log(`      ${issue.issue}`);
      console.log(`      Fix: ${issue.fix}\n`);
    });
  }

  const totalIssues = issues.mobile.length + issues.accessibility.length;
  console.log(`\n📊 Total Issues: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('✅ All components are mobile-responsive and accessible!');
  }
}

auditFiles().catch(console.error);
