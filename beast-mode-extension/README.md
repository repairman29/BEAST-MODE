# BEAST MODE VS Code Extension

Enterprise Quality Intelligence Platform for VS Code

## Features

- 🛡️ **Secret Interceptor** - Prevents committing secrets and sensitive data
- 🏗️ **Architecture Enforcement** - Prevents bad patterns and anti-patterns
- ✨ **Self-Healing** - Automated quality improvement
- 🧠 **Oracle Integration** - AI context and knowledge search

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or build from source:
   ```bash
   npm install
   npm run compile
   # Press F5 in VS Code to launch extension host
   ```

## Usage

### Command Palette

Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) and type "BEAST MODE":

- `BEAST MODE: Check for Secrets` - Check staged files
- `BEAST MODE: Install Pre-Commit Hook` - Install git hook
- `BEAST MODE: Check Architecture` - Check current file
- `BEAST MODE: Show Quality Panel` - Show quality metrics
- `BEAST MODE: Run Self-Healing` - Improve code quality
- `BEAST MODE: Oracle AI Chat` - AI context panel

### Status Bar

Click the 🛡️ BEAST MODE icon in the status bar to see status.

## Configuration

Open VS Code settings and search for "BEAST MODE":

- `beast-mode.enabled` - Enable/disable all features
- `beast-mode.interceptor.enabled` - Enable secret interceptor
- `beast-mode.architecture.enabled` - Enable architecture enforcement
- `beast-mode.quality.enabled` - Enable quality tracking
- `beast-mode.oracle.enabled` - Enable Oracle AI

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18+ (for pre-commit hooks)
- BEAST MODE API (optional, for advanced features)

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

## License

Proprietary - BEAST MODE Enterprise
