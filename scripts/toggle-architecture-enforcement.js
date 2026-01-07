#!/usr/bin/env node

/**
 * Toggle Architecture Enforcement Layer
 * Temporarily disable/enable the pre-commit hook
 */

const fs = require('fs').promises;
const path = require('path');

const HOOK_PATH = path.join(__dirname, '../.git/hooks/pre-commit');
const BACKUP_PATH = path.join(__dirname, '../.git/hooks/pre-commit.backup');

async function disable() {
  try {
    // Check if hook exists
    try {
      await fs.access(HOOK_PATH);
    } catch {
      console.log('⚠️  No pre-commit hook found');
      return;
    }

    // Backup original hook
    const originalHook = await fs.readFile(HOOK_PATH, 'utf8');
    await fs.writeFile(BACKUP_PATH, originalHook, 'utf8');
    console.log('✅ Backed up original hook');

    // Disable by setting enabled: false
    const disabledHook = originalHook.replace(
      /enabled: true/g,
      'enabled: false'
    );
    
    await fs.writeFile(HOOK_PATH, disabledHook, 'utf8');
    await fs.chmod(HOOK_PATH, '755');
    console.log('✅ Architecture Enforcement Layer DISABLED');
  } catch (error) {
    console.error('❌ Error disabling:', error.message);
    process.exit(1);
  }
}

async function enable() {
  try {
    // Check if backup exists
    try {
      await fs.access(BACKUP_PATH);
    } catch {
      console.log('⚠️  No backup found, hook may already be enabled');
      return;
    }

    // Restore original hook
    const originalHook = await fs.readFile(BACKUP_PATH, 'utf8');
    await fs.writeFile(HOOK_PATH, originalHook, 'utf8');
    await fs.chmod(HOOK_PATH, '755');
    
    // Remove backup
    await fs.unlink(BACKUP_PATH);
    console.log('✅ Architecture Enforcement Layer ENABLED');
  } catch (error) {
    console.error('❌ Error enabling:', error.message);
    process.exit(1);
  }
}

// Main
const command = process.argv[2];

if (command === 'disable' || command === 'off') {
  disable();
} else if (command === 'enable' || command === 'on') {
  enable();
} else {
  console.log('Usage: node scripts/toggle-architecture-enforcement.js [disable|enable|off|on]');
  process.exit(1);
}

