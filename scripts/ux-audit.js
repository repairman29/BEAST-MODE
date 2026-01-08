#!/usr/bin/env node

/**
 * UX Audit Script
 * Reviews pages and components against UX psychology principles
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const principles = {
  'Cognitive Load': {
    checks: [
      'Too many options at once',
      'Unclear visual hierarchy',
      'Inconsistent patterns',
      'Information overload'
    ]
  },
  'Visual Hierarchy': {
    checks: [
      'Missing clear primary action',
      'Poor typography scale',
      'Inadequate whitespace',
      'Unclear content structure'
    ]
  },
  'Feedback & Affordances': {
    checks: [
      'Missing hover states',
      'No loading indicators',
      'Unclear button states',
      'Missing error messages'
    ]
  },
  'Consistency': {
    checks: [
      'Inconsistent spacing',
      'Mixed design patterns',
      'Inconsistent colors',
      'Varying component styles'
    ]
  },
  'Progressive Disclosure': {
    checks: [
      'Too much information visible',
      'Missing collapsible sections',
      'No step-by-step flows',
      'Overwhelming initial view'
    ]
  },
  'Error Prevention': {
    checks: [
      'No validation',
      'Missing confirmations',
      'Unclear error messages',
      'No undo capability'
    ]
  },
  'Accessibility': {
    checks: [
      'Missing aria labels',
      'Poor color contrast',
      'No keyboard navigation',
      'Missing focus indicators'
    ]
  }
};

const issues = [];

async function auditFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for common UX issues
  const checks = {
    'Missing hover states': !content.includes('hover:') && content.includes('className'),
    'No loading states': !content.includes('loading') && !content.includes('Loading') && content.includes('useState'),
    'Missing error handling': !content.includes('error') && !content.includes('Error') && content.includes('try'),
    'No accessibility labels': !content.includes('aria-label') && !content.includes('aria-labelledby') && content.includes('<button'),
    'Poor spacing system': content.includes('p-') && !content.match(/p-[0-9]|p-\[/),
    'Inconsistent colors': content.match(/bg-(red|green|blue|yellow|purple|pink)-[0-9]/) && !content.includes('slate'),
    'Missing transitions': !content.includes('transition') && (content.includes('hover:') || content.includes('onClick')),
    'No focus states': !content.includes('focus:') && content.includes('input') || content.includes('button'),
  };

  Object.entries(checks).forEach(([check, hasIssue]) => {
    if (hasIssue) {
      issues.push({
        file: relativePath,
        check,
        severity: check.includes('accessibility') || check.includes('error') ? 'high' : 'medium'
      });
    }
  });
}

async function runAudit() {
  console.log('🔍 Running UX Audit...\n');

  const componentFiles = await glob('website/components/**/*.tsx', {
    cwd: path.join(__dirname, '..'),
    absolute: true
  });

  const pageFiles = await glob('website/app/**/page.tsx', {
    cwd: path.join(__dirname, '..'),
    absolute: true
  });

  for (const file of [...componentFiles, ...pageFiles]) {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    await auditFile(file, relativePath);
  }

  // Group by principle
  console.log('📊 UX Audit Results:\n');
  
  const grouped = issues.reduce((acc, issue) => {
    const principle = Object.keys(principles).find(p => 
      principles[p].checks.some(check => issue.check.includes(check.split(' ')[0]))
    ) || 'Other';
    
    if (!acc[principle]) acc[principle] = [];
    acc[principle].push(issue);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([principle, items]) => {
    console.log(`\n${principle}:`);
    items.forEach(item => {
      console.log(`  ${item.severity === 'high' ? '🔴' : '🟡'} ${item.file}`);
      console.log(`     ${item.check}`);
    });
  });

  console.log(`\n\n📈 Summary:`);
  console.log(`   Total Issues: ${issues.length}`);
  console.log(`   High Priority: ${issues.filter(i => i.severity === 'high').length}`);
  console.log(`   Medium Priority: ${issues.filter(i => i.severity === 'medium').length}`);
}

runAudit().catch(console.error);
