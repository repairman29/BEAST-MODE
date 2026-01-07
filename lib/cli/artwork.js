/**
 * BEAST MODE CLI Artwork Display
 * 
 * Utilities for displaying artwork, ASCII art, and visual elements in the terminal
 * Supports images, ASCII art files, and dynamic banner generation
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk').default || require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');

// Optional: terminal-image for displaying images (lighter weight)
let terminalImage = null;
try {
    terminalImage = require('terminal-image');
} catch (e) {
    // terminal-image is optional
}

// Beast creature animations
let beastCreatures = null;
try {
    beastCreatures = require('./animations/beast-creatures');
} catch (e) {
    // Animations are optional
}

class CLIArtwork {
    constructor() {
        this.assetsPath = path.join(__dirname, '../../assets/cli');
        this.imagesPath = path.join(this.assetsPath, 'images');
        this.asciiPath = path.join(this.assetsPath, 'ascii');
        this.bannersPath = path.join(this.assetsPath, 'banners');
    }

    /**
     * Display an image file in the terminal
     * @param {string} imagePath - Path to image file
     * @param {object} options - Display options
     */
    async displayImage(imagePath, options = {}) {
        const {
            width = 60,
            height = 30
        } = options;

        const fullPath = path.isAbsolute(imagePath) 
            ? imagePath 
            : path.join(this.imagesPath, imagePath);

        if (!fs.existsSync(fullPath)) {
            console.log(chalk.yellow(`⚠️  Image not found: ${imagePath}`));
            return null;
        }

        try {
            // Try using terminal-image if available
            if (terminalImage) {
                const image = await terminalImage.file(fullPath, {
                    width: width,
                    height: height
                });
                console.log(image);
                return image;
            } else {
                // Fallback: suggest installing terminal-image or use ASCII art
                console.log(chalk.yellow(`💡 Install 'terminal-image' for image display, or use ASCII art instead`));
                console.log(chalk.cyan(`   Image location: ${fullPath}`));
                return null;
            }
        } catch (error) {
            console.log(chalk.red(`❌ Error displaying image: ${error.message}`));
            return null;
        }
    }

    /**
     * Display ASCII art from a text file
     * @param {string} asciiFile - Name of ASCII art file
     * @param {object} options - Display options (color, animation)
     */
    async displayASCII(asciiFile, options = {}) {
        const {
            color = 'magenta',
            bold = true,
            animate = false,
            speed = 50
        } = options;

        const fullPath = path.join(this.asciiPath, asciiFile);
        
        if (!fs.existsSync(fullPath)) {
            console.log(chalk.yellow(`⚠️  ASCII art file not found: ${asciiFile}`));
            return null;
        }

        try {
            const content = await fs.readFile(fullPath, 'utf8');
            let output = content;

            // Apply color
            if (color && chalk[color]) {
                output = bold ? chalk.bold[color](output) : chalk[color](output);
            }

            // Animate if requested (simple line-by-line reveal)
            if (animate) {
                const lines = output.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    console.log(lines[i]);
                    if (i < lines.length - 1) {
                        await this.sleep(speed);
                    }
                }
            } else {
                console.log(output);
            }

            return output;
        } catch (error) {
            console.log(chalk.red(`❌ Error reading ASCII art: ${error.message}`));
            return null;
        }
    }

    /**
     * Generate a banner using figlet
     * @param {string} text - Text to display
     * @param {object} options - Banner options
     */
    async generateBanner(text, options = {}) {
        const {
            font = 'Standard',
            color = 'cyan',
            bold = true,
            box = false,
            boxStyle = 'round'
        } = options;

        return new Promise((resolve, reject) => {
            figlet.text(text, {
                font: font,
                horizontalLayout: 'default',
                verticalLayout: 'default'
            }, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                let output = data;
                
                // Apply color
                if (color && chalk[color]) {
                    output = bold ? chalk.bold[color](output) : chalk[color](output);
                }

                // Add box if requested
                if (box) {
                    output = boxen(output, {
                        borderStyle: boxStyle,
                        padding: 1,
                        margin: 1
                    });
                }

                console.log(output);
                resolve(output);
            });
        });
    }

    /**
     * Display the BEAST MODE logo with artwork
     * @param {object} options - Display options
     */
    async displayLogo(options = {}) {
        const {
            style = 'ascii', // 'ascii', 'figlet', 'image', 'minimal'
            color = 'magenta',
            animated = false
        } = options;

        switch (style) {
            case 'figlet':
                await this.generateBanner('BEAST MODE', {
                    font: 'Standard',
                    color: color,
                    bold: true
                });
                break;

            case 'image':
                // Try to display logo image if available
                await this.displayImage('logo.png', {
                    width: 60,
                    colored: true
                });
                break;

            case 'minimal':
                console.log(chalk.bold[color]('⚔️  BEAST MODE  🚀'));
                break;

            case 'ascii':
            default:
                // Try to load custom ASCII art, fallback to default
                const customASCII = await this.displayASCII('logo.txt', {
                    color: color,
                    animate: animated
                });
                
                if (!customASCII) {
                    // Fallback to default ASCII
                    const defaultASCII = `
██████╗ ███████╗ █████╗ ███████╗████████╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗
██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
██████╔╝█████╗  ███████║███████╗   ██║       ██╔████╔██║██║   ██║██║  ██║█████╗
██╔══██╗██╔══╝  ██╔══██║╚════██║   ██║       ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝
██████╔╝███████╗██║  ██║███████║   ██║       ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
`;
                    console.log(chalk.bold[color](defaultASCII));
                }
                break;
        }
    }

    /**
     * List available artwork files
     */
    async listArtwork() {
        const artwork = {
            images: [],
            ascii: [],
            banners: []
        };

        try {
            if (fs.existsSync(this.imagesPath)) {
                artwork.images = (await fs.readdir(this.imagesPath))
                    .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
            }

            if (fs.existsSync(this.asciiPath)) {
                artwork.ascii = (await fs.readdir(this.asciiPath))
                    .filter(f => f.endsWith('.txt'));
            }

            if (fs.existsSync(this.bannersPath)) {
                artwork.banners = (await fs.readdir(this.bannersPath))
                    .filter(f => /\.(txt|json)$/i.test(f));
            }
        } catch (error) {
            console.log(chalk.yellow(`⚠️  Error reading artwork directory: ${error.message}`));
        }

        return artwork;
    }

    /**
     * Display artwork gallery
     */
    async displayGallery() {
        const artwork = await this.listArtwork();

        console.log(chalk.bold.cyan('\n🎨 BEAST MODE Artwork Gallery\n'));
        console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        if (artwork.images.length > 0) {
            console.log(chalk.bold('📸 Images:'));
            artwork.images.forEach(img => {
                console.log(chalk.white(`   • ${img}`));
            });
            console.log('');
        }

        if (artwork.ascii.length > 0) {
            console.log(chalk.bold('🎭 ASCII Art:'));
            artwork.ascii.forEach(ascii => {
                console.log(chalk.white(`   • ${ascii}`));
            });
            console.log('');
        }

        if (artwork.banners.length > 0) {
            console.log(chalk.bold('🚩 Banners:'));
            artwork.banners.forEach(banner => {
                console.log(chalk.white(`   • ${banner}`));
            });
            console.log('');
        }

        if (artwork.images.length === 0 && artwork.ascii.length === 0 && artwork.banners.length === 0) {
            console.log(chalk.yellow('   No artwork files found. Add images to assets/cli/images/'));
            console.log(chalk.yellow('   Add ASCII art to assets/cli/ascii/'));
            console.log(chalk.yellow('   Add banners to assets/cli/banners/\n'));
        }
    }

    /**
     * Sleep utility for animations
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Display animated beast creature (kraken or narwhal)
     * @param {string} creature - 'kraken', 'narwhal', or 'random'
     */
    async animateCreature(creature = 'random') {
        if (!beastCreatures) {
            console.log(chalk.yellow('⚠️  Beast creature animations not available'));
            return null;
        }

        try {
            if (creature === 'random') {
                await beastCreatures.random();
            } else if (creature === 'kraken') {
                await beastCreatures.kraken();
            } else if (creature === 'narwhal') {
                await beastCreatures.narwhal();
            } else {
                console.log(chalk.yellow(`⚠️  Unknown creature: ${creature}. Use 'kraken', 'narwhal', or 'random'`));
                return null;
            }
            return true;
        } catch (error) {
            console.log(chalk.red(`❌ Error displaying animation: ${error.message}`));
            return null;
        }
    }

    /**
     * List available animations
     */
    listAnimations() {
        return {
            creatures: ['kraken', 'narwhal', 'random'],
            available: beastCreatures !== null
        };
    }
}

module.exports = CLIArtwork;

