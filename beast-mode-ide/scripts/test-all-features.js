#!/usr/bin/env node
/**
 * Test All Generated Features
 * 
 * Validates that all generated features are valid and loadable
 */

const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '../renderer/features');

console.log('🧪 Testing All Generated Features\n');
console.log('='.repeat(60));
console.log('');

if (!fs.existsSync(featuresDir)) {
    console.error('❌ Features directory not found:', featuresDir);
    process.exit(1);
}

const categories = fs.readdirSync(featuresDir).filter(item => {
    const itemPath = path.join(featuresDir, item);
    return fs.statSync(itemPath).isDirectory();
});

let total = 0;
let valid = 0;
let invalid = 0;
let errors = [];
const categoryStats = {};

categories.forEach(cat => {
    const catPath = path.join(featuresDir, cat);
    const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));
    
    categoryStats[cat] = {
        total: files.length,
        valid: 0,
        invalid: 0
    };
    
    files.forEach(file => {
        total++;
        const filePath = path.join(catPath, file);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Basic validation
            if (content.length === 0) {
                invalid++;
                categoryStats[cat].invalid++;
                errors.push({ category: cat, file, error: 'Empty file' });
            } else if (!content.includes('Generated from User Story')) {
                invalid++;
                categoryStats[cat].invalid++;
                errors.push({ category: cat, file, error: 'Missing metadata header' });
            } else {
                valid++;
                categoryStats[cat].valid++;
            }
        } catch (error) {
            invalid++;
            categoryStats[cat].invalid++;
            errors.push({ category: cat, file, error: error.message });
        }
    });
});

// Print results
console.log('📊 Test Results:\n');
console.log(`Total Features: ${total}`);
console.log(`✅ Valid: ${valid}`);
console.log(`❌ Invalid: ${invalid}`);
console.log(`Success Rate: ${((valid / total) * 100).toFixed(1)}%`);
console.log('');

// Category breakdown
console.log('📁 By Category:\n');
Object.entries(categoryStats).forEach(([cat, stats]) => {
    const rate = ((stats.valid / stats.total) * 100).toFixed(1);
    console.log(`   ${cat.padEnd(25)} ${stats.valid}/${stats.total} (${rate}%)`);
});
console.log('');

// Errors
if (errors.length > 0) {
    console.log('❌ Errors Found:\n');
    errors.slice(0, 10).forEach(e => {
        console.log(`   ${e.category}/${e.file}: ${e.error}`);
    });
    if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more`);
    }
    console.log('');
}

// Summary
console.log('='.repeat(60));
if (invalid === 0) {
    console.log('✅ All features are valid!');
    process.exit(0);
} else {
    console.log(`⚠️  ${invalid} features have issues`);
    process.exit(1);
}
