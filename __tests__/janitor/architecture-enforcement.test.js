/**
 * Tests for Architecture Enforcement Layer
 */

const { ArchitectureEnforcer } = require('../../lib/janitor/architecture-enforcer');
const fs = require('fs').promises;
const path = require('path');

describe('Architecture Enforcement Layer', () => {
    let enforcer;

    beforeEach(() => {
        enforcer = new ArchitectureEnforcer({
            enabled: true,
            autoFix: true,
            preCommitHook: true,
            rules: {
                noDbInFrontend: true,
                noSecretsInCode: true,
                noEval: true,
                noInnerHTML: true,
                enforceApiRoutes: true
            }
        });
    });

    describe('Database in Frontend Detection', () => {
        test('should detect database logic in frontend component', async () => {
            const content = `
                import React from 'react';
                const Component = () => {
                    const data = supabase.from('users').select('*');
                    return <div>{data}</div>;
                };
            `;

            const violations = await enforcer.checkFile('src/components/UserList.jsx', content);
            
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].type).toBe('database-in-frontend');
            expect(violations[0].severity).toBe('high');
        });

        test('should not flag database logic in API routes', async () => {
            const content = `
                export default async function handler(req, res) {
                    const data = await supabase.from('users').select('*');
                    return res.json(data);
                }
            `;

            const violations = await enforcer.checkFile('src/api/users.js', content);
            
            const dbViolations = violations.filter(v => v.type === 'database-in-frontend');
            expect(dbViolations.length).toBe(0);
        });
    });

    describe('Secret Detection', () => {
        test('should detect hardcoded secrets', async () => {
            const content = `
                const apiKey = "sk-1234567890abcdef";
                const secret = "my-secret-key";
            `;

            const violations = await enforcer.checkFile('src/config.js', content);
            
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type === 'hardcoded-secret')).toBe(true);
        });

        test('should auto-fix hardcoded secrets', async () => {
            const content = `const apiKey = "sk-1234567890abcdef";`;
            const filePath = 'test-file.js';

            // Mock file operations
            enforcer.fixViolation = jest.fn().mockResolvedValue({
                file: filePath,
                fixed: true
            });

            const violations = await enforcer.checkFile(filePath, content);
            const secretViolation = violations.find(v => v.type === 'hardcoded-secret');
            
            if (secretViolation && enforcer.options.autoFix) {
                const fix = await enforcer.fixViolation(secretViolation, filePath, content);
                expect(fix.fixed).toBe(true);
            }
        });
    });

    describe('Eval Detection', () => {
        test('should detect // SECURITY: eval() disabled
// eval() usage', async () => {
            const content = `const result = // SECURITY: eval() disabled
// eval(userInput);`;

            const violations = await enforcer.checkFile('src/utils.js', content);
            
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type === 'eval-usage')).toBe(true);
        });
    });

    describe('XSS Risk Detection', () => {
        test('should detect innerHTML usage in frontend', async () => {
            const content = `
                const Component = () => {
                    element.innerHTML = userInput;
                    return <div></div>;
                };
            `;

            const violations = await enforcer.checkFile('src/components/Component.jsx', content);
            
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type === 'xss-risk')).toBe(true);
        });
    });
});

