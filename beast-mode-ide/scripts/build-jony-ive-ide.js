#!/usr/bin/env node
/**
 * Build Jony Ive IDE with BEAST MODE
 * 
 * Uses BEAST MODE APIs to generate the beautiful IDE
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BEAST_MODE_API = process.env.BEAST_MODE_API || 'http://localhost:3000';
const IDE_DIR = path.join(__dirname, '..');

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
            timeout: 60000
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
 * Generate Design System
 */
async function generateDesignSystem() {
    console.log('🎨 Step 1: Generating Design System...\n');
    
    try {
        const result = await callBeastModeAPI('/api/codebase/chat', {
            sessionId: 'jony-ive-ide-build',
            message: `Create a complete design system for a Jony Ive-inspired IDE. Include:
- Color palette (iOS-inspired: #007AFF primary, #F5F5F7 background, #FFFFFF surface)
- Typography system (SF Pro Display, SF Mono for code)
- Spacing system (4px base unit)
- Shadow system (subtle, elegant)
- Border radius system
- Animation timing (smooth, 0.2s-0.3s)
- Component styles (buttons, inputs, cards, panels)

Generate CSS variables and a design tokens file.`,
            repo: 'BEAST-MODE-PRODUCT',
            useLLM: true
        });
        
        if (result && result.code) {
            const designSystemPath = path.join(IDE_DIR, 'renderer/styles/design-system.css');
            const dir = path.dirname(designSystemPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(designSystemPath, result.code, 'utf8');
            console.log('  ✅ Design system generated:', designSystemPath);
            return true;
        }
    } catch (error) {
        console.warn('  ⚠️  Could not generate design system:', error.message);
    }
    return false;
}

/**
 * Generate Component Library
 */
async function generateComponents() {
    console.log('🧩 Step 2: Generating Component Library...\n');
    
    const components = [
        {
            name: 'Button',
            description: 'Beautiful button component with Jony Ive design - primary blue, smooth animations, perfect spacing'
        },
        {
            name: 'Input',
            description: 'Elegant input component with focus states, smooth transitions, beautiful typography'
        },
        {
            name: 'Card',
            description: 'Clean card component with subtle shadows, perfect spacing, elegant borders'
        },
        {
            name: 'Panel',
            description: 'Contextual panel that slides in smoothly, beautiful backdrop, perfect animations'
        }
    ];
    
    let generated = 0;
    for (const component of components) {
        console.log(`  Generating: ${component.name}...`);
        try {
            const result = await callBeastModeAPI('/api/codebase/chat', {
                sessionId: 'jony-ive-ide-build',
                message: `Generate a ${component.name} component with Jony Ive design principles. ${component.description}. Use the design system tokens. Make it beautiful, simple, and perfect.`,
                repo: 'BEAST-MODE-PRODUCT',
                useLLM: true
            });
            
            if (result && result.code) {
                const componentPath = path.join(IDE_DIR, `renderer/components/${component.name}.js`);
                const dir = path.dirname(componentPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(componentPath, result.code, 'utf8');
                console.log(`  ✅ Generated: ${component.name}`);
                generated++;
            }
        } catch (error) {
            console.warn(`  ⚠️  Could not generate ${component.name}:`, error.message);
        }
    }
    
    return generated;
}

/**
 * Generate Minimal UI
 */
async function generateMinimalUI() {
    console.log('🖼️  Step 3: Generating Minimal UI...\n');
    
    try {
        const result = await callBeastModeAPI('/api/codebase/chat', {
            sessionId: 'jony-ive-ide-build',
            message: `Generate a minimal IDE UI with Jony Ive design:
- Auto-hiding title bar (fades after 3 seconds)
- Clean editor view (full focus, no clutter)
- Subtle status bar (minimal information)
- Contextual panel system (slides in from right when needed)
- Focus mode (distraction-free, full-screen editor)
- Beautiful animations (smooth, 0.3s ease-out)

Use the design system and components. Make it the most beautiful IDE UI ever.`,
            repo: 'BEAST-MODE-PRODUCT',
            useLLM: true
        });
        
        if (result && result.code) {
            const uiPath = path.join(IDE_DIR, 'renderer/ui/MinimalUI.js');
            const dir = path.dirname(uiPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(uiPath, result.code, 'utf8');
            console.log('  ✅ Minimal UI generated:', uiPath);
            return true;
        }
    } catch (error) {
        console.warn('  ⚠️  Could not generate minimal UI:', error.message);
    }
    return false;
}

/**
 * Generate AI Panel
 */
async function generateAIPanel() {
    console.log('🧠 Step 4: Generating AI Panel...\n');
    
    try {
        const result = await callBeastModeAPI('/api/codebase/chat', {
            sessionId: 'jony-ive-ide-build',
            message: `Generate a beautiful AI chat panel with Jony Ive design:
- Slides in from right smoothly (0.3s ease-out)
- Beautiful chat interface (clean, minimal)
- Inline code suggestions (elegant cards)
- One-tap accept (smooth animations)
- Auto-hides when not needed
- Perfect typography and spacing

Make it feel premium and beautiful.`,
            repo: 'BEAST-MODE-PRODUCT',
            useLLM: true
        });
        
        if (result && result.code) {
            const panelPath = path.join(IDE_DIR, 'renderer/panels/AIPanel.js');
            const dir = path.dirname(panelPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(panelPath, result.code, 'utf8');
            console.log('  ✅ AI Panel generated:', panelPath);
            return true;
        }
    } catch (error) {
        console.warn('  ⚠️  Could not generate AI panel:', error.message);
    }
    return false;
}

/**
 * Main build function
 */
async function main() {
    console.log('🛡️ BEAST MODE - Building Jony Ive IDE\n');
    console.log('='.repeat(60));
    console.log('');
    console.log('Using BEAST MODE to build the most beautiful IDE ever!\n');
    
    const results = {
        designSystem: false,
        components: 0,
        minimalUI: false,
        aiPanel: false
    };
    
    // Step 1: Design System
    results.designSystem = await generateDesignSystem();
    console.log('');
    
    // Step 2: Components
    results.components = await generateComponents();
    console.log('');
    
    // Step 3: Minimal UI
    results.minimalUI = await generateMinimalUI();
    console.log('');
    
    // Step 4: AI Panel
    results.aiPanel = await generateAIPanel();
    console.log('');
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 Build Summary\n');
    console.log(`Design System: ${results.designSystem ? '✅' : '❌'}`);
    console.log(`Components: ${results.components}/4`);
    console.log(`Minimal UI: ${results.minimalUI ? '✅' : '❌'}`);
    console.log(`AI Panel: ${results.aiPanel ? '✅' : '❌'}`);
    console.log('');
    
    if (results.designSystem && results.components > 0) {
        console.log('✅ Foundation built! Ready for integration.');
    } else {
        console.log('⚠️  Some components may need manual creation.');
        console.log('   Start BEAST MODE: cd BEAST-MODE-PRODUCT/website && npm run dev');
    }
    console.log('');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateDesignSystem, generateComponents, generateMinimalUI, generateAIPanel };
