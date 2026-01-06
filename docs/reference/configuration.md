# BEAST MODE Configuration Reference
## Complete Configuration Options

**Configuration Location:** `.beast-mode/config.json`  
**Global Config:** `~/.beast-mode/config.json`

---

## 📁 Configuration Files

### Project Configuration
**Location:** `.beast-mode/config.json` (in your project root)

Project-specific settings that are committed to version control (without secrets).

### User Configuration
**Location:** `~/.beast-mode/config.json`

User-specific settings including API keys and preferences.

---

## ⚙️ Configuration Options

### Basic Configuration

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-project",
    "language": "typescript",
    "framework": "nextjs"
  },
  "apiKey": "bm_live_...",
  "tier": "developer"
}
```

---

### Quality Check Configuration

```json
{
  "quality": {
    "enabled": true,
    "strict": false,
    "autoFix": true,
    "minScore": 60,
    "checks": {
      "linting": true,
      "security": true,
      "performance": true,
      "accessibility": false
    }
  }
}
```

**Options:**
- `enabled` - Enable/disable quality checks
- `strict` - Use strict quality standards
- `autoFix` - Automatically fix issues where possible
- `minScore` - Minimum acceptable quality score (0-100)
- `checks` - Enable/disable specific check types

---

### Day 2 Operations Configuration

```json
{
  "day2Operations": {
    "enabled": true,
    "overnightRefactoring": {
      "enabled": true,
      "schedule": "0 2 * * *", // 2 AM daily
      "maxChanges": 50
    },
    "architectureEnforcement": {
      "enabled": true,
      "strict": false,
      "rules": []
    },
    "vibeOps": {
      "enabled": true,
      "autoTest": true
    }
  }
}
```

**Options:**
- `enabled` - Enable Day 2 Operations
- `overnightRefactoring.enabled` - Enable overnight refactoring
- `overnightRefactoring.schedule` - Cron schedule (default: 2 AM daily)
- `overnightRefactoring.maxChanges` - Maximum changes per run
- `architectureEnforcement.enabled` - Enable architecture enforcement
- `architectureEnforcement.strict` - Block commits that violate rules
- `vibeOps.enabled` - Enable Vibe Ops (plain English testing)

---

### API Configuration

```json
{
  "api": {
    "baseUrl": "https://beastmode.dev/api",
    "timeout": 30000,
    "retries": 3,
    "rateLimit": {
      "enabled": true,
      "maxRequests": 100,
      "windowMs": 60000
    }
  }
}
```

**Options:**
- `baseUrl` - API base URL
- `timeout` - Request timeout in milliseconds
- `retries` - Number of retry attempts
- `rateLimit.enabled` - Enable rate limiting
- `rateLimit.maxRequests` - Max requests per window
- `rateLimit.windowMs` - Time window in milliseconds

---

### Dashboard Configuration

```json
{
  "dashboard": {
    "port": 3001,
    "autoOpen": true,
    "theme": "dark",
    "features": {
      "analytics": true,
      "marketplace": true,
      "janitor": true
    }
  }
}
```

**Options:**
- `port` - Dashboard port (default: 3001)
- `autoOpen` - Automatically open browser
- `theme` - Theme: `dark`, `light`, `auto`
- `features` - Enable/disable dashboard features

---

### Logging Configuration

```json
{
  "logging": {
    "level": "info",
    "format": "json",
    "file": ".beast-mode/logs/beast-mode.log",
    "maxSize": "10MB",
    "maxFiles": 5
  }
}
```

**Options:**
- `level` - Log level: `error`, `warn`, `info`, `debug`
- `format` - Log format: `json`, `text`, `pretty`
- `file` - Log file path
- `maxSize` - Maximum log file size
- `maxFiles` - Maximum number of log files to keep

---

### Artwork & Animations

```json
{
  "artwork": {
    "enabled": true,
    "style": "animate",
    "startupAnimation": true,
    "loginAnimation": true
  }
}
```

**Options:**
- `enabled` - Enable artwork/animations
- `style` - Artwork style: `ascii`, `figlet`, `image`, `minimal`, `animate`
- `startupAnimation` - Show animation on startup
- `loginAnimation` - Show animation on login

---

## 🔐 Security

### API Key Storage

API keys are stored in user config (`~/.beast-mode/config.json`), not project config.

**Never commit API keys to version control!**

The `.beast-mode/` directory should contain:
- ✅ `config.json` (without API keys)
- ✅ `.gitignore` (to exclude secrets)

---

## 🌍 Environment Variables

You can override config with environment variables:

- `BEAST_MODE_API_KEY` - API key
- `BEAST_MODE_TIER` - Subscription tier
- `BEAST_MODE_BASE_URL` - API base URL
- `BEAST_MODE_ANIMATE` - Enable animations
- `BEAST_MODE_QUIET` - Quiet mode

**Example:**
```bash
export BEAST_MODE_API_KEY: process.env.API_KEY || ''
export BEAST_MODE_ANIMATE=true
beast-mode quality check
```

---

## 📝 Example Configurations

### Minimal Configuration
```json
{
  "version": "1.0.0",
  "apiKey": "bm_live_..."
}
```

### Full Configuration
```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-awesome-project",
    "language": "typescript",
    "framework": "nextjs"
  },
  "apiKey": "bm_live_...",
  "tier": "developer",
  "quality": {
    "enabled": true,
    "autoFix": true,
    "minScore": 70
  },
  "day2Operations": {
    "enabled": true,
    "overnightRefactoring": {
      "enabled": true,
      "schedule": "0 2 * * *"
    }
  },
  "dashboard": {
    "port": 3001,
    "autoOpen": true
  }
}
```

---

## 🔄 Configuration Priority

Configuration is loaded in this order (later overrides earlier):

1. Default values
2. User config (`~/.beast-mode/config.json`)
3. Project config (`.beast-mode/config.json`)
4. Environment variables
5. Command-line arguments

---

## 🆘 Troubleshooting

### Configuration not loading
```bash
# Check if config file exists
ls -la .beast-mode/config.json

# Re-initialize
beast-mode init --force
```

### API key not working
```bash
# Check config
cat ~/.beast-mode/config.json

# Re-login
beast-mode logout
beast-mode login
```

---

## 📚 Related Documentation

- [Getting Started Guide](../getting-started/README.md)
- [CLI Reference](./cli-reference.md)
- [API Reference](./api-reference.md)

---

**Last Updated:** January 2026

