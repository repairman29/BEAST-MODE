#!/usr/bin/env node

/**
 * Auto-Generate Release Notes
 * Generates release notes from git commits
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitCommits(sinceTag) {
  try {
    const command = sinceTag 
      ? `git log ${sinceTag}..HEAD --pretty=format:"%h|%s|%an" --no-merges`
      : `git log --pretty=format:"%h|%s|%an" --no-merges -20`;
    
    const output = execSync(command, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean).map(line => {
      const [hash, subject, author] = line.split('|');
      return { hash, subject, author };
    });
  } catch (error) {
    return [];
  }
}

function categorizeCommits(commits) {
  const categories = {
    features: [],
    fixes: [],
    docs: [],
    refactor: [],
    test: [],
    chore: []
  };

  commits.forEach(commit => {
    const subject = commit.subject.toLowerCase();
    if (subject.startsWith('feat:') || subject.startsWith('add:')) {
      categories.features.push(commit);
    } else if (subject.startsWith('fix:') || subject.startsWith('bug:')) {
      categories.fixes.push(commit);
    } else if (subject.startsWith('docs:') || subject.startsWith('doc:')) {
      categories.docs.push(commit);
    } else if (subject.startsWith('refactor:')) {
      categories.refactor.push(commit);
    } else if (subject.startsWith('test:') || subject.includes('test')) {
      categories.test.push(commit);
    } else {
      categories.chore.push(commit);
    }
  });

  return categories;
}

function generateReleaseNotes(version, sinceTag = null) {
  console.log(`📝 Generating Release Notes for v${version}`);
  console.log('============================================================\n');

  const commits = getGitCommits(sinceTag);
  const categories = categorizeCommits(commits);

  let notes = `# Release Notes v${version}\n\n`;
  notes += `**Release Date:** ${new Date().toLocaleDateString()}\n\n`;
  notes += `---\n\n`;

  if (categories.features.length > 0) {
    notes += `## ✨ New Features\n\n`;
    categories.features.forEach(commit => {
      notes += `- ${commit.subject.replace(/^(feat|add):\s*/i, '')} (${commit.hash})\n`;
    });
    notes += '\n';
  }

  if (categories.fixes.length > 0) {
    notes += `## 🐛 Bug Fixes\n\n`;
    categories.fixes.forEach(commit => {
      notes += `- ${commit.subject.replace(/^(fix|bug):\s*/i, '')} (${commit.hash})\n`;
    });
    notes += '\n';
  }

  if (categories.refactor.length > 0) {
    notes += `## 🔧 Refactoring\n\n`;
    categories.refactor.forEach(commit => {
      notes += `- ${commit.subject.replace(/^refactor:\s*/i, '')} (${commit.hash})\n`;
    });
    notes += '\n';
  }

  if (categories.docs.length > 0) {
    notes += `## 📚 Documentation\n\n`;
    categories.docs.forEach(commit => {
      notes += `- ${commit.subject.replace(/^docs?:\s*/i, '')} (${commit.hash})\n`;
    });
    notes += '\n';
  }

  notes += `---\n\n`;
  notes += `**Total Changes:** ${commits.length} commits\n`;

  // Save to file
  const notesPath = path.join(__dirname, '../..', `RELEASE_NOTES_v${version}.md`);
  fs.writeFileSync(notesPath, notes);
  
  console.log('✅ Release notes generated!');
  console.log(`📄 Saved to: ${notesPath}\n`);
  console.log(notes);

  return notes;
}

// CLI
const version = process.argv[2];
const sinceTag = process.argv[3];

if (!version) {
  console.log('Usage: node scripts/automate/generate-release-notes.js <version> [since-tag]');
  console.log('\nExample:');
  console.log('  node scripts/automate/generate-release-notes.js 1.0.0');
  console.log('  node scripts/automate/generate-release-notes.js 1.0.0 v0.9.0');
  process.exit(1);
}

generateReleaseNotes(version, sinceTag);
