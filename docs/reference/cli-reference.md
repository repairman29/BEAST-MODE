# BEAST MODE CLI Reference
## Complete Command-Line Interface Documentation

**Version:** 1.0.0  
**Installation:** `npm install -g @beast-mode/core`

---

## 📦 Installation

```bash
npm install -g @beast-mode/core
```

Verify installation:
```bash
beast-mode --version
```

---

## 🚀 Quick Start

```bash
# Initialize in your project
beast-mode init

# Login
beast-mode login

# Run quality check
beast-mode quality check

# Launch dashboard
beast-mode dashboard --open
```

---

## 📋 Commands

### Authentication

#### `beast-mode login`
Login to BEAST MODE with epic animations!

**Options:**
- `--skip-animation` - Skip login animation

**Example:**
```bash
beast-mode login
```

---

#### `beast-mode logout`
Logout and clear session.

**Example:**
```bash
beast-mode logout
```

---

#### `beast-mode status`
Show login status and user information.

**Example:**
```bash
beast-mode status
```

---

### Project Setup

#### `beast-mode init`
Initialize BEAST MODE in the current project.

**Options:**
- `-f, --force` - Force initialization (overwrite existing config)
- `-e, --enterprise` - Initialize with enterprise features
- `--logo-style <style>` - Logo style: `ascii`, `figlet`, `image`, `minimal`, `animate`

**Example:**
```bash
beast-mode init
beast-mode init --enterprise
beast-mode init --logo-style animate
```

Creates `.beast-mode/` directory with configuration.

---

### Quality Checks

#### `beast-mode quality check`
Run quality check on your codebase.

**Options:**
- `--fix` - Auto-fix issues where possible
- `--strict` - Use strict quality standards
- `--format <format>` - Output format: `json`, `table`, `summary`

**Example:**
```bash
beast-mode quality check
beast-mode quality check --fix
beast-mode quality check --format json
```

---

#### `beast-mode quality score`
Get your current quality score (0-100).

**Example:**
```bash
beast-mode quality score
```

---

#### `beast-mode quality audit`
Run comprehensive quality audit.

**Options:**
- `--full` - Full audit (slower, more thorough)
- `--report` - Generate detailed report

**Example:**
```bash
beast-mode quality audit
beast-mode quality audit --full --report
```

---

### Dashboard

#### `beast-mode dashboard`
Launch the BEAST MODE dashboard.

**Options:**
- `-p, --port <port>` - Port to run dashboard on (default: 3001)
- `-o, --open` - Open dashboard in browser automatically

**Example:**
```bash
beast-mode dashboard
beast-mode dashboard --port 8080 --open
```

---

### Day 2 Operations (AI Janitor)

#### `beast-mode janitor enable`
Enable Day 2 Operations features.

**Options:**
- `--overnight` - Enable overnight refactoring
- `--architecture` - Enable architecture enforcement
- `--vibe-ops` - Enable Vibe Ops (plain English testing)

**Example:**
```bash
beast-mode janitor enable --overnight
beast-mode janitor enable --overnight --architecture
```

---

#### `beast-mode janitor status`
Check Day 2 Operations status.

**Example:**
```bash
beast-mode janitor status
```

---

#### `beast-mode janitor disable`
Disable Day 2 Operations features.

**Example:**
```bash
beast-mode janitor disable
```

---

### Intelligence

#### `beast-mode intelligence analyze`
Run AI-powered codebase analysis.

**Options:**
- `--deep` - Deep analysis (slower, more thorough)
- `--format <format>` - Output format

**Example:**
```bash
beast-mode intelligence analyze
beast-mode intelligence analyze --deep
```

---

#### `beast-mode intelligence recommendations`
Get AI-powered recommendations.

**Example:**
```bash
beast-mode intelligence recommendations
```

---

### Marketplace

#### `beast-mode marketplace browse`
Browse available plugins.

**Options:**
- `--category <category>` - Filter by category
- `--popular` - Show popular plugins only

**Example:**
```bash
beast-mode marketplace browse
beast-mode marketplace browse --category linting
```

---

#### `beast-mode marketplace install <plugin>`
Install a plugin.

**Example:**
```bash
beast-mode marketplace install eslint-plugin-beast
```

---

### Artwork & Animations

#### `beast-mode artwork gallery`
Show artwork gallery.

**Example:**
```bash
beast-mode artwork gallery
```

---

#### `beast-mode artwork animate`
Show creature animations.

**Options:**
- `--kraken` - Show kraken animation
- `--narwhal` - Show narwhal animation
- `--random` - Show random creature

**Example:**
```bash
beast-mode artwork animate --kraken
beast-mode artwork animate --random
```

---

## 🔧 Global Options

All commands support these global options:

- `--help, -h` - Show help
- `--version, -v` - Show version
- `--quiet, -q` - Quiet mode (minimal output)
- `--verbose` - Verbose mode (detailed output)
- `--no-logo` - Don't show logo
- `--logo-style <style>` - Logo style

**Example:**
```bash
beast-mode quality check --quiet
beast-mode --version
```

---

## 🌍 Environment Variables

- `BEAST_MODE_API_KEY` - API key (alternative to login)
- `BEAST_MODE_ANIMATE` - Enable animations (`true`/`false`)
- `BEAST_MODE_STARTUP_ANIMATE` - Enable startup animations
- `BEAST_MODE_QUIET` - Quiet mode by default

**Example:**
```bash
export BEAST_MODE_API_KEY: process.env.API_KEY || ''
export BEAST_MODE_ANIMATE=true
beast-mode quality check
```

---

## 📝 Configuration

Configuration is stored in `.beast-mode/config.json`:

```json
{
  "apiKey": "bm_live_...",
  "tier": "developer",
  "features": {
    "day2Operations": true,
    "overnightRefactoring": true
  }
}
```

See [Configuration Reference](./configuration.md) for complete options.

---

## 🆘 Troubleshooting

### Command not found
```bash
# Reinstall globally
npm install -g @beast-mode/core

# Verify installation
which beast-mode
beast-mode --version
```

### Authentication errors
```bash
# Re-login
beast-mode logout
beast-mode login

# Or set API key
export BEAST_MODE_API_KEY: process.env.API_KEY || ''
```

### Quality check fails
```bash
# Check if project is initialized
ls -la .beast-mode/

# Re-initialize
beast-mode init --force
```

---

## 📚 Related Documentation

- [Getting Started Guide](../getting-started/README.md)
- [API Reference](./api-reference.md)
- [Configuration Reference](./configuration.md)
- [Troubleshooting Guide](../guides/troubleshooting.md)

---

**Last Updated:** January 2026

