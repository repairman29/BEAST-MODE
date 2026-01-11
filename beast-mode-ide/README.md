# BEAST MODE IDE

Enterprise Quality Intelligence Platform - Custom IDE

## Features

- 🎨 **Monaco Editor** - VS Code editor experience
- 🖥️ **Integrated Terminal** - xterm.js terminal
- 🛡️ **Secret Interceptor** - Real-time secret scanning
- 🏗️ **Architecture Enforcement** - Inline warnings
- ✨ **Self-Healing** - Auto-fix suggestions
- 🧠 **Oracle Integration** - AI context panel
- 📊 **Quality Tracking** - Live quality scores
- 🔄 **Multi-Repo** - Switch between repos easily

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## Requirements

- Node.js 18+
- Electron 28+
- BEAST MODE API (for full features)

## Architecture

- **Main Process** (`main/`) - Electron main process, window management
- **Renderer** (`renderer/`) - UI and Monaco editor
- **Source** (`src/`) - TypeScript source files
  - `editor/` - Monaco editor integration
  - `terminal/` - xterm.js terminal
  - `sidebar/` - File explorer
  - `panels/` - BEAST MODE panels
  - `integrations/` - BEAST MODE feature integrations

## License

Proprietary - BEAST MODE Enterprise
