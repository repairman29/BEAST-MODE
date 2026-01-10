# BEAST MODE Plugin System Guide

## 🎯 Overview

BEAST MODE's plugin system allows you to extend functionality, install tools, and create custom integrations. This guide covers installation, usage, management, and expansion.

---

## 📦 Installing Plugins

### From the Marketplace

1. **Browse Plugins**
   - Go to the Marketplace tab
   - Search or filter by category
   - View plugin details (rating, downloads, description)

2. **Install Plugin**
   - Click "Install" on any plugin
   - Plugin is installed instantly
   - Configuration can be set during install or later

3. **Verify Installation**
   - Check "Installed Plugins" section
   - Plugin appears with "Installed" badge

### Installation Features

- ✅ One-click installation
- ✅ Configuration options during install
- ✅ Automatic dependency resolution
- ✅ Installation status tracking
- ✅ Persistent storage (localStorage + API)

---

## ⚙️ Managing Plugins

### Enable/Disable Plugins

1. Go to Marketplace tab
2. Scroll to "Installed Plugins" section
3. Toggle the switch to enable/disable
4. Changes take effect immediately

### Configure Plugins

1. Click "⚙️ Configure" on any installed plugin
2. View/edit configuration JSON
3. Changes are saved automatically
4. Plugin reloads with new settings

### View Usage Guides

1. Click "📖 Usage Guide" on any installed plugin
2. See command examples
3. View documentation links
4. Copy commands to clipboard

### Uninstall Plugins

1. Click "🗑️ Uninstall" on any installed plugin
2. Confirm uninstallation
3. Plugin is removed from your account
4. Configuration is preserved (for reinstall)

---

## 🚀 Using Plugins

### Command-Line Usage

Most plugins add CLI commands to BEAST MODE:

```bash
# ESLint Pro
beast-mode lint
beast-mode lint --fix
beast-mode lint --format json

# TypeScript Guardian
beast-mode typecheck
beast-mode typecheck --watch

# Security Scanner
beast-mode security scan
beast-mode security scan --severity high

# Prettier Integration
beast-mode format
beast-mode format --write

# Test Coverage
beast-mode test coverage
beast-mode test coverage --threshold 90
```

### Programmatic Usage

Plugins can also be used programmatically:

```javascript
// In your code
const { runPlugin } = require('@beast-mode/core');

// Run ESLint Pro
await runPlugin('eslint-pro', {
  files: ['./src/**/*.ts'],
  fix: true
});

// Run Security Scanner
await runPlugin('security-scanner', {
  severity: 'high',
  autoFix: false
});
```

---

## 🔧 Plugin Configuration

### Configuration Schema

Each plugin defines a configuration schema:

```json
{
  "rules": {},
  "extends": ["eslint:recommended"],
  "env": { "node": true, "es6": true }
}
```

### Setting Configuration

1. **During Installation**
   - Configuration options shown in install modal
   - Set defaults or customize

2. **After Installation**
   - Go to Marketplace → Installed Plugins
   - Click "Configure"
   - Edit JSON configuration
   - Save automatically

### Configuration Examples

**ESLint Pro:**
```json
{
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error"
  },
  "extends": ["eslint:recommended", "@typescript-eslint/recommended"]
}
```

**Security Scanner:**
```json
{
  "severity": "high",
  "autoFix": false,
  "exclude": ["node_modules/**"]
}
```

---

## 🛠️ Creating Plugins

### Plugin Structure

A BEAST MODE plugin is a JavaScript/TypeScript module:

```javascript
// my-plugin/index.js
module.exports = {
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Does something awesome',
  
  // Configuration schema
  configSchema: {
    option1: { type: 'string', default: 'value' },
    option2: { type: 'boolean', default: true }
  },
  
  // Execution handler
  execute: async (config, context) => {
    // Your plugin logic here
    return { success: true, result: 'Done!' };
  }
};
```

### Plugin Types

1. **Command Plugins**
   - Add CLI commands
   - Example: `beast-mode my-command`

2. **Quality Analyzers**
   - Analyze code quality
   - Example: Custom lint rules

3. **Integrations**
   - Connect external tools
   - Example: GitHub Actions, Slack

4. **Automations**
   - Automate workflows
   - Example: Auto-deploy, auto-test

### Plugin Development Steps

1. **Create Plugin Directory**
   ```bash
   mkdir my-beast-mode-plugin
   cd my-beast-mode-plugin
   npm init -y
   ```

2. **Define Plugin Structure**
   ```javascript
   // index.js
   module.exports = {
     id: 'my-plugin',
     name: 'My Plugin',
     version: '1.0.0',
     description: 'Plugin description',
     category: 'quality',
     configSchema: { /* ... */ },
     execute: async (config, context) => { /* ... */ }
   };
   ```

3. **Test Locally**
   ```bash
   # Install locally
   npm link
   
   # Test in BEAST MODE
   beast-mode my-plugin --test
   ```

4. **Submit to Marketplace**
   - Go to Marketplace → "Submit Plugin"
   - Fill out submission form
   - Include documentation
   - Wait for review

### Plugin Requirements

- ✅ Valid `package.json`
- ✅ Plugin metadata (name, version, description)
- ✅ Configuration schema
- ✅ Execution handler
- ✅ Documentation
- ✅ Tests (recommended)

---

## 📚 Plugin API Reference

### Plugin Registry API

**GET `/api/beast-mode/marketplace/plugins`**
- List all available plugins
- Query params: `category`, `search`, `installed`

**POST `/api/beast-mode/marketplace/plugins`**
- Submit new plugin for review

### Installation API

**POST `/api/beast-mode/marketplace/install`**
- Install a plugin
- Body: `{ pluginId, userId, options }`

**GET `/api/beast-mode/marketplace/install`**
- Check installation status
- Query params: `pluginId`, `userId`

### Installed Plugins API

**GET `/api/beast-mode/marketplace/installed`**
- Get user's installed plugins
- Query params: `userId`

**POST `/api/beast-mode/marketplace/installed`**
- Update plugin configuration
- Body: `{ userId, pluginId, config, enabled }`

**DELETE `/api/beast-mode/marketplace/installed`**
- Uninstall a plugin
- Query params: `userId`, `pluginId`

---

## 🎨 Plugin UI Components

### PluginManager Component

The `PluginManager` component handles:
- Displaying installed plugins
- Enable/disable toggles
- Configuration UI
- Usage guides
- Uninstall functionality

### Marketplace View

The `MarketplaceView` component provides:
- Plugin browsing
- Search and filtering
- Installation flow
- Plugin details
- Statistics

---

## 🔄 Plugin Lifecycle

1. **Installation**
   - Plugin downloaded
   - Dependencies resolved
   - Configuration initialized
   - Enabled by default

2. **Activation**
   - Plugin loaded into runtime
   - Configuration applied
   - Event listeners registered

3. **Execution**
   - Plugin command invoked
   - Configuration passed
   - Results returned

4. **Updates**
   - Plugin version checked
   - Updates available notification
   - One-click update

5. **Deactivation**
   - Plugin disabled
   - Resources cleaned up
   - Can be re-enabled

6. **Uninstallation**
   - Plugin removed
   - Configuration preserved
   - Dependencies cleaned (if unused)

---

## 💡 Best Practices

### For Plugin Users

- ✅ Read plugin documentation before installing
- ✅ Configure plugins to match your workflow
- ✅ Keep plugins updated
- ✅ Disable unused plugins (better performance)
- ✅ Review plugin permissions

### For Plugin Developers

- ✅ Follow BEAST MODE plugin standards
- ✅ Provide clear documentation
- ✅ Include examples
- ✅ Handle errors gracefully
- ✅ Test thoroughly
- ✅ Version appropriately
- ✅ Keep dependencies minimal

---

## 🚀 Expansion Roadmap

### Current Features
- ✅ Plugin registry
- ✅ Installation system
- ✅ Plugin management
- ✅ Configuration UI
- ✅ Usage guides

### Coming Soon
- 🔄 Plugin runtime/execution system
- 🔄 Plugin marketplace with reviews
- 🔄 Plugin analytics
- 🔄 Auto-updates
- 🔄 Plugin dependencies
- 🔄 Plugin permissions system
- 🔄 Plugin sandboxing

---

## 📖 Resources

- **Documentation**: https://docs.beast-mode.dev/plugins
- **Example Plugins**: https://github.com/repairman29/BEAST-MODE/tree/main/plugins
- **Plugin Template**: https://github.com/repairman29/BEAST-MODE-plugin-template
- **Submit Plugin**: Marketplace → "Submit Plugin"

---

## 🎉 Get Started

1. **Browse** the Marketplace tab
2. **Install** plugins that match your needs
3. **Configure** plugins for your workflow
4. **Use** plugins via CLI or programmatically
5. **Create** your own plugins to extend BEAST MODE!

---

**Questions?** Check the Intelligence tab for AI-powered help, or visit our documentation.

