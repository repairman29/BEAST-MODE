#!/bin/bash

# BEAST MODE Cursor Extension Installer

set -e

echo "🧪 BEAST MODE Cursor Extension Installer"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the cursor-extension directory."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
  echo "📦 Installing vsce (VS Code Extension Manager)..."
  npm install -g @vscode/vsce
fi

# Package extension
echo "📦 Packaging extension..."
npm run package

# Get the generated .vsix file
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
  echo "❌ Error: No .vsix file generated"
  exit 1
fi

echo ""
echo "✅ Extension packaged successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Open Cursor"
echo "   2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)"
echo "   3. Type 'Install from VSIX'"
echo "   4. Select: $(pwd)/$VSIX_FILE"
echo ""
echo "   Or install via command line:"
echo "   code --install-extension $VSIX_FILE"
echo ""

