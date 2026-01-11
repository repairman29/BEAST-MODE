#!/usr/bin/env node

/**
 * Generate VS Code Extension Icon
 * Uses BEAST MODE to generate icon design
 */

const fs = require('fs');
const path = require('path');

// Icon design specification
const iconSpec = {
  name: 'BEAST MODE',
  colors: {
    primary: '#00ff00', // Cyan/Green
    secondary: '#007acc', // VS Code blue
    accent: '#ff6b00' // Orange
  },
  elements: [
    'Shield icon (protection)',
    'BEAST MODE text',
    'Modern, professional design',
    '128x128px for marketplace',
    'SVG format preferred'
  ]
};

console.log('🎨 BEAST MODE Extension Icon Generator');
console.log('============================================================');
console.log('');
console.log('📋 Icon Specification:');
console.log(JSON.stringify(iconSpec, null, 2));
console.log('');
console.log('💡 Next Steps:');
console.log('   1. Create icon.svg (128x128px)');
console.log('   2. Convert to PNG: 128x128, 256x256, 512x512');
console.log('   3. Place in extension root as icon.png');
console.log('');
console.log('🎨 Design Elements:');
console.log('   • Shield shape (protection/security)');
console.log('   • BEAST MODE branding');
console.log('   • Modern, professional look');
console.log('   • VS Code blue (#007acc) + Cyan (#00ff00)');
console.log('');
console.log('📁 Icon should be placed at:');
console.log('   beast-mode-extension/icon.png');
console.log('   beast-mode-extension/icon.svg (optional)');
