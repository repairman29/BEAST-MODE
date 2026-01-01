# BEAST MODE CLI Artwork Assets

This directory contains artwork and visual assets for the BEAST MODE CLI.

## Directory Structure

```
assets/cli/
├── images/      # Image files (PNG, JPG, GIF) - will be converted to ASCII
├── ascii/       # ASCII art text files (.txt)
└── banners/     # Banner configurations and templates
```

## Adding Artwork

### Images
- Place image files (PNG, JPG, GIF) in `images/`
- Supported formats: PNG, JPG, JPEG, GIF
- Recommended size: 200-400px width for best ASCII conversion
- The CLI will automatically convert these to ASCII art when displayed

### ASCII Art
- Create text files with ASCII art in `ascii/`
- Use `.txt` extension
- Can include ANSI color codes for colored output
- Example: `logo.txt`, `banner.txt`

### Banners
- Place banner templates or configurations in `banners/`
- Can be text files or JSON configurations
- Used for dynamic banner generation

## Usage

The CLI will automatically use artwork from these directories:

```bash
# Display logo with default ASCII art
beast-mode --logo

# Display logo with image (if available)
beast-mode --logo --style image

# Display artwork gallery
beast-mode artwork gallery

# Display specific artwork
beast-mode artwork show logo.txt
```

## Tips

1. **Image Quality**: Higher contrast images work better for ASCII conversion
2. **File Size**: Keep images under 1MB for faster loading
3. **ASCII Art**: Use monospace fonts when creating ASCII art
4. **Colors**: The CLI supports ANSI color codes in ASCII files

## Credits

Add credits for artwork contributors here!

