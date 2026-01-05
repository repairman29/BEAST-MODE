# BEAST MODE CLI Documentation

Complete command-line interface reference for BEAST MODE.

## Installation

```bash
npm install -g @beast-mode/core
```

## Quick Start

```bash
# Initialize BEAST MODE in your project
beast-mode init

# Run quality checks
beast-mode quality check

# Launch dashboard
beast-mode dashboard
```

## Commands

### `beast-mode login`

Login to BEAST MODE with epic animations!

**Options:**
- `--skip-animation` - Skip login animation

**Example:**
```bash
beast-mode login
```

Shows a random creature animation (kraken or narwhal) before the login form. Saves credentials to `~/.beast-mode/config.json`.

### `beast-mode logout`

Logout from BEAST MODE and clear session.

**Example:**
```bash
beast-mode logout
```

### `beast-mode status`

Show login status and user information.

**Example:**
```bash
beast-mode status
```

### `beast-mode init`

Initialize BEAST MODE in the current project.

**Options:**
- `-f, --force` - Force initialization (overwrite existing config)
- `-e, --enterprise` - Initialize with enterprise features
- `--logo-style <style>` - Logo style: `ascii`, `figlet`, `image`, `minimal`, `animate`

**Example:**
```bash
beast-mode init --enterprise
beast-mode init --logo-style animate  # Show animation on init
```

Creates `.beast-mode/` directory with configuration. Shows welcome banner by default.

### `beast-mode dashboard`

Launch the BEAST MODE quality intelligence dashboard.

**Options:**
- `-p, --port <port>` - Port to run dashboard on (default: 3001)
- `-o, --open` - Open dashboard in browser automatically

**Example:**
```bash
beast-mode dashboard --port 8080 --open
```

### `beast-mode repos`

Manage GitHub repository connections via CLI.

#### `beast-mode repos status`

Check GitHub connection status.

**Example:**
```bash
beast-mode repos status
```

Shows whether GitHub is connected and displays username.

#### `beast-mode repos connect`

Connect GitHub account via OAuth (opens browser).

**Example:**
```bash
beast-mode repos connect
```

Opens browser for GitHub authorization, then saves connection automatically.

#### `beast-mode repos list`

List all connected repositories from GitHub.

**Example:**
```bash
beast-mode repos list
```

Shows all repositories from your GitHub account, plus any manually added enterprise repos.

#### `beast-mode repos add`

Add repository manually (without GitHub OAuth).

**Options:**
- `-t, --team <team>` - Team name for the repository

**Example:**
```bash
beast-mode repos add https://github.com/user/repo --team Engineering
```

#### `beast-mode repos remove`

Remove a repository.

**Example:**
```bash
beast-mode repos remove <id>
```

Get repository ID from `beast-mode repos list`.

#### `beast-mode repos disconnect`

Disconnect GitHub account.

**Example:**
```bash
beast-mode repos disconnect
```

---

### `beast-mode quality`

Quality assurance operations.

#### `beast-mode quality check`

Run comprehensive quality checks.

**Options:**
- `-f, --fix` - Auto-fix issues when possible
- `-r, --report` - Generate detailed quality report

**Example:**
```bash
beast-mode quality check --fix --report
```

#### `beast-mode quality score`

Calculate BEAST MODE quality score.

**Options:**
- `-d, --detailed` - Show detailed scoring breakdown
- `-t, --trend` - Show quality trend over time

**Example:**
```bash
beast-mode quality score --detailed
```

#### `beast-mode quality audit`

Perform comprehensive quality audit.

**Options:**
- `-s, --scope <scope>` - Audit scope: `repo`, `team`, or `org` (default: `repo`)
- `-o, --output <file>` - Save audit report to file

**Example:**
```bash
beast-mode quality audit --scope org --output audit-report.json
```

### `beast-mode intelligence`

AI intelligence operations.

#### `beast-mode intelligence analyze`

Run organization quality intelligence analysis.

**Options:**
- `-t, --type <type>` - Analysis type: `quality`, `team`, or `repo` (default: `quality`)
- `-d, --deep` - Perform deep analysis (slower but more detailed)

**Example:**
```bash
beast-mode intelligence analyze --type team --deep
```

#### `beast-mode intelligence predict`

Run predictive analytics.

**Options:**
- `-m, --metric <metric>` - Metric to predict: `quality`, `velocity`, or `bugs` (default: `quality`)
- `-h, --horizon <days>` - Prediction horizon in days (default: 30)

**Example:**
```bash
beast-mode intelligence predict --metric velocity --horizon 60
```

#### `beast-mode intelligence optimize`

Run team performance optimization.

**Options:**
- `-t, --team <team>` - Team to optimize
- `-a, --auto` - Apply optimizations automatically

**Example:**
```bash
beast-mode intelligence optimize --team core-team --auto
```

#### `beast-mode intelligence knowledge`

Manage enterprise knowledge.

**Options:**
- `-s, --search <query>` - Search knowledge base
- `-c, --capture` - Capture new knowledge

**Example:**
```bash
beast-mode intelligence knowledge --search "code review best practices"
```

### `beast-mode artwork`

BEAST MODE artwork and visual assets management.

#### `beast-mode artwork gallery`

Display artwork gallery showing all available artwork files.

**Example:**
```bash
beast-mode artwork gallery
```

#### `beast-mode artwork show <name>`

Display specific artwork file.

**Options:**
- `-t, --type <type>` - Artwork type: `image`, `ascii`, `banner` (default: `ascii`)
- `-c, --color <color>` - Color for ASCII/banner (default: `magenta`)
- `-a, --animate` - Animate display (line-by-line reveal)

**Example:**
```bash
beast-mode artwork show epic-banner.txt --type ascii --color cyan
beast-mode artwork show logo.png --type image
```

#### `beast-mode artwork logo`

Display BEAST MODE logo with different styles.

**Options:**
- `-s, --style <style>` - Logo style: `ascii`, `figlet`, `image`, `minimal` (default: `ascii`)
- `-c, --color <color>` - Logo color (default: `magenta`)
- `-a, --animate` - Animate logo display

**Example:**
```bash
beast-mode artwork logo --style figlet --color cyan
beast-mode artwork logo --style animate  # Show creature animation
```

#### `beast-mode artwork animate`

Display animated beast creatures (kraken or narwhal).

**Options:**
- `-k, --kraken` - Summon the kraken 🦑
- `-n, --narwhal` - Summon the narwhal 🦄
- `-r, --random` - Random creature 🎲

**Example:**
```bash
beast-mode artwork animate --kraken
beast-mode artwork animate -n  # Narwhal
beast-mode artwork animate -r  # Random
```

**Features:**
- 🎬 Smooth frame-by-frame animation
- 🌊 Loading spinner builds tension
- 🔔 Terminal bell for dramatic moments
- 🎨 Full ANSI color support
- 🚀 Zero dependencies (Node.js built-ins only)

### `beast-mode marketplace`

Marketplace operations.

#### `beast-mode marketplace browse`

Browse available plugins and integrations.

**Options:**
- `-c, --category <category>` - Filter by category
- `-t, --type <type>` - Type: `plugin`, `integration`, or `tool` (default: `plugin`)

**Example:**
```bash
beast-mode marketplace browse --category linting --type plugin
```

#### `beast-mode marketplace install`

Install plugin or integration.

**Arguments:**
- `<id>` - Plugin/integration ID to install

**Options:**
- `-v, --version <version>` - Specific version to install

**Example:**
```bash
beast-mode marketplace install eslint-beast-mode --version 2.1.0
```

#### `beast-mode marketplace publish`

Publish plugin or integration to marketplace.

**Arguments:**
- `<path>` - Path to plugin/integration package

**Options:**
- `-t, --type <type>` - Type: `plugin` or `integration` (default: `plugin`)
- `-p, --price <price>` - Price (0 for free, default: 0)

**Example:**
```bash
beast-mode marketplace publish ./my-plugin --type plugin --price 9.99
```

#### `beast-mode marketplace status`

Check marketplace status and earnings.

**Example:**
```bash
beast-mode marketplace status
```

### `beast-mode dev`

Development and testing commands.

#### `beast-mode dev server`

Start BEAST MODE development server.

**Options:**
- `-p, --port <port>` - Port to run on (default: 3000)

**Example:**
```bash
beast-mode dev server --port 3001
```

#### `beast-mode dev test`

Run BEAST MODE test suite.

**Options:**
- `-w, --watch` - Watch mode
- `-c, --coverage` - Generate coverage report

**Example:**
```bash
beast-mode dev test --coverage
```

### `beast-mode enterprise`

Enterprise-grade features (requires enterprise license).

#### `beast-mode enterprise analytics`

Enterprise analytics dashboard.

**Options:**
- `-r, --real-time` - Enable real-time updates

**Example:**
```bash
beast-mode enterprise analytics --real-time
```

#### `beast-mode enterprise integrations`

Manage enterprise integrations.

**Options:**
- `-l, --list` - List current integrations
- `-a, --add <service>` - Add integration for service

**Example:**
```bash
beast-mode enterprise integrations --list
beast-mode enterprise integrations --add jira
```

### `beast-mode info`

Show BEAST MODE system information.

**Example:**
```bash
beast-mode info
```

Displays version, capabilities, and system status.

## Global Options

All commands support these global options:

- `-d, --debug` - Enable debug mode
- `-q, --quiet` - Quiet mode (minimal output)
- `--no-color` - Disable colored output
- `-v, --version` - Show version number
- `-h, --help` - Show help for command

## Configuration

BEAST MODE configuration is stored in `.beast-mode/config.json`:

```json
{
  "version": "1.0.0",
  "enterprise": false,
  "features": {
    "quality": true,
    "marketplace": true,
    "intelligence": true
  },
  "integrations": {
    "github": null,
    "vercel": null
  }
}
```

## Global Options

- `-d, --debug` - Enable debug mode
- `-q, --quiet` - Quiet mode (minimal output, no animations)
- `--no-color` - Disable colored output
- `--logo-style <style>` - Logo style: `ascii`, `figlet`, `image`, `minimal`, `animate`
- `--no-logo` - Skip logo/artwork display

## Environment Variables

- `BEAST_MODE_API_KEY` - API key for authentication
- `BEAST_MODE_ENDPOINT` - Custom API endpoint
- `BEAST_MODE_DEBUG` - Enable debug logging
- `BEAST_MODE_QUIET` - Quiet mode
- `BEAST_MODE_ANIMATE` - Always show animations (`true`/`false`)
- `BEAST_MODE_STARTUP_ANIMATE` - Show animations on startup (`true`/`false`)

## Examples

### Complete Workflow

```bash
# Login with epic animation
beast-mode login

# Initialize (shows welcome banner)
beast-mode init

# Check quality
beast-mode quality check --fix

# Get score
beast-mode quality score --detailed

# Browse plugins
beast-mode marketplace browse --category linting

# Install plugin
beast-mode marketplace install eslint-beast-mode

# Run intelligence analysis
beast-mode intelligence analyze --type quality --deep

# Launch dashboard
beast-mode dashboard --open

# See artwork gallery
beast-mode artwork gallery

# Summon epic creatures
beast-mode artwork animate --kraken
```

### CI/CD Integration

```bash
# In your CI pipeline
beast-mode quality check --report > quality-report.json
beast-mode quality score --trend
```

### Enterprise Usage

```bash
# Enterprise analytics
beast-mode enterprise analytics --real-time

# Manage integrations
beast-mode enterprise integrations --list
```

## Troubleshooting

### Command not found

If `beast-mode` command is not found:

```bash
npm install -g @beast-mode/core
```

Or use npx:

```bash
npx @beast-mode/core init
```

### Permission errors

On Linux/Mac, you may need to use `sudo`:

```bash
sudo npm install -g @beast-mode/core
```

### Configuration issues

Reset configuration:

```bash
rm -rf .beast-mode
beast-mode init --force
```

## Support

- **Documentation**: https://beastmode.dev/docs
- **CLI Help**: `beast-mode --help` or `beast-mode <command> --help`
- **Support**: support@beastmode.dev

