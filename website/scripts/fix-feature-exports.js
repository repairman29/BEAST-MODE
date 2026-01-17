#!/usr/bin/env node

/**
 * Fix Feature File Exports
 * 
 * Fixes feature files that export "add" function instead of default component
 */

const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '../components/ide/features');

// Template for a proper feature component
const componentTemplate = (id) => `'use client';

/**
 * ${id} Feature Component
 * 
 * Generated from user story: ${id}
 * Category: Core Coding - File Management
 */

import { useState } from 'react';

interface ${id.replace(/-/g, '_')}Props {
  // Add props as needed
}

export default function ${id.replace(/-/g, '_')}(props: ${id.replace(/-/g, '_')}Props) {
  const [error, setError] = useState<string | null>(null);

  try {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          ${id}
        </h3>
        <p className="text-sm text-slate-300 mb-4">
          Feature component placeholder
        </p>
        
        {error && (
          <div className="mt-4 p-2 bg-red-900/50 border border-red-700 rounded text-sm text-red-300">
            Error: {error}
          </div>
        )}
      </div>
    );
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded">
        <p className="text-red-300">Error: {error}</p>
      </div>
    );
  }
}
`;

// Find all files with "export function add"
const files = fs.readdirSync(featuresDir)
  .filter(file => file.endsWith('.tsx'))
  .filter(file => {
    const content = fs.readFileSync(path.join(featuresDir, file), 'utf8');
    return content.includes('export function add');
  });

console.log(`Found ${files.length} files to fix:`);
files.forEach(file => console.log(`  - ${file}`));

// Fix each file
let fixed = 0;
files.forEach(file => {
  const filePath = path.join(featuresDir, file);
  const id = file.replace('.tsx', '').replace(/_/g, '-');
  const newContent = componentTemplate(id);
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  fixed++;
  console.log(`✅ Fixed ${file}`);
});

console.log(`\n✅ Fixed ${fixed} files!`);
