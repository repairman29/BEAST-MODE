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

### `beast-mode init`

Initialize BEAST MODE in the current project.

**Options:**
- `-f, --force` - Force initialization (overwrite existing config)
- `-e, --enterprise` - Initialize with enterprise features

**Example:**
```bash
beast-mode init --enterprise
```

Creates `.beast-mode/` directory with configuration.

### `beast-mode dashboard`

Launch the BEAST MODE quality intelligence dashboard.

**Options:**
- `-p, --port <port>` - Port to run dashboard on (default: 3001)
- `-o, --open` - Open dashboard in browser automatically

**Example:**
```bash
beast-mode dashboard --port 8080 --open
```

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

## Environment Variables

- `BEAST_MODE_API_KEY` - API key for authentication
- `BEAST_MODE_ENDPOINT` - Custom API endpoint
- `BEAST_MODE_DEBUG` - Enable debug logging
- `BEAST_MODE_QUIET` - Quiet mode

## Examples

### Complete Workflow

```bash
# Initialize
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

