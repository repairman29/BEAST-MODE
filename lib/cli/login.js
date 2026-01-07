/**
 * BEAST MODE CLI Login & Authentication
 * 
 * Handles user authentication and shows epic animations on login
 */

const readline = require('readline');
const chalk = require('chalk').default || require('chalk');
const CLIArtwork = require('./artwork');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class CLILogin {
    constructor() {
        this.artwork = new CLIArtwork();
        this.configPath = path.join(os.homedir(), '.beast-mode', 'config.json');
    }

    /**
     * Show login animation and welcome
     */
    async showLoginAnimation() {
        // Show random creature animation
        await this.artwork.animateCreature('random');
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Welcome message
        console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.cyan('║                                                           ║'));
        console.log(chalk.bold.cyan('║') + chalk.bold.yellow('   🚀 WELCOME TO BEAST MODE 🚀') + chalk.bold.cyan('                              ║'));
        console.log(chalk.bold.cyan('║                                                           ║'));
        console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝\n'));
    }

    /**
     * Check if user is logged in
     */
    async isLoggedIn() {
        try {
            const config = await fs.readJson(this.configPath);
            return !!(config && config.user && config.user.token);
        } catch (e) {
            return false;
        }
    }

    /**
     * Get user config
     */
    async getUserConfig() {
        try {
            const config = await fs.readJson(this.configPath);
            return config.user || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Interactive login
     */
    async login() {
        // Show login animation
        await this.showLoginAnimation();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve, reject) => {
            console.log(chalk.cyan('Please enter your credentials:\n'));

            rl.question(chalk.yellow('Email: '), (email) => {
                rl.question(chalk.yellow('API Key (or press Enter to skip): '), async (apiKey) => {
                    rl.close();

                    // Try to get GitHub info if available
                    let githubUsername = null;
                    let githubUserId = null;
                    
                    // If we have a token, try to get GitHub info
                    if (apiKey) {
                        try {
                            const axios = require('axios');
                            const response = await axios.get('https://api.github.com/user', {
                                headers: { 'Authorization': `Bearer ${apiKey}` }
                            });
                            githubUsername = response.data.login;
                            githubUserId = response.data.id;
                        } catch (error) {
                            // Not a GitHub token, that's okay
                        }
                    }

                    // Save config
                    await this.saveConfig({
                        email: email,
                        token: apiKey || null,
                        githubUsername: githubUsername,
                        githubUserId: githubUserId,
                        loggedInAt: new Date().toISOString()
                    });

                    // Track login session
                    try {
                        const { getCLISessionTracker } = require('./session-tracker');
                        const tracker = getCLISessionTracker();
                        tracker.githubUsername = githubUsername;
                        await tracker.track('login', {
                            email: email,
                            githubUsername: githubUsername,
                            githubUserId: githubUserId
                        });
                    } catch (error) {
                        // Silently fail
                    }

                    console.log(chalk.green('\n✅ Login successful!\n'));
                    if (githubUsername) {
                        console.log(chalk.cyan(`   GitHub: @${githubUsername}\n`));
                    }
                    resolve({ email, token: apiKey, githubUsername, githubUserId });
                });
            });
        });
    }

    /**
     * Save user config
     */
    async saveConfig(userData) {
        try {
            await fs.ensureDir(path.dirname(this.configPath));
            
            let config = {};
            try {
                config = await fs.readJson(this.configPath);
            } catch (e) {
                // Config doesn't exist, create new
            }

            config.user = userData;
            config.version = '1.0.0';
            config.updatedAt = new Date().toISOString();

            await fs.writeJson(this.configPath, config, { spaces: 2 });
        } catch (error) {
            console.error(chalk.red(`Error saving config: ${error.message}`));
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            const config = await fs.readJson(this.configPath);
            if (config.user) {
                delete config.user;
                await fs.writeJson(this.configPath, config, { spaces: 2 });
                console.log(chalk.green('✅ Logged out successfully!'));
            }
        } catch (e) {
            console.log(chalk.yellow('⚠️  No active session found'));
        }
    }

    /**
     * Show user status
     */
    async showStatus() {
        const user = await this.getUserConfig();
        
        if (user) {
            console.log(chalk.bold.cyan('\n👤 User Status:'));
            console.log(chalk.white(`   Email: ${user.email || 'Not set'}`));
            console.log(chalk.white(`   Logged in: ${user.loggedInAt ? new Date(user.loggedInAt).toLocaleString() : 'Unknown'}`));
            console.log(chalk.white(`   API Key: ${user.token ? '✅ Set' : '❌ Not set'}\n`));
        } else {
            console.log(chalk.yellow('\n⚠️  Not logged in. Run "beast-mode login" to authenticate.\n'));
        }
    }
}

module.exports = CLILogin;

