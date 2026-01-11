#!/usr/bin/env node
/**
 * Build IDE from User Stories using BEAST MODE APIs
 * 
 * Reads user stories and generates code for each one
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BEAST_MODE_API = process.env.BEAST_MODE_API || 'http://localhost:3000';
const IDE_DIR = path.join(__dirname, '..');
const STORIES_FILE = path.join(IDE_DIR, 'docs/user-stories/ALL_STORIES.json');
const PROGRESS_FILE = path.join(IDE_DIR, 'docs/user-stories/BUILD_PROGRESS.json');

/**
 * Call BEAST MODE API
 */
async function callBeastModeAPI(endpoint, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BEAST_MODE_API);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const postData = JSON.stringify(data);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 120000 // 2 minutes for code generation
        };
        
        const req = client.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ raw: body, status: res.statusCode });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.write(postData);
        req.end();
    });
}

/**
 * Load user stories
 */
function loadStories() {
    if (!fs.existsSync(STORIES_FILE)) {
        console.error('❌ Stories file not found. Run: node scripts/generate-all-user-stories.js');
        process.exit(1);
    }
    
    const stories = JSON.parse(fs.readFileSync(STORIES_FILE, 'utf8'));
    return stories;
}

/**
 * Load build progress
 */
function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
    return {
        completed: [],
        inProgress: [],
        failed: [],
        stats: {
            total: 0,
            completed: 0,
            inProgress: 0,
            failed: 0
        }
    };
}

/**
 * Save build progress
 */
function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Generate code for a user story
 */
async function generateCodeForStory(story) {
    const prompt = `Generate code for this user story:

Title: ${story.title}
Category: ${story.category}
Priority: ${story.priority}

As ${story.as}
I want ${story.want}
So that ${story.soThat}

Acceptance Criteria:
${story.criteria.map(c => `- ${c}`).join('\n')}

Generate:
1. Implementation code (JavaScript/TypeScript for Electron IDE)
2. Tests if applicable
3. Documentation

Follow Jony Ive design principles:
- Simplicity
- Clarity
- Beauty
- Focus
- Seamlessness

Use the design system tokens from renderer/styles/design-system.css
Make it beautiful and functional.`;

    try {
        console.log(`  📝 Generating code for: ${story.title}...`);
        
        const result = await callBeastModeAPI('/api/codebase/chat', {
            sessionId: 'ide-build-from-stories',
            message: prompt,
            repo: 'BEAST-MODE-PRODUCT',
            useLLM: true
        });
        
        // Handle different response formats
        if (result) {
            // Try different response formats
            const code = result.code || result.response || result.content || result.text || result.message;
            
            if (code) {
                return {
                    success: true,
                    code: typeof code === 'string' ? code : JSON.stringify(code, null, 2),
                    message: result.message || 'Code generated'
                };
            } else if (result.raw) {
                // Raw response might contain code
                return {
                    success: true,
                    code: result.raw,
                    message: 'Code generated from raw response'
                };
            } else {
                // Log the actual response for debugging
                console.log(`    Debug: Response keys: ${Object.keys(result).join(', ')}`);
                return {
                    success: false,
                    error: 'No code found in response',
                    raw: JSON.stringify(result, null, 2).substring(0, 500)
                };
            }
        } else {
            return {
                success: false,
                error: 'Empty response',
                raw: 'No response from API'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Save generated code
 */
function saveGeneratedCode(story, codeResult) {
    if (!codeResult.success || !codeResult.code) {
        return false;
    }
    
    // Determine file path based on category
    let filePath;
    const category = story.category.toLowerCase();
    
    if (category.includes('file management')) {
        filePath = path.join(IDE_DIR, 'renderer/features/file-management', `${story.id}.js`);
    } else if (category.includes('code editing')) {
        filePath = path.join(IDE_DIR, 'renderer/features/code-editing', `${story.id}.js`);
    } else if (category.includes('navigation')) {
        filePath = path.join(IDE_DIR, 'renderer/features/navigation', `${story.id}.js`);
    } else if (category.includes('ai')) {
        filePath = path.join(IDE_DIR, 'renderer/features/ai', `${story.id}.js`);
    } else if (category.includes('quality')) {
        filePath = path.join(IDE_DIR, 'renderer/features/quality', `${story.id}.js`);
    } else if (category.includes('collaboration')) {
        filePath = path.join(IDE_DIR, 'renderer/features/collaboration', `${story.id}.js`);
    } else if (category.includes('performance')) {
        filePath = path.join(IDE_DIR, 'renderer/features/performance', `${story.id}.js`);
    } else {
        filePath = path.join(IDE_DIR, 'renderer/features/general', `${story.id}.js`);
    }
    
    // Create directory if needed
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save code with metadata
    const codeWithMetadata = `/**
 * Generated from User Story: ${story.id}
 * Title: ${story.title}
 * Category: ${story.category}
 * Priority: ${story.priority}
 * 
 * As ${story.as}
 * I want ${story.want}
 * So that ${story.soThat}
 * 
 * Generated by BEAST MODE API
 */

${codeResult.code}`;
    
    fs.writeFileSync(filePath, codeWithMetadata, 'utf8');
    
    // Also save story metadata
    const metadataPath = filePath.replace('.js', '.meta.json');
    fs.writeFileSync(metadataPath, JSON.stringify(story, null, 2), 'utf8');
    
    return true;
}

/**
 * Process stories by priority
 */
async function processStories(stories, priority, limit = 10) {
    const filtered = stories
        .filter(s => s.priority === priority && !s.processed)
        .slice(0, limit);
    
    console.log(`\n🎯 Processing ${filtered.length} ${priority} stories...\n`);
    
    const progress = loadProgress();
    let successCount = 0;
    let failCount = 0;
    
    for (const story of filtered) {
        try {
            const codeResult = await generateCodeForStory(story);
            
            if (codeResult.success) {
                const saved = saveGeneratedCode(story, codeResult);
                if (saved) {
                    story.processed = true;
                    story.generated = true;
                    story.filePath = codeResult.filePath;
                    progress.completed.push(story.id);
                    successCount++;
                    console.log(`  ✅ Generated: ${story.title}`);
                } else {
                    story.processed = true;
                    story.generated = false;
                    progress.failed.push({ id: story.id, reason: 'Save failed' });
                    failCount++;
                    console.log(`  ⚠️  Generated but failed to save: ${story.title}`);
                }
            } else {
                story.processed = true;
                story.generated = false;
                progress.failed.push({ id: story.id, reason: codeResult.error });
                failCount++;
                console.log(`  ❌ Failed: ${story.title} - ${codeResult.error}`);
            }
            
            // Save progress after each story
            progress.stats = {
                total: stories.length,
                completed: progress.completed.length,
                inProgress: progress.inProgress.length,
                failed: progress.failed.length
            };
            saveProgress(progress);
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`  ❌ Error processing ${story.id}:`, error.message);
            failCount++;
        }
    }
    
    console.log(`\n📊 ${priority} Stories: ${successCount} succeeded, ${failCount} failed\n`);
    
    return { successCount, failCount };
}

/**
 * Main function
 */
async function main() {
    console.log('🛡️ BEAST MODE - Building IDE from User Stories\n');
    console.log('='.repeat(60));
    console.log('');
    
    // Check if BEAST MODE is running
    try {
        await callBeastModeAPI('/api/health', {});
        console.log('✅ BEAST MODE API is available\n');
    } catch (error) {
        console.error('❌ BEAST MODE API is not available!');
        console.error('   Start BEAST MODE: cd BEAST-MODE-PRODUCT/website && npm run dev\n');
        process.exit(1);
    }
    
    // Load stories
    console.log('📚 Loading user stories...');
    const stories = loadStories();
    console.log(`   Found ${stories.length} stories\n`);
    
    // Load progress
    const progress = loadProgress();
    console.log('📊 Current Progress:');
    console.log(`   Completed: ${progress.completed.length}`);
    console.log(`   Failed: ${progress.failed.length}`);
    console.log(`   Remaining: ${stories.length - progress.completed.length - progress.failed.length}\n`);
    
    // Mark already processed stories
    stories.forEach(story => {
        if (progress.completed.includes(story.id)) {
            story.processed = true;
            story.generated = true;
        } else if (progress.failed.some(f => f.id === story.id)) {
            story.processed = true;
            story.generated = false;
        }
    });
    
    // Process by priority
    const args = process.argv.slice(2);
    const priority = args[0] || 'P0';
    const limit = parseInt(args[1]) || 10;
    
    console.log(`🎯 Processing ${priority} stories (limit: ${limit})...\n`);
    
    const results = await processStories(stories, priority, limit);
    
    // Final summary
    const finalProgress = loadProgress();
    console.log('='.repeat(60));
    console.log('📊 Final Progress\n');
    console.log(`Total Stories: ${stories.length}`);
    console.log(`Completed: ${finalProgress.completed.length}`);
    console.log(`Failed: ${finalProgress.failed.length}`);
    console.log(`Remaining: ${stories.length - finalProgress.completed.length - finalProgress.failed.length}`);
    console.log('');
    console.log(`✅ This run: ${results.successCount} succeeded, ${results.failCount} failed`);
    console.log('');
    console.log('📁 Generated code saved to: renderer/features/');
    console.log('');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { processStories, generateCodeForStory, loadStories };
