# BEAST MODE CLI Startup Animations

## Overview

BEAST MODE CLI now automatically shows epic creature animations when you boot up and login! 🦑⚔️

## Automatic Animations

### On First Run
When you run `beast-mode` for the first time (before login), you'll see a random creature animation!

```bash
beast-mode
# Shows random kraken or narwhal animation
```

### On Login
When you run `beast-mode login`, you'll see an epic animation before the login prompt:

```bash
beast-mode login
# Shows animation, then login form
```

### On Startup (After Login)
After you're logged in, animations can still be enabled:

```bash
# Enable startup animations
export BEAST_MODE_STARTUP_ANIMATE=true
beast-mode
```

## Configuration

### Environment Variables

```bash
# Always show animations on startup
export BEAST_MODE_ANIMATE=true

# Show animations on startup (after login)
export BEAST_MODE_STARTUP_ANIMATE=true

# Disable animations
export BEAST_MODE_ANIMATE=false
```

### Command Options

```bash
# Skip animation on login
beast-mode login --skip-animation

# Skip logo on any command
beast-mode --no-logo <command>

# Quiet mode (no animations)
beast-mode --quiet <command>
```

## Login Flow

### First Time User

1. Run `beast-mode` → See random animation
2. Run `beast-mode login` → See animation + login form
3. Enter credentials → Saved to `~/.beast-mode/config.json`
4. Future runs → Check login status, show animations if enabled

### Returning User

1. Run `beast-mode` → Check if logged in
2. If not logged in → Show animation + suggest login
3. If logged in → Show help (or animation if enabled)

## Commands

### Login
```bash
beast-mode login              # Login with animation
beast-mode login --skip-animation  # Login without animation
```

### Logout
```bash
beast-mode logout             # Logout and clear session
```

### Status
```bash
beast-mode status             # Show login status
```

## User Config

Login information is stored in:
```
~/.beast-mode/config.json
```

Example:
```json
{
  "user": {
    "email": "user@example.com",
    "token": "api-key-here",
    "loggedInAt": "2025-12-31T12:00:00.000Z"
  },
  "version": "1.0.0",
  "updatedAt": "2025-12-31T12:00:00.000Z"
}
```

## Customization

### Always Show Animations

Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export BEAST_MODE_ANIMATE=true
```

### Show Animation on Specific Commands

```bash
# Init with animation
beast-mode init --logo-style animate

# Dashboard with animation
BEAST_MODE_ANIMATE=true beast-mode dashboard
```

## Examples

### First Time Setup
```bash
# 1. Run CLI (shows animation)
beast-mode

# 2. Login (shows animation + form)
beast-mode login

# 3. Check status
beast-mode status
```

### Daily Use
```bash
# With startup animations enabled
export BEAST_MODE_STARTUP_ANIMATE=true
beast-mode quality check  # Shows animation on startup
```

### CI/CD (No Animations)
```bash
# Quiet mode for scripts
beast-mode --quiet quality check
```

## Troubleshooting

### Animations Not Showing

```bash
# Check if animations are available
beast-mode artwork gallery

# Should show: kraken, narwhal, random
```

### Disable All Animations

```bash
# Set environment variable
export BEAST_MODE_ANIMATE=false

# Or use --no-logo flag
beast-mode --no-logo <command>
```

### Login Issues

```bash
# Check login status
beast-mode status

# Re-login
beast-mode logout
beast-mode login
```

## Tips

1. **First Run**: Animations show automatically to welcome new users
2. **Login**: Always shows animation for epic experience
3. **Daily Use**: Enable `BEAST_MODE_STARTUP_ANIMATE` for daily motivation
4. **Scripts**: Use `--quiet` or `--no-logo` for automation

---

**UNLEASH THE DEPTHS ON EVERY STARTUP! 🦑⚔️🚀**

