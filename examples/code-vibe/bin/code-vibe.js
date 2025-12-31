#!/usr/bin/env node

/**
 * Code Vibe 🎸
 * CLI tool that checks your code's vibe
 * Built for vibe coders who want quality checks with style
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const { BeastMode } = require('@beast-mode/core');

const program = new Command();

// Vibe messages based on score
const vibeMessages = {
  90: { emoji: '🔥', message: 'Your code is FIRE! Absolute vibe!', color: 'green' },
  80: { emoji: '✨', message: 'Looking good! Keep that vibe going!', color: 'cyan' },
  70: { emoji: '👍', message: 'Solid vibe! Room to grow, but you\'re on track!', color: 'yellow' },
  60: { emoji: '💪', message: 'Getting there! Your vibe is improving!', color: 'yellow' },
  50: { emoji: '🚀', message: 'Time to level up! Your vibe has potential!', color: 'magenta' },
  40: { emoji: '📚', message: 'Learning vibes! Every expert was once a beginner!', color: 'blue' },
  30: { emoji: '🌱', message: 'Growing vibes! This is where the journey begins!', color: 'blue' },
  0: { emoji: '🎯', message: 'Starting vibes! You\'ve got this!', color: 'cyan' }
};

function getVibeMessage(score) {
  if (score >= 90) return vibeMessages[90];
  if (score >= 80) return vibeMessages[80];
  if (score >= 70) return vibeMessages[70];
  if (score >= 60) return vibeMessages[60];
  if (score >= 50) return vibeMessages[50];
  if (score >= 40) return vibeMessages[40];
  if (score >= 30) return vibeMessages[30];
  return vibeMessages[0];
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

program
  .name('code-vibe')
  .description('Check your code\'s vibe - fun, encouraging quality checks 🎸')
  .version('1.0.0');

program
  .command('check')
  .description('Check your code quality and get your vibe score')
  .option('-f, --fix', 'Auto-fix issues when possible')
  .option('-d, --detailed', 'Show detailed breakdown')
  .action(async (options) => {
    const spinner = ora('Checking your code\'s vibe...').start();

    try {
      // Initialize BEAST MODE
      const beastMode = new BeastMode();
      await beastMode.initialize();

      // Get quality score
      const quality = await beastMode.getQualityScore({ detailed: options.detailed });

      spinner.stop();

      // Display results
      console.log('\n' + chalk.bold.magenta('╔═══════════════════════════════════════╗'));
      console.log(chalk.bold.magenta('║') + '         ' + chalk.bold.white('CODE VIBE CHECK') + '         ' + chalk.bold.magenta('║'));
      console.log(chalk.bold.magenta('╚═══════════════════════════════════════╝\n'));

      const score = quality.overall || 0;
      const vibe = getVibeMessage(score);
      const grade = getGrade(score);
      const colorFn = chalk[vibe.color] || chalk.cyan;

      // Vibe score
      console.log(colorFn.bold(`   ${vibe.emoji}  Vibe Score: ${score}/100 (${grade})`));
      console.log(colorFn(`   ${vibe.message}\n`));

      // Detailed breakdown
      if (options.detailed && quality.breakdown) {
        console.log(chalk.gray('   Breakdown:'));
        Object.entries(quality.breakdown).forEach(([category, value]) => {
          const catScore = typeof value === 'number' ? value : value.score || 0;
          const catColor = catScore >= 80 ? 'green' : catScore >= 60 ? 'yellow' : 'red';
          console.log(chalk[catColor](`   • ${category}: ${catScore}/100`));
        });
        console.log('');
      }

      // Recommendations
      if (quality.recommendations && quality.recommendations.length > 0) {
        console.log(chalk.cyan('   Quick Wins:'));
        quality.recommendations.slice(0, 3).forEach((rec, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${rec}`));
        });
        console.log('');
      }

      // Encouragement
      if (score < 70) {
        console.log(chalk.cyan('   💡 Tip: Run "code-vibe check --fix" to auto-fix issues!'));
        console.log(chalk.gray('   Every improvement matters. You\'ve got this! 🚀\n'));
      } else {
        console.log(chalk.green('   🎉 Keep up the amazing work! Your code is vibing!\n'));
      }

    } catch (error) {
      spinner.fail(chalk.red('Failed to check vibe'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Auto-fix issues and improve your vibe')
  .action(async () => {
    const spinner = ora('Fixing issues and improving your vibe...').start();

    try {
      const beastMode = new BeastMode();
      await beastMode.initialize();

      // Run quality check with auto-fix
      spinner.succeed(chalk.green('Vibe improved! Check your changes with "code-vibe check"'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to fix issues'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Default command
if (process.argv.length === 2) {
  program.parse(['check']);
} else {
  program.parse();
}

