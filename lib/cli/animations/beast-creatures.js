#!/usr/bin/env node

// ██████╗ ███████╗ █████╗ ███████╗████████╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗
// ██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
// ██████╔╝█████╗  ███████║███████╗   ██║       ██╔████╔██║██║   ██║██║  ██║█████╗  
// ██╔══██╗██╔══╝  ██╔══██║╚════██║   ██║       ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  
// ██████╔╝███████╗██║  ██║███████║   ██║       ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
// ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
//
// beast-mode.dev - UNLEASH THE DEPTHS

const readline = require('readline');

// ============================================================================
// ANSI ESCAPE CODES
// ============================================================================
const ESC = '\x1b[';
const BELL = '\x07';
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const CLEAR_SCREEN = `${ESC}2J${ESC}H`;
const RESET = `${ESC}0m`;

// Colors
const C = {
  black: `${ESC}30m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  gray: `${ESC}90m`,
  brightRed: `${ESC}91m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightMagenta: `${ESC}95m`,
  brightCyan: `${ESC}96m`,
  reset: RESET,
};

// ============================================================================
// SPINNERS - The calm before the storm
// ============================================================================
const spinnerFrames = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  ocean: ['🌊', '〰️', '🌊', '〰️', '💧', '〰️'],
  ripple: ['·', '°', '•', '●', '•', '°'],
  pulse: ['◯', '◔', '◑', '◕', '●', '◕', '◑', '◔'],
  brewing: ['     ', ' .   ', ' ..  ', ' ... ', '  .. ', '   . ', '     ', '   . ', '  .. ', ' ... ', ' ..  ', ' .   '],
};

// ============================================================================
// KRAKEN FRAMES
// ============================================================================
const krakenFrames = [
  // Frame 1 - Calm waters
  `
${C.blue}
                            ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 2 - Disturbance
  `
${C.blue}
                            ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}. · .${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 3 - Something rises
  `
${C.blue}
                                    ${C.cyan}·${C.blue}
                            ~ ~ ~ ~ ${C.cyan}°${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}· ° · °${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 4 - Tentacles breach
  `
${C.blue}
                                   ${C.magenta})${C.blue}
                                  ${C.magenta}/|${C.blue}
                            ~ ~ ${C.cyan}°${C.magenta}(  )${C.cyan}°${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}· °${C.blue} ~ ~ ~ ~ ${C.cyan}° ·${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 5 - More tentacles
  `
${C.blue}
                                  ${C.magenta}\\|/${C.blue}
                                 ${C.magenta}( @ )${C.blue}
                            ~ ${C.magenta}~(     )~${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ~ ~ ${C.magenta})~${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ${C.magenta}~(${C.blue} ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 6 - The beast emerges
  `
${C.blue}
                               ${C.magenta}\\  |  /${C.blue}
                              ${C.magenta}\\ \\|/ /${C.blue}
                               ${C.magenta}( O O )${C.blue}
                            ~${C.magenta}~(  w  )~${C.blue}~ ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ~ ${C.magenta})~~${C.blue} ~ ${C.magenta}/|   ||${C.blue} ~ ~ ${C.magenta}~~(${C.blue} ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 7 - Full kraken
  `
${C.blue}
                              ${C.magenta}\\\\  |  //${C.blue}
                             ${C.magenta}\\\\ \\|/ //${C.blue}
                              ${C.magenta}(  ◉ ◉  )${C.blue}
                           ~ ${C.magenta}~(   w   )~${C.blue} ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ${C.magenta})~~~${C.blue} ~${C.magenta}/||     |||${C.blue}~ ${C.magenta}~~~(${C.blue} ~ ~ ~ ~ ~ ~ 
          ~ ~ ~ ~ ${C.magenta}(~${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ${C.magenta}~)${C.blue} ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 8 - BEAST MODE ACTIVATED
  `
${C.blue}
                             ${C.red}\\\\\\ ${C.yellow}|${C.red} ///${C.blue}
                            ${C.red}\\\\\\ ${C.yellow}\\|/${C.red} ///${C.blue}
                             ${C.red}(  ${C.yellow}◉ ◉${C.red}  )${C.blue}
                          ~ ${C.red}~~( ${C.yellow}▼▼▼${C.red} )~~${C.blue} ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ ~ ~ ~ ~ ${C.red})~~~~${C.blue}${C.red}/|||   |||\\${C.blue}${C.red}~~~~(${C.blue} ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ${C.red}(~~${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ${C.red}~~)${C.blue} ~ ~ ~ ~ ~ ~
${C.reset}`,
];

// ============================================================================
// NARWHAL FRAMES
// ============================================================================
const narwhalFrames = [
  // Frame 1 - Calm waters
  `
${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 2 - Ripple
  `
${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}· ·${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 3 - Something approaches
  `
${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}· ° °${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 4 - Horn breaches!
  `
${C.blue}
                                        ${C.yellow}/${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~${C.cyan}°${C.blue}~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}· ° °${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 5 - More horn
  `
${C.blue}
                                       ${C.yellow}//${C.blue}
                                      ${C.yellow}//${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~${C.cyan}°${C.blue}~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}· ° °${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 6 - Head emerging
  `
${C.blue}
                                      ${C.yellow}///${C.blue}
                                     ${C.yellow}///${C.blue}
                                    ${C.yellow}//${C.magenta}__${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~${C.magenta}(__  °)${C.blue}~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}· °${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 7 - Full breach
  `
${C.blue}
                                     ${C.yellow}////${C.blue}
                                    ${C.yellow}////${C.blue}
                                   ${C.yellow}///${C.magenta}___${C.blue}
                                  ${C.yellow}//${C.magenta}(__ ◉ )~~~~${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~${C.magenta}(         )~~~~${C.blue}~ ~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ${C.cyan}·${C.blue} ~ ~ ~${C.magenta}\\~~~~~~~/${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,

  // Frame 8 - BEAST MODE - Full power narwhal
  `
${C.blue}
                                    ${C.red}/////${C.yellow}✦${C.blue}
                                   ${C.red}/////${C.blue}
                                  ${C.red}////${C.magenta}____${C.blue}
                                 ${C.red}///${C.magenta}(__${C.yellow}◉${C.magenta} )~~~~~${C.blue}
      ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ${C.red}/${C.magenta}(          )~~~~~${C.blue}~ ~ ~ ~ ~ ~ ~ ~ ~
          ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~${C.magenta}\\~~~~~~~~~/${C.blue} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
${C.reset}`,
];

// ============================================================================
// TEXT BANNERS
// ============================================================================
const beastModeBanner = `
${C.red}    ██████╗ ███████╗ █████╗ ███████╗████████╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗
    ██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
${C.yellow}    ██████╔╝█████╗  ███████║███████╗   ██║       ██╔████╔██║██║   ██║██║  ██║█████╗  
    ██╔══██╗██╔══╝  ██╔══██║╚════██║   ██║       ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  
${C.red}    ██████╔╝███████╗██║  ██║███████║   ██║       ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
    ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝${C.reset}
`;

const taglines = {
  kraken: `${C.cyan}                              ─── UNLEASH THE DEPTHS ───${C.reset}`,
  narwhal: `${C.cyan}                            ─── PIERCE THROUGH EVERYTHING ───${C.reset}`,
};

const domain = `${C.gray}                                   beast-mode.dev${C.reset}`;

// ============================================================================
// UTILITIES
// ============================================================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const write = (text) => process.stdout.write(text);

const clear = () => write(CLEAR_SCREEN);

const bell = () => write(BELL);

// ============================================================================
// SPINNER ANIMATION
// ============================================================================
async function showSpinner(message, duration = 2000) {
  const frames = spinnerFrames.pulse;
  const startTime = Date.now();
  let i = 0;
  
  write(HIDE_CURSOR);
  
  while (Date.now() - startTime < duration) {
    const frame = frames[i % frames.length];
    write(`\r  ${C.cyan}${frame}${C.reset} ${C.gray}${message}${C.reset}  `);
    await sleep(100);
    i++;
  }
  
  write('\r' + ' '.repeat(message.length + 10) + '\r');
}

// ============================================================================
// INTERACTIVE PROMPT
// ============================================================================
async function waitForKeypress(message) {
  return new Promise((resolve) => {
    write(`\n  ${C.gray}${message}${C.reset}\n\n`);
    
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    process.stdin.once('keypress', (ch, key) => {
      if (key && key.ctrl && key.name === 'c') {
        write(SHOW_CURSOR);
        process.exit();
      }
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      resolve();
    });
  });
}

// ============================================================================
// CREATURE SELECTION
// ============================================================================
async function selectCreature() {
  clear();
  write(HIDE_CURSOR);
  
  const menu = `
${C.cyan}
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║   ${C.yellow}BEAST MODE${C.cyan}                                                   ║
    ║   ${C.gray}beast-mode.dev${C.cyan}                                                 ║
    ║                                                                  ║
    ║   ${C.white}Choose your beast:${C.cyan}                                            ║
    ║                                                                  ║
    ║   ${C.magenta}[1]${C.white} 🦑  KRAKEN    ${C.gray}- Tentacles of terror${C.cyan}                    ║
    ║   ${C.magenta}[2]${C.white} 🦄  NARWHAL   ${C.gray}- Pierce through everything${C.cyan}              ║
    ║   ${C.magenta}[3]${C.white} 🎲  RANDOM    ${C.gray}- Surprise me${C.cyan}                            ║
    ║                                                                  ║
    ║   ${C.gray}Press 1, 2, or 3 to select (or q to quit)${C.cyan}                    ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
${C.reset}
`;
  
  write(menu);
  
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    const handler = (ch, key) => {
      if (key && key.ctrl && key.name === 'c') {
        cleanup();
        process.exit();
      }
      
      if (ch === 'q' || ch === 'Q') {
        cleanup();
        process.exit();
      }
      
      if (ch === '1') {
        process.stdin.removeListener('keypress', handler);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        resolve('kraken');
      } else if (ch === '2') {
        process.stdin.removeListener('keypress', handler);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        resolve('narwhal');
      } else if (ch === '3') {
        process.stdin.removeListener('keypress', handler);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        resolve(Math.random() > 0.5 ? 'kraken' : 'narwhal');
      }
    };
    
    process.stdin.on('keypress', handler);
  });
}

// ============================================================================
// MAIN ANIMATION
// ============================================================================
async function animateCreature(creature) {
  const frames = creature === 'kraken' ? krakenFrames : narwhalFrames;
  const tagline = taglines[creature];
  
  clear();
  write(HIDE_CURSOR);
  
  // Spinner phase - building tension
  await showSpinner('Something stirs in the depths...', 1500);
  await showSpinner('The water grows restless...', 1000);
  await showSpinner('INCOMING...', 500);
  
  // Main animation
  for (let i = 0; i < frames.length; i++) {
    clear();
    write(frames[i]);
    
    // Timing and sound effects
    if (i < 3) {
      await sleep(400);
    } else if (i < 6) {
      await sleep(300);
    } else if (i === frames.length - 1) {
      bell(); // IMPACT!
      await sleep(500);
    } else {
      await sleep(400);
    }
  }
  
  // Flash effect for impact
  for (let flash = 0; flash < 3; flash++) {
    clear();
    await sleep(60);
    write(frames[frames.length - 1]);
    await sleep(100);
  }
  
  bell(); // Second impact for the banner
  
  // Slam in the banner
  await sleep(200);
  clear();
  write(frames[frames.length - 1]);
  write('\n');
  write(beastModeBanner);
  
  await sleep(150);
  write('\n');
  write(tagline);
  
  await sleep(300);
  write('\n\n');
  write(domain);
  write('\n\n');
  
  write(SHOW_CURSOR);
}

// ============================================================================
// INSTANT MODE (no interaction)
// ============================================================================
async function instantMode(creature) {
  await animateCreature(creature);
}

// ============================================================================
// CLEANUP
// ============================================================================
function cleanup() {
  write(SHOW_CURSOR);
  write('\n');
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}

// ============================================================================
// CLI
// ============================================================================
async function main() {
  const args = process.argv.slice(2);
  
  // Handle flags
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${C.cyan}BEAST MODE${C.reset} - Unleash the depths
${C.gray}beast-mode.dev${C.reset}

${C.white}Usage:${C.reset}
  npx beast-mode           Interactive mode (choose your beast)
  npx beast-mode --kraken  Instant kraken
  npx beast-mode --narwhal Instant narwhal
  npx beast-mode --random  Random beast

${C.white}Options:${C.reset}
  --kraken, -k    Summon the kraken
  --narwhal, -n   Summon the narwhal
  --random, -r    Random creature
  --help, -h      Show this help
  --version, -v   Show version
`);
    return;
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('beast-mode v1.0.0');
    return;
  }
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    cleanup();
    process.exit();
  });
  
  // Direct creature flags
  if (args.includes('--kraken') || args.includes('-k')) {
    await instantMode('kraken');
    return;
  }
  
  if (args.includes('--narwhal') || args.includes('-n')) {
    await instantMode('narwhal');
    return;
  }
  
  if (args.includes('--random') || args.includes('-r')) {
    const creature = Math.random() > 0.5 ? 'kraken' : 'narwhal';
    await instantMode(creature);
    return;
  }
  
  // Interactive mode
  try {
    const creature = await selectCreature();
    
    clear();
    await waitForKeypress('Press any key to UNLEASH THE BEAST...');
    
    await animateCreature(creature);
  } catch (err) {
    cleanup();
    // Fallback for non-TTY environments
    await instantMode('kraken');
  }
}

// Export for programmatic use
module.exports = {
  kraken: () => instantMode('kraken'),
  narwhal: () => instantMode('narwhal'),
  random: () => instantMode(Math.random() > 0.5 ? 'kraken' : 'narwhal'),
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
