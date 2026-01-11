#!/usr/bin/env node
/**
 * Generate All 1000+ User Stories
 * 
 * Expands core stories into comprehensive coverage
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../docs/user-stories');
const STORIES = [];

/**
 * Story template
 */
function createStory(id, title, category, priority, userType, platform, as, want, soThat, criteria = []) {
    return {
        id,
        title,
        category,
        priority,
        userType,
        platform,
        as,
        want,
        soThat,
        criteria,
        effort: priority === 'P0' ? 'Small' : priority === 'P1' ? 'Medium' : 'Large'
    };
}

/**
 * Generate Core Coding Stories (200 → 600)
 */
function generateCoreCodingStories() {
    const stories = [];
    let id = 1;
    
    // File Management (30 → 100)
    const fileActions = ['create', 'open', 'save', 'delete', 'rename', 'duplicate', 'move', 'copy', 'search', 'filter', 'watch', 'ignore', 'compare', 'merge'];
    const fileContexts = ['keyboard', 'mouse', 'command-palette', 'context-menu', 'drag-drop', 'terminal', 'git'];
    
    fileActions.forEach(action => {
        fileContexts.forEach(context => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${action.charAt(0).toUpperCase() + action.slice(1)} File (${context})`,
                'Core Coding - File Management',
                id <= 50 ? 'P0' : id <= 80 ? 'P1' : 'P2',
                'All',
                'All',
                'a developer',
                `to ${action} files using ${context}`,
                `so that I can manage files efficiently`,
                [
                    `File ${action} works with ${context}`,
                    `Error handling for invalid operations`,
                    `Feedback provided for all actions`
                ]
            ));
            id++;
        });
    });
    
    // Code Editing (50 → 150)
    const editingFeatures = [
        'syntax-highlighting', 'auto-indent', 'bracket-matching', 'code-folding',
        'multiple-cursors', 'find-replace', 'go-to-definition', 'go-to-references',
        'code-formatting', 'line-numbers', 'word-wrap', 'minimap', 'code-lens',
        'inline-errors', 'hover-info', 'quick-fix', 'refactor', 'rename-symbol',
        'code-actions', 'peek-definition', 'peek-references', 'symbol-highlight',
        'selection-highlight', 'indent-guides', 'whitespace', 'render-control-chars'
    ];
    
    editingFeatures.forEach(feature => {
        ['basic', 'advanced', 'expert'].forEach(level => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${feature.replace(/-/g, ' ')} (${level})`,
                'Core Coding - Code Editing',
                level === 'basic' ? 'P0' : level === 'advanced' ? 'P1' : 'P2',
                level === 'basic' ? 'Beginner' : level === 'advanced' ? 'Intermediate' : 'Expert',
                'All',
                'a developer',
                `to use ${feature} at ${level} level`,
                `so that I can edit code efficiently`,
                [
                    `${feature} works correctly`,
                    `${feature} is performant`,
                    `${feature} is accessible`
                ]
            ));
            id++;
        });
    });
    
    // Navigation (30 → 100)
    const navTypes = ['file', 'symbol', 'definition', 'reference', 'outline', 'breadcrumb', 'minimap'];
    const navMethods = ['keyboard', 'mouse', 'search', 'command'];
    
    navTypes.forEach(type => {
        navMethods.forEach(method => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Navigate ${type} (${method})`,
                'Core Coding - Navigation',
                id <= 200 ? 'P0' : id <= 250 ? 'P1' : 'P2',
                'All',
                'All',
                'a developer',
                `to navigate ${type} using ${method}`,
                `so that I can find code quickly`,
                [
                    `Navigation works with ${method}`,
                    `Navigation is fast`,
                    `Navigation is intuitive`
                ]
            ));
            id++;
        });
    });
    
    // Code Completion (30 → 100)
    const completionTypes = ['intellisense', 'snippets', 'imports', 'parameters', 'quick-fix', 'auto-import', 'type-hints', 'documentation'];
    const languages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'cpp', 'ruby', 'php', 'swift', 'kotlin', 'dart'];
    
    completionTypes.forEach(type => {
        languages.forEach(lang => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${type} for ${lang}`,
                'Core Coding - Code Completion',
                lang === 'typescript' || lang === 'javascript' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to use ${type} when coding in ${lang}`,
                `so that I can write ${lang} code faster`,
                [
                    `${type} works for ${lang}`,
                    `${type} is accurate`,
                    `${type} is fast`
                ]
            ));
            id++;
        });
    });
    
    // Git Integration (30 → 100)
    const gitActions = ['status', 'diff', 'commit', 'branch', 'merge', 'blame', 'log', 'stash', 'revert', 'push', 'pull', 'fetch', 'rebase', 'cherry-pick', 'tag', 'reset'];
    
    gitActions.forEach(action => {
        ['basic', 'advanced'].forEach(level => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Git ${action} (${level})`,
                'Core Coding - Git Integration',
                level === 'basic' ? 'P0' : 'P1',
                level === 'basic' ? 'Beginner' : 'Intermediate',
                'All',
                'a developer',
                `to perform git ${action} operations`,
                `so that I can manage version control`,
                [
                    `Git ${action} works correctly`,
                    `Git ${action} shows clear feedback`,
                    `Git ${action} handles errors gracefully`
                ]
            ));
            id++;
        });
    });
    
    // Terminal (30 → 100)
    const terminalFeatures = ['integrated', 'multiple-tabs', 'split', 'history', 'themes', 'custom-shells', 'profiles', 'tasks', 'integrated-output', 'debug-console'];
    
    terminalFeatures.forEach(feature => {
        ['Mac', 'Windows', 'Linux'].forEach(platform => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Terminal ${feature} (${platform})`,
                'Core Coding - Terminal',
                feature === 'integrated' ? 'P0' : 'P1',
                'All',
                platform,
                'a developer',
                `to use terminal ${feature} on ${platform}`,
                `so that I can run commands efficiently`,
                [
                    `Terminal ${feature} works on ${platform}`,
                    `Terminal ${feature} is performant`,
                    `Terminal ${feature} is accessible`
                ]
            ));
            id++;
        });
    });
    
    return stories;
}

/**
 * Generate AI Assistance Stories (200 → 600)
 */
function generateAIStories() {
    const stories = [];
    let id = 201;
    
    // Code Generation (50 → 200)
    const generationTypes = ['function', 'class', 'test', 'documentation', 'api-route', 'component', 'hook', 'service', 'interface', 'type', 'enum', 'constant', 'utility', 'middleware'];
    const contexts = ['from-comment', 'from-description', 'from-example', 'from-spec', 'from-test', 'from-usage'];
    
    generationTypes.forEach(type => {
        contexts.forEach(context => {
            ['typescript', 'javascript', 'python', 'java', 'go'].forEach(lang => {
                stories.push(createStory(
                    `US-${String(id).padStart(4, '0')}`,
                    `Generate ${type} (${context}, ${lang})`,
                    'AI Assistance - Code Generation',
                    type === 'function' || type === 'class' ? 'P0' : 'P1',
                    'All',
                    'All',
                    'a developer',
                    `to generate ${type} ${context} in ${lang}`,
                    `so that I can code faster`,
                    [
                        `Generated ${type} is correct`,
                        `Generated ${type} follows best practices`,
                        `Generated ${type} is well-documented`
                    ]
                ));
                id++;
            });
        });
    });
    
    // Code Suggestions (50 → 150)
    const suggestionTypes = ['inline', 'context-aware', 'multi-line', 'refactoring', 'bug-fix'];
    const suggestionContexts = ['typing', 'selection', 'hover', 'command'];
    
    suggestionTypes.forEach(type => {
        suggestionContexts.forEach(context => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${type} suggestion (${context})`,
                'AI Assistance - Code Suggestions',
                type === 'inline' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to get ${type} suggestions when ${context}`,
                `so that I can write better code`,
                [
                    `Suggestions are relevant`,
                    `Suggestions are fast (< 2s)`,
                    `Suggestions are accurate`
                ]
            ));
            id++;
        });
    });
    
    // Code Explanation (30 → 100)
    const explanationTypes = ['code-block', 'error', 'algorithm', 'architecture', 'performance'];
    
    explanationTypes.forEach(type => {
        ['simple', 'detailed', 'with-examples'].forEach(detail => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Explain ${type} (${detail})`,
                'AI Assistance - Code Explanation',
                type === 'error' ? 'P0' : 'P1',
                detail === 'simple' ? 'Beginner' : 'All',
                'All',
                'a developer',
                `to get ${detail} explanation of ${type}`,
                `so that I understand the code`,
                [
                    `Explanation is clear`,
                    `Explanation is accurate`,
                    `Explanation is helpful`
                ]
            ));
            id++;
        });
    });
    
    // Code Chat (30 → 100)
    const chatContexts = ['codebase', 'file', 'function', 'error', 'architecture'];
    
    chatContexts.forEach(context => {
        ['question', 'suggestion', 'review', 'optimization'].forEach(interaction => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Chat about ${context} (${interaction})`,
                'AI Assistance - Code Chat',
                context === 'error' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to ${interaction} about ${context}`,
                `so that I can get help quickly`,
                [
                    `Chat response is relevant`,
                    `Chat response is fast`,
                    `Chat response is actionable`
                ]
            ));
            id++;
        });
    });
    
    // Code Transformation (40 → 150)
    const transformations = ['convert-language', 'modernize', 'optimize', 'add-error-handling', 'add-type-safety', 'refactor'];
    const fromLanguages = ['javascript', 'python', 'java'];
    const toLanguages = ['typescript', 'python', 'javascript'];
    
    transformations.forEach(transform => {
        if (transform === 'convert-language') {
            fromLanguages.forEach(from => {
                toLanguages.forEach(to => {
                    if (from !== to) {
                        stories.push(createStory(
                            `US-${String(id).padStart(4, '0')}`,
                            `Convert ${from} to ${to}`,
                            'AI Assistance - Code Transformation',
                            'P1',
                            'All',
                            'All',
                            'a developer',
                            `to convert code from ${from} to ${to}`,
                            `so that I can port code easily`,
                            [
                                `Conversion is accurate`,
                                `Conversion preserves functionality`,
                                `Conversion follows ${to} best practices`
                            ]
                        ));
                        id++;
                    }
                });
            });
        } else {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                transform.replace(/-/g, ' '),
                'AI Assistance - Code Transformation',
                'P1',
                'All',
                'All',
                'a developer',
                `to ${transform.replace(/-/g, ' ')} code`,
                `so that code quality improves`,
                [
                    `Transformation is correct`,
                    `Transformation improves code`,
                    `Transformation is safe`
                ]
            ));
            id++;
        }
    });
    
    return stories;
}

/**
 * Generate Quality Assurance Stories (200 → 400)
 */
function generateQualityStories() {
    const stories = [];
    let id = 401;
    
    // Code Quality (50 → 100)
    const qualityMetrics = ['score', 'indicators', 'trends', 'goals', 'reports'];
    
    qualityMetrics.forEach(metric => {
        ['file', 'function', 'class', 'project'].forEach(scope => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Quality ${metric} (${scope})`,
                'Quality Assurance - Code Quality',
                metric === 'score' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to see quality ${metric} for ${scope}`,
                `so that I can track code quality`,
                [
                    `${metric} is accurate`,
                    `${metric} is visible`,
                    `${metric} is actionable`
                ]
            ));
            id++;
        });
    });
    
    // Linting (30 → 80)
    const lintFeatures = ['real-time', 'rules', 'auto-fix', 'warnings', 'custom-rules'];
    
    lintFeatures.forEach(feature => {
        ['typescript', 'javascript', 'python', 'all'].forEach(lang => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Linting ${feature} (${lang})`,
                'Quality Assurance - Linting',
                feature === 'real-time' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to use linting ${feature} for ${lang}`,
                `so that code follows standards`,
                [
                    `Linting ${feature} works for ${lang}`,
                    `Linting ${feature} is fast`,
                    `Linting ${feature} is accurate`
                ]
            ));
            id++;
        });
    });
    
    // Testing (40 → 100)
    const testFeatures = ['run', 'coverage', 'results', 'debug', 'generate'];
    
    testFeatures.forEach(feature => {
        ['unit', 'integration', 'e2e'].forEach(testType => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${testType} test ${feature}`,
                'Quality Assurance - Testing',
                feature === 'run' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to ${feature} ${testType} tests`,
                `so that I can ensure code quality`,
                [
                    `${testType} test ${feature} works`,
                    `${testType} test ${feature} is fast`,
                    `${testType} test ${feature} is reliable`
                ]
            ));
            id++;
        });
    });
    
    // Security (40 → 80)
    const securityFeatures = ['secret-detection', 'vulnerability-scanning', 'dependency-security', 'best-practices', 'reports'];
    
    securityFeatures.forEach(feature => {
        ['file', 'project', 'dependencies'].forEach(scope => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Security ${feature} (${scope})`,
                'Quality Assurance - Security',
                feature === 'secret-detection' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to check security ${feature} for ${scope}`,
                `so that code is secure`,
                [
                    `Security ${feature} works for ${scope}`,
                    `Security ${feature} is accurate`,
                    `Security ${feature} provides clear feedback`
                ]
            ));
            id++;
        });
    });
    
    // Performance (40 → 100)
    const perfFeatures = ['analysis', 'metrics', 'warnings', 'profiling', 'optimization'];
    
    perfFeatures.forEach(feature => {
        ['function', 'file', 'project'].forEach(scope => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Performance ${feature} (${scope})`,
                'Quality Assurance - Performance',
                feature === 'warnings' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to analyze performance ${feature} for ${scope}`,
                `so that code is efficient`,
                [
                    `Performance ${feature} works for ${scope}`,
                    `Performance ${feature} is accurate`,
                    `Performance ${feature} is actionable`
                ]
            ));
            id++;
        });
    });
    
    return stories;
}

/**
 * Generate Performance Stories (100 → 200)
 */
function generatePerformanceStories() {
    const stories = [];
    let id = 501;
    
    // IDE Performance (50 → 100)
    const perfFeatures = ['startup', 'scrolling', 'large-files', 'memory', 'cpu', 'search', 'autocomplete', 'build'];
    
    perfFeatures.forEach(feature => {
        ['fast', 'efficient', 'optimized'].forEach(level => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${feature} ${level}`,
                'Performance - IDE Performance',
                level === 'fast' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to have ${level} ${feature}`,
                `so that the IDE is responsive`,
                [
                    `${feature} is ${level}`,
                    `${feature} doesn't block`,
                    `${feature} scales well`
                ]
            ));
            id++;
        });
    });
    
    // Code Performance (50 → 100)
    const codePerfFeatures = ['analysis', 'ai-response', 'linting', 'testing', 'formatting'];
    
    codePerfFeatures.forEach(feature => {
        ['< 1s', '< 2s', '< 5s'].forEach(target => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${feature} ${target}`,
                'Performance - Code Performance',
                target === '< 1s' ? 'P0' : target === '< 2s' ? 'P1' : 'P2',
                'All',
                'All',
                'a developer',
                `to have ${feature} complete in ${target}`,
                `so that I don't wait`,
                [
                    `${feature} completes in ${target}`,
                    `${feature} is accurate`,
                    `${feature} doesn't block`
                ]
            ));
            id++;
        });
    });
    
    return stories;
}

/**
 * Generate Collaboration Stories (100 → 200)
 */
function generateCollaborationStories() {
    const stories = [];
    let id = 601;
    
    // Real-Time Collaboration (40 → 100)
    const collabFeatures = ['share-session', 'live-cursors', 'live-editing', 'voice-chat', 'screen-share'];
    
    collabFeatures.forEach(feature => {
        ['2-users', '5-users', '10-users'].forEach(scale => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${feature} (${scale})`,
                'Collaboration - Real-Time',
                scale === '2-users' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to ${feature.replace(/-/g, ' ')} with ${scale}`,
                `so that we can collaborate`,
                [
                    `${feature} works with ${scale}`,
                    `${feature} is smooth`,
                    `${feature} is reliable`
                ]
            ));
            id++;
        });
    });
    
    // Code Review (30 → 50)
    const reviewFeatures = ['inline-comments', 'review-requests', 'approval', 'history', 'notifications'];
    
    reviewFeatures.forEach(feature => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            feature.replace(/-/g, ' '),
            'Collaboration - Code Review',
            feature === 'inline-comments' ? 'P0' : 'P1',
            'All',
            'All',
            'a developer',
            `to use ${feature.replace(/-/g, ' ')}`,
            `so that code reviews are efficient`,
            [
                `${feature} works correctly`,
                `${feature} is intuitive`,
                `${feature} provides feedback`
            ]
        ));
        id++;
    });
    
    // Team Features (30 → 50)
    const teamFeatures = ['dashboard', 'metrics', 'chat', 'presence', 'workspace'];
    
    teamFeatures.forEach(feature => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            `Team ${feature}`,
            'Collaboration - Team Features',
            feature === 'presence' ? 'P0' : 'P1',
            'All',
            'All',
            'a developer',
            `to use team ${feature}`,
            `so that team collaboration is easy`,
            [
                `Team ${feature} works`,
                `Team ${feature} is useful`,
                `Team ${feature} is accessible`
            ]
        ));
        id++;
    });
    
    return stories;
}

/**
 * Generate Developer Experience Stories (100 → 200)
 */
function generateDXStories() {
    const stories = [];
    let id = 701;
    
    // Customization (30 → 80)
    const customFeatures = ['themes', 'keybindings', 'layout', 'fonts', 'colors'];
    
    customFeatures.forEach(feature => {
        ['basic', 'advanced', 'expert'].forEach(level => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `Customize ${feature} (${level})`,
                'Developer Experience - Customization',
                level === 'basic' ? 'P0' : 'P1',
                level === 'basic' ? 'Beginner' : 'All',
                'All',
                'a developer',
                `to customize ${feature} at ${level} level`,
                `so that the IDE works for me`,
                [
                    `${feature} customization works`,
                    `${feature} customization is intuitive`,
                    `${feature} customization is saved`
                ]
            ));
            id++;
        });
    });
    
    // Productivity (30 → 60)
    const prodFeatures = ['templates', 'macros', 'command-palette', 'shortcuts', 'snippets'];
    
    prodFeatures.forEach(feature => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            feature.replace(/-/g, ' '),
            'Developer Experience - Productivity',
            feature === 'command-palette' ? 'P0' : 'P1',
            'All',
            'All',
            'a developer',
            `to use ${feature.replace(/-/g, ' ')}`,
            `so that I can work faster`,
            [
                `${feature} works`,
                `${feature} is fast`,
                `${feature} is discoverable`
            ]
        ));
        id++;
    });
    
    // Accessibility (20 → 40)
    const a11yFeatures = ['screen-reader', 'high-contrast', 'keyboard-nav', 'font-size', 'color-blind'];
    
    a11yFeatures.forEach(feature => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            feature.replace(/-/g, ' '),
            'Developer Experience - Accessibility',
            'P0',
            'All',
            'All',
            'a developer',
            `to use ${feature.replace(/-/g, ' ')}`,
            `so that the IDE is accessible`,
            [
                `${feature} works`,
                `${feature} is complete`,
                `${feature} follows standards`
            ]
        ));
        id++;
    });
    
    // Learning (20 → 40)
    const learningFeatures = ['tutorials', 'tips', 'shortcuts', 'discovery', 'onboarding'];
    
    learningFeatures.forEach(feature => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            feature.replace(/-/g, ' '),
            'Developer Experience - Learning',
            'P1',
            'Beginner',
            'All',
            'a developer',
            `to access ${feature.replace(/-/g, ' ')}`,
            `so that I can learn the IDE`,
            [
                `${feature} is helpful`,
                `${feature} is clear`,
                `${feature} is discoverable`
            ]
        ));
        id++;
    });
    
    return stories;
}

/**
 * Generate Enterprise Stories (50 → 100)
 */
function generateEnterpriseStories() {
    const stories = [];
    let id = 801;
    
    // Security (20 → 40)
    const securityFeatures = ['sso', 'audit-logs', 'rbac', 'encryption', 'compliance'];
    
    securityFeatures.forEach(feature => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            feature.toUpperCase(),
            'Enterprise - Security',
            'P0',
            'Enterprise Admin',
            'All',
            'an enterprise admin',
            `to use ${feature.toUpperCase()}`,
            `so that security is managed`,
            [
                `${feature} works`,
                `${feature} is secure`,
                `${feature} is auditable`
            ]
        ));
        id++;
    });
    
    // Management (15 → 30)
    const mgmtFeatures = ['user-management', 'license-management', 'analytics', 'cost-tracking', 'billing'];
    
    mgmtFeatures.forEach(feature => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            feature.replace(/-/g, ' '),
            'Enterprise - Management',
            'P1',
            'Enterprise Admin',
            'All',
            'an enterprise admin',
            `to manage ${feature.replace(/-/g, ' ')}`,
            `so that the platform is managed`,
            [
                `${feature} works`,
                `${feature} is comprehensive`,
                `${feature} provides insights`
            ]
        ));
        id++;
    });
    
    // Integration (15 → 30)
    const integrations = ['ci-cd', 'issue-tracking', 'project-management', 'monitoring', 'logging'];
    
    integrations.forEach(integration => {
        stories.push(createStory(
            `US-${String(id).padStart(4, '0')}`,
            `${integration} integration`,
            'Enterprise - Integration',
            'P1',
            'Enterprise Developer',
            'All',
            'an enterprise developer',
            `to integrate with ${integration.replace(/-/g, ' ')}`,
            `so that workflows are connected`,
            [
                `Integration works`,
                `Integration is reliable`,
                `Integration is documented`
            ]
        ));
        id++;
    });
    
    return stories;
}

/**
 * Generate Edge Case Stories (50 → 200)
 */
function generateEdgeCaseStories() {
    const stories = [];
    let id = 901;
    
    // Error Handling (20 → 80)
    const errorScenarios = ['graceful-degradation', 'error-recovery', 'error-reporting', 'offline-mode', 'network-issues'];
    
    errorScenarios.forEach(scenario => {
        ['file-error', 'network-error', 'api-error', 'system-error'].forEach(errorType => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${scenario} (${errorType})`,
                'Edge Cases - Error Handling',
                scenario === 'error-recovery' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to handle ${errorType} with ${scenario.replace(/-/g, ' ')}`,
                `so that the IDE works reliably`,
                [
                    `${scenario} works for ${errorType}`,
                    `${scenario} provides feedback`,
                    `${scenario} doesn't lose data`
                ]
            ));
            id++;
        });
    });
    
    // Compatibility (15 → 60)
    const compatScenarios = ['multi-platform', 'legacy-code', 'multiple-languages', 'large-projects', 'small-projects'];
    
    compatScenarios.forEach(scenario => {
        ['Mac', 'Windows', 'Linux'].forEach(platform => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${scenario} (${platform})`,
                'Edge Cases - Compatibility',
                scenario === 'multi-platform' ? 'P0' : 'P1',
                'All',
                platform,
                'a developer',
                `to use ${scenario.replace(/-/g, ' ')} on ${platform}`,
                `so that the IDE works everywhere`,
                [
                    `${scenario} works on ${platform}`,
                    `${scenario} is performant`,
                    `${scenario} is reliable`
                ]
            ));
            id++;
        });
    });
    
    // Performance Edge Cases (15 → 60)
    const perfScenarios = ['slow-machine', 'low-memory', 'battery-saving', 'background-processing', 'resource-limits'];
    
    perfScenarios.forEach(scenario => {
        ['laptop', 'desktop', 'server'].forEach(device => {
            stories.push(createStory(
                `US-${String(id).padStart(4, '0')}`,
                `${scenario} (${device})`,
                'Edge Cases - Performance',
                scenario === 'low-memory' ? 'P0' : 'P1',
                'All',
                'All',
                'a developer',
                `to use IDE with ${scenario.replace(/-/g, ' ')} on ${device}`,
                `so that the IDE works on any device`,
                [
                    `${scenario} works on ${device}`,
                    `${scenario} is efficient`,
                    `${scenario} doesn't degrade UX`
                ]
            ));
            id++;
        });
    });
    
    return stories;
}

/**
 * Main function
 */
function main() {
    console.log('📝 Generating 1000+ User Stories...\n');
    
    // Generate all stories
    const coreStories = generateCoreCodingStories();
    const aiStories = generateAIStories();
    const qualityStories = generateQualityStories();
    const perfStories = generatePerformanceStories();
    const collabStories = generateCollaborationStories();
    const dxStories = generateDXStories();
    const enterpriseStories = generateEnterpriseStories();
    const edgeCaseStories = generateEdgeCaseStories();
    
    const allStories = [
        ...coreStories,
        ...aiStories,
        ...qualityStories,
        ...perfStories,
        ...collabStories,
        ...dxStories,
        ...enterpriseStories,
        ...edgeCaseStories
    ];
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Write stories to files
    const storiesByCategory = {};
    allStories.forEach(story => {
        if (!storiesByCategory[story.category]) {
            storiesByCategory[story.category] = [];
        }
        storiesByCategory[story.category].push(story);
    });
    
    // Write summary
    const summary = {
        total: allStories.length,
        byCategory: Object.keys(storiesByCategory).map(cat => ({
            category: cat,
            count: storiesByCategory[cat].length
        })),
        byPriority: {
            P0: allStories.filter(s => s.priority === 'P0').length,
            P1: allStories.filter(s => s.priority === 'P1').length,
            P2: allStories.filter(s => s.priority === 'P2').length
        }
    };
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'SUMMARY.json'),
        JSON.stringify(summary, null, 2)
    );
    
    // Write all stories
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'ALL_STORIES.json'),
        JSON.stringify(allStories, null, 2)
    );
    
    console.log(`✅ Generated ${allStories.length} user stories!`);
    console.log(`\n📊 Summary:`);
    console.log(`   P0 (Must Have): ${summary.byPriority.P0}`);
    console.log(`   P1 (Should Have): ${summary.byPriority.P1}`);
    console.log(`   P2 (Nice to Have): ${summary.byPriority.P2}`);
    console.log(`\n📁 Output: ${OUTPUT_DIR}`);
}

if (require.main === module) {
    main();
}

module.exports = { generateCoreCodingStories, generateAIStories, generateQualityStories };
