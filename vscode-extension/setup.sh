#!/bin/bash
# BEAST MODE Extension Setup Script

echo "🚀 Setting up BEAST MODE Extension..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from vscode-extension directory"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Extension compiled successfully!"
  echo ""
  echo "📋 Next Steps:"
  echo "   1. Open Cursor"
  echo "   2. Press Cmd+Shift+P"
  echo "   3. Type: 'Developer: Reload Window'"
  echo "   4. Open test-file.ts (in src/)"
  echo "   5. Try: Cmd+Shift+P → 'BEAST MODE: Analyze Code Quality'"
  echo ""
  echo "🧪 Test Commands:"
  echo "   • Cmd+Shift+B → Get AI Suggestions"
  echo "   • Cmd+Shift+C → Open Codebase Chat"
  echo "   • Cmd+Shift+P → 'BEAST MODE: Analyze Code Quality'"
  echo ""
else
  echo "❌ Compilation failed. Check errors above."
  exit 1
fi

