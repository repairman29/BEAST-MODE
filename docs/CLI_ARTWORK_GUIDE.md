# BEAST MODE CLI Artwork Guide

## Overview

The BEAST MODE CLI now supports artwork and visual assets! Add your friend's artwork, custom ASCII art, and images to make the CLI experience more engaging and personalized.

## Quick Start

### 1. Add Your Artwork

Place artwork files in the appropriate directories:

```bash
# Images (PNG, JPG, GIF)
assets/cli/images/your-logo.png

# ASCII Art (text files)
assets/cli/ascii/custom-banner.txt

# Banner configurations
assets/cli/banners/custom-banner.json
```

### 2. Display Artwork

```bash
# Show artwork gallery
beast-mode artwork gallery

# Display specific artwork
beast-mode artwork show logo.txt --type ascii --color magenta

# Display logo with different styles
beast-mode artwork logo --style figlet --color cyan
beast-mode artwork logo --style image
beast-mode artwork logo --style minimal
```

### 3. Use in Commands

Artwork is automatically integrated into key commands:

- `beast-mode init` - Shows welcome banner
- `beast-mode dashboard` - Shows launch banner
- `beast-mode info` - Shows logo with system info
- `beast-mode quality check` - Can show success/failure artwork

## Artwork Types

### Images
- **Formats**: PNG, JPG, JPEG, GIF
- **Location**: `assets/cli/images/`
- **Display**: Converted to terminal-friendly format
- **Requirements**: Install `terminal-image` for full support

### ASCII Art
- **Format**: Plain text files (`.txt`)
- **Location**: `assets/cli/ascii/`
- **Features**:
  - Colored output (via options)
  - Animated display (line-by-line reveal)
  - ANSI color code support

### Banners
- **Format**: Text files or JSON configs
- **Location**: `assets/cli/banners/`
- **Features**: Dynamic banner generation with figlet

## Examples

### Custom ASCII Art File

Create `assets/cli/ascii/custom-banner.txt`:

```
╔═══════════════════════════════════════╗
║                                       ║
║      YOUR CUSTOM BANNER HERE          ║
║                                       ║
╚═══════════════════════════════════════╝
```

Display it:
```bash
beast-mode artwork show custom-banner.txt --type ascii --color cyan
```

### Using Images

1. Add image to `assets/cli/images/logo.png`
2. Display it:
```bash
beast-mode artwork show logo.png --type image
```

### Figlet Banners

Generate dynamic banners:
```bash
beast-mode artwork show "BEAST MODE" --type banner --color magenta
```

## Integration Points

### Command Integration

Artwork is integrated into these commands:

1. **Init Command**: Shows welcome banner
2. **Dashboard Command**: Shows launch banner
3. **Info Command**: Shows logo
4. **Quality Commands**: Can show success/failure artwork (coming soon)

### Customization

You can customize artwork display:

```bash
# Skip logo
beast-mode --no-logo init

# Change logo style
beast-mode --logo-style figlet init

# Quiet mode (no artwork)
beast-mode --quiet init
```

## Adding Your Friend's Artwork

### Step 1: Prepare Files

1. **Images**: Convert to PNG/JPG, optimize for web (200-400px width recommended)
2. **ASCII Art**: Create text files with your artwork
3. **Banners**: Create banner templates

### Step 2: Place Files

```bash
# Copy images
cp /path/to/friend/artwork/*.png assets/cli/images/

# Copy ASCII art
cp /path/to/friend/ascii/*.txt assets/cli/ascii/

# Copy banners
cp /path/to/friend/banners/*.txt assets/cli/banners/
```

### Step 3: Test

```bash
# List all artwork
beast-mode artwork gallery

# Test display
beast-mode artwork show your-artwork.png --type image
beast-mode artwork show your-banner.txt --type ascii
```

### Step 4: Use in Commands

The artwork will automatically be used in:
- Welcome screens
- Command outputs
- Success/failure messages

## Advanced Features

### Animated Display

```bash
# Animate ASCII art (line-by-line reveal)
beast-mode artwork show banner.txt --type ascii --animate
```

### Color Customization

```bash
# Use different colors
beast-mode artwork logo --color cyan
beast-mode artwork logo --color magenta
beast-mode artwork logo --color yellow
```

### Multiple Styles

```bash
# ASCII art (default)
beast-mode artwork logo --style ascii

# Figlet generated
beast-mode artwork logo --style figlet

# Image (if available)
beast-mode artwork logo --style image

# Minimal
beast-mode artwork logo --style minimal
```

## File Structure

```
BEAST-MODE-PRODUCT/
├── assets/
│   └── cli/
│       ├── images/          # Image files
│       │   ├── logo.png
│       │   └── banner.png
│       ├── ascii/           # ASCII art files
│       │   ├── logo.txt
│       │   └── banner.txt
│       └── banners/          # Banner configs
│           └── custom.json
└── lib/
    └── cli/
        └── artwork.js       # Artwork utilities
```

## Tips

1. **Image Quality**: Higher contrast images work better for terminal display
2. **File Size**: Keep images under 1MB for faster loading
3. **ASCII Art**: Use monospace fonts when creating ASCII art
4. **Colors**: The CLI supports ANSI color codes in ASCII files
5. **Testing**: Test artwork on different terminals (iTerm2, Terminal.app, etc.)

## Troubleshooting

### Images Not Displaying

```bash
# Install terminal-image for image support
npm install terminal-image

# Or use ASCII art instead
beast-mode artwork show logo.txt --type ascii
```

### Artwork Not Found

```bash
# Check file location
ls -la assets/cli/images/
ls -la assets/cli/ascii/

# List available artwork
beast-mode artwork gallery
```

### Color Issues

```bash
# Disable colors if terminal doesn't support
beast-mode --no-color artwork logo

# Or specify color explicitly
beast-mode artwork logo --color white
```

## Next Steps

1. **Add Your Artwork**: Place files in the appropriate directories
2. **Test Display**: Use `beast-mode artwork gallery` to see what's available
3. **Customize**: Adjust colors, styles, and animations to your preference
4. **Share**: Your artwork will be included when you publish/commit!

## Credits

Add credits for artwork contributors in `assets/cli/README.md`!

---

**Ready to make BEAST MODE look amazing? Add your artwork and let's vibe code! 🎨⚔️🚀**

