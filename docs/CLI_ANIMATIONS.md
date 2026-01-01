# BEAST MODE CLI Animations

## Overview

The BEAST MODE CLI now includes epic animated creature displays! Watch the kraken rise from the depths or the narwhal pierce through everything.

## Quick Start

```bash
# Summon the kraken
beast-mode artwork animate --kraken

# Summon the narwhal
beast-mode artwork animate --narwhal

# Random creature
beast-mode artwork animate --random

# Short flags
beast-mode artwork animate -k  # Kraken
beast-mode artwork animate -n  # Narwhal
beast-mode artwork animate -r  # Random
```

## Integration

### In Commands

Animations are integrated into key commands:

```bash
# Show animation on init
BEAST_MODE_ANIMATE=true beast-mode init

# Or use logo-style
beast-mode init --logo-style animate
```

### Programmatic Use

```javascript
const CLIArtwork = require('@beast-mode/core/lib/cli/artwork');
const artwork = new CLIArtwork();

// Animate creatures
await artwork.animateCreature('kraken');
await artwork.animateCreature('narwhal');
await artwork.animateCreature('random');
```

## Available Creatures

### 🦑 Kraken
Tentacles rise from calm waters, growing more menacing until BEAST MODE activates with the creature in full aggressive display.

**Tagline:** *UNLEASH THE DEPTHS*

### 🦄 Narwhal
A horn breaches the surface, rising higher until the full narwhal emerges, horn blazing with power.

**Tagline:** *PIERCE THROUGH EVERYTHING*

## Features

- 🎬 **Smooth frame-by-frame animation** - Watch creatures emerge from the depths
- 🌊 **Loading spinner** - Builds tension before the reveal
- 🔔 **Terminal bell** - Audio impact on the dramatic moments
- 🎨 **Full ANSI color** - Ocean blues, beast reds, golden accents
- ⌨️ **Interactive mode** - Choose your beast, press to unleash
- 🚀 **Zero dependencies** - Just Node.js built-ins

## Usage Examples

### Command Line

```bash
# Direct creature summon
beast-mode artwork animate --kraken
beast-mode artwork animate --narwhal
beast-mode artwork animate --random

# Short flags
beast-mode artwork animate -k
beast-mode artwork animate -n
beast-mode artwork animate -r

# In other commands
beast-mode init --logo-style animate
beast-mode dashboard  # Can show animation on launch
```

### In Code

```javascript
const { CLIArtwork } = require('@beast-mode/core');

const artwork = new CLIArtwork();

// Animate before important operations
await artwork.animateCreature('kraken');
console.log('BEAST MODE ACTIVATED!');
```

## Animation Sequence

1. **Spinner Phase** - "Something stirs in the depths..."
2. **Tension Build** - "The water grows restless..."
3. **Warning** - "INCOMING..."
4. **Creature Emergence** - Frame-by-frame animation
5. **BEAST MODE Banner** - Final reveal with tagline

## Customization

### Environment Variables

```bash
# Enable animations by default
export BEAST_MODE_ANIMATE=true

# Disable animations
export BEAST_MODE_ANIMATE=false
```

### Command Options

```bash
# Skip animations
beast-mode init --no-logo

# Use specific logo style
beast-mode init --logo-style ascii  # Default
beast-mode init --logo-style animate  # Animation
beast-mode init --logo-style figlet  # Figlet banner
```

## Technical Details

### Animation System

- Uses ANSI escape codes for colors and cursor control
- Frame arrays with ASCII art for each animation step
- Variable timing for dramatic pacing
- Terminal bell (`\x07`) for audio impact

### File Location

```
BEAST-MODE-PRODUCT/
└── lib/
    └── cli/
        └── animations/
            └── beast-creatures.js  # Animation engine
```

### Dependencies

- **Zero dependencies** - Uses only Node.js built-ins
- `readline` - For interactive mode
- ANSI escape codes - For colors and terminal control

## Troubleshooting

### Animations Not Showing

```bash
# Check if animations are available
beast-mode artwork gallery

# Should show "Animations: kraken, narwhal, random"
```

### Terminal Compatibility

Animations work best in:
- ✅ iTerm2 (macOS)
- ✅ Terminal.app (macOS)
- ✅ Windows Terminal
- ✅ Most modern terminals with ANSI support

### Disable Animations

```bash
# Use --no-logo flag
beast-mode init --no-logo

# Or set environment variable
BEAST_MODE_ANIMATE=false beast-mode init
```

## Examples

### CI/CD Integration

```bash
# Show animation on successful build
if [ $? -eq 0 ]; then
    beast-mode artwork animate --kraken
fi
```

### Pre-commit Hook

```bash
#!/bin/bash
# Show narwhal before commit
beast-mode artwork animate --narwhal
git commit "$@"
```

### Celebration Script

```bash
#!/bin/bash
# Random creature for celebrations
beast-mode artwork animate --random
echo "🎉 BEAST MODE ACTIVATED! 🎉"
```

## Credits

Animation system inspired by the epic creature animations from beast-mode.dev.

---

**UNLEASH THE DEPTHS! 🦑⚔️🚀**

