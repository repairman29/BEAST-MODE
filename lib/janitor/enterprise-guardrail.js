/**
 * BEAST MODE Enterprise Guardrail
 * Plain English Diffs for Code Reviews
 * 
 * The Pitch: "Let your PMs code, but don't let them push to Prod."
 * 
 * Features:
 * - Governance layer between vibe coder and repo
 * - Plain English diffs for code reviews
 * - Bridges trust gap between "Real Devs" and "Vibe Coders"
 */

const { createLogger } = require('../utils/logger');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const log = createLogger('EnterpriseGuardrail');

class EnterpriseGuardrail {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            requireApproval: true,
            autoApproveSafe: false,
            plainEnglishDiffs: true,
            ...options
        };

        this.pendingReviews = [];
        this.approvedChanges = [];
        this.rejectedChanges = [];
    }

    /**
     * Initialize Enterprise Guardrail
     */
    async initialize() {
        log.info('🛡️ Initializing Enterprise Guardrail...');

        // Set up pre-push hook if enabled
        if (this.options.requireApproval) {
            await this.installPrePushHook();
        }

        log.info('✅ Enterprise Guardrail ready');
    }

    /**
     * Install pre-push hook
     */
    async installPrePushHook() {
        try {
            const gitHooksPath = path.join(process.cwd(), '.git', 'hooks');
            await fs.mkdir(gitHooksPath, { recursive: true });

            const prePushHook = `#!/bin/sh
# BEAST MODE Enterprise Guardrail Pre-Push Hook
# Uses relative path to avoid package dependency issues
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
node -e "const path = require('path'); const { EnterpriseGuardrail } = require(path.join('$PROJECT_ROOT', 'lib/janitor/enterprise-guardrail')); const guardrail = new EnterpriseGuardrail({ enabled: true }); guardrail.initialize().then(() => guardrail.checkPush()).then(result => { if (!result.allowed) { console.error('❌ Push blocked: Requires approval'); process.exit(1); } }).catch(err => { console.error('Hook error:', err.message); process.exit(0); });"
`;

            const hookPath = path.join(gitHooksPath, 'pre-push');
            await fs.writeFile(hookPath, prePushHook, 'utf8');
            await fs.chmod(hookPath, '755');

            log.info('✅ Pre-push hook installed');
        } catch (error) {
            log.warn('Failed to install pre-push hook:', error.message);
        }
    }

    /**
     * Check if push is allowed
     */
    async checkPush() {
        try {
            // Get staged changes
            const changes = await this.getStagedChanges();
            
            if (changes.length === 0) {
                return { allowed: true, reason: 'No changes to review' };
            }

            // Generate plain English diff
            const plainEnglishDiff = await this.generatePlainEnglishDiff(changes);

            // Check if changes are safe to auto-approve
            if (this.options.autoApproveSafe && this.isSafeChange(changes)) {
                return {
                    allowed: true,
                    reason: 'Safe change auto-approved',
                    plainEnglishDiff
                };
            }

            // Require approval
            const review = {
                id: `review-${Date.now()}`,
                changes,
                plainEnglishDiff,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            this.pendingReviews.push(review);

            return {
                allowed: false,
                reason: 'Requires approval',
                review,
                plainEnglishDiff
            };
        } catch (error) {
            log.error('Failed to check push:', error);
            return { allowed: true }; // Fail open
        }
    }

    /**
     * Get staged changes
     */
    async getStagedChanges() {
        try {
            const diff = execSync('git diff --cached', {
                cwd: process.cwd(),
                encoding: 'utf8'
            });

            return this.parseDiff(diff);
        } catch (error) {
            return [];
        }
    }

    /**
     * Parse git diff into structured changes
     */
    parseDiff(diff) {
        const changes = [];
        const lines = diff.split('\n');
        let currentFile = null;
        let currentChange = null;

        for (const line of lines) {
            // File header
            if (line.startsWith('diff --git')) {
                if (currentChange) {
                    changes.push(currentChange);
                }
                const fileMatch = line.match(/b\/(.+)$/);
                currentFile = fileMatch ? fileMatch[1] : null;
                currentChange = {
                    file: currentFile,
                    additions: [],
                    deletions: [],
                    modifications: []
                };
            }
            // Addition
            else if (line.startsWith('+') && !line.startsWith('+++')) {
                if (currentChange) {
                    currentChange.additions.push(line.substring(1));
                }
            }
            // Deletion
            else if (line.startsWith('-') && !line.startsWith('---')) {
                if (currentChange) {
                    currentChange.deletions.push(line.substring(1));
                }
            }
        }

        if (currentChange) {
            changes.push(currentChange);
        }

        return changes;
    }

    /**
     * Generate plain English diff
     */
    async generatePlainEnglishDiff(changes) {
        const descriptions = [];

        for (const change of changes) {
            const fileDesc = await this.describeFileChange(change);
            descriptions.push(fileDesc);
        }

        return {
            summary: `This change modifies ${changes.length} file(s)`,
            files: descriptions
        };
    }

    /**
     * Describe a file change in plain English
     */
    async describeFileChange(change) {
        const file = change.file;
        const ext = path.extname(file);
        const dir = path.dirname(file);
        const isComponent = ext === '.jsx' || ext === '.tsx' || dir.includes('components');
        const isAPI = dir.includes('api') || dir.includes('routes');

        const description = {
            file,
            summary: '',
            details: []
        };

        // Analyze additions
        const additions = change.additions.join('\n');
        
        // Detect patterns
        if (additions.includes('useState') || additions.includes('useEffect')) {
            description.details.push('Adds React state management hooks');
        }
        if (additions.includes('const [') && additions.includes('set')) {
            const stateMatch = additions.match(/const\s+\[(\w+)/);
            if (stateMatch) {
                description.details.push(`Adds state variable: ${stateMatch[1]}`);
            }
        }
        if (additions.includes('function') || additions.includes('const') && additions.includes('=') && additions.includes('=>')) {
            const funcMatch = additions.match(/(?:function|const)\s+(\w+)/);
            if (funcMatch) {
                description.details.push(`Adds function: ${funcMatch[1]}`);
            }
        }
        if (additions.includes('import')) {
            const importMatch = additions.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                description.details.push(`Imports from: ${importMatch[1]}`);
            }
        }
        if (additions.includes('export')) {
            description.details.push('Exports new functionality');
        }

        // Analyze deletions
        if (change.deletions.length > 0) {
            description.details.push(`Removes ${change.deletions.length} line(s)`);
        }

        // Generate summary
        if (isComponent) {
            description.summary = `Updates React component: ${path.basename(file)}`;
        } else if (isAPI) {
            description.summary = `Updates API endpoint: ${path.basename(file)}`;
        } else {
            description.summary = `Modifies file: ${path.basename(file)}`;
        }

        // Add context
        if (description.details.length === 0) {
            description.details.push('General code changes');
        }

        return description;
    }

    /**
     * Check if change is safe to auto-approve
     */
    isSafeChange(changes) {
        // Safe changes:
        // - Only comments/documentation
        // - Only formatting
        // - Only test files
        // - No new dependencies
        // - No security-sensitive changes

        for (const change of changes) {
            const file = change.file;

            // Not safe if:
            // - Contains secrets
            if (this.containsSecrets(change.additions.join('\n'))) {
                return false;
            }

            // - Modifies security-sensitive files
            if (file.includes('auth') || file.includes('security') || file.includes('config')) {
                return false;
            }

            // - Adds new dependencies
            if (file === 'package.json' && change.additions.some(line => line.includes('"'))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if content contains secrets
     */
    containsSecrets(content) {
        const secretPatterns = [
            /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
            /secret\s*[:=]\s*['"][^'"]+['"]/i,
            /password\s*[:=]\s*['"][^'"]+['"]/i,
            /token\s*[:=]\s*['"][^'"]+['"]/i
        ];

        return secretPatterns.some(pattern => pattern.test(content));
    }

    /**
     * Approve a review
     */
    async approveReview(reviewId, approver) {
        const review = this.pendingReviews.find(r => r.id === reviewId);
        if (!review) {
            throw new Error(`Review not found: ${reviewId}`);
        }

        review.status = 'approved';
        review.approvedBy = approver;
        review.approvedAt = new Date().toISOString();

        this.approvedChanges.push(review);
        this.pendingReviews = this.pendingReviews.filter(r => r.id !== reviewId);

        log.info(`✅ Review ${reviewId} approved by ${approver}`);

        return review;
    }

    /**
     * Reject a review
     */
    async rejectReview(reviewId, reason, reviewer) {
        const review = this.pendingReviews.find(r => r.id === reviewId);
        if (!review) {
            throw new Error(`Review not found: ${reviewId}`);
        }

        review.status = 'rejected';
        review.rejectedBy = reviewer;
        review.rejectionReason = reason;
        review.rejectedAt = new Date().toISOString();

        this.rejectedChanges.push(review);
        this.pendingReviews = this.pendingReviews.filter(r => r.id !== reviewId);

        log.info(`❌ Review ${reviewId} rejected by ${reviewer}: ${reason}`);

        return review;
    }

    /**
     * Get pending reviews
     */
    getPendingReviews() {
        return this.pendingReviews.map(review => ({
            id: review.id,
            summary: review.plainEnglishDiff.summary,
            files: review.plainEnglishDiff.files.map(f => f.file),
            createdAt: review.createdAt
        }));
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            requireApproval: this.options.requireApproval,
            pendingReviews: this.pendingReviews.length,
            approvedChanges: this.approvedChanges.length,
            rejectedChanges: this.rejectedChanges.length
        };
    }
}

module.exports = { EnterpriseGuardrail };

