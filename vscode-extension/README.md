# BEAST MODE - VS Code Extension

AI-powered code quality, suggestions, and automation for VS Code.

## Features

### 🎯 **Quality Intelligence**
- ML-powered quality scoring (XGBoost, R² = 1.000)
- Real-time quality hints as you code
- File-level and repository-wide analysis
- Quality trends and history

### 💬 **Codebase Chat**
- Conversational interface for code assistance
- Codebase-aware context
- Generate code from natural language
- Multi-turn conversations

### ⚡ **Real-Time Suggestions**
- Inline code completion
- Context-aware suggestions
- Pattern-based + LLM-powered
- Quality hints in real-time

### 🧪 **Automated Testing**
- Generate tests automatically
- Framework detection (Jest, Mocha, Pytest, Vitest)
- Test execution and reporting
- Coverage estimation

### 🔧 **Automated Refactoring**
- Detect refactoring opportunities
- LLM-powered refactoring
- Quality improvement tracking
- Batch refactoring

### 📚 **Codebase Indexing**
- Fast codebase search
- Symbol indexing
- Dependency graph
- Cross-file context

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install from VSIX:
   ```bash
   code --install-extension beast-mode-0.1.0.vsix
   ```

## Quick Start

1. **Open a workspace** in VS Code
2. **Connect to BEAST MODE** (configure API URL in settings)
3. **Start coding** - suggestions appear automatically
4. **Use commands:**
   - `Ctrl+Shift+B` (Cmd+Shift+B on Mac) - Get suggestions
   - `Ctrl+Shift+C` (Cmd+Shift+C on Mac) - Open chat
   - `Ctrl+Shift+P` → "BEAST MODE: Analyze Quality"
   - `Ctrl+Shift+P` → "BEAST MODE: Generate Tests"
   - `Ctrl+Shift+P` → "BEAST MODE: Refactor Code"

## Configuration

Open VS Code settings and search for "BEAST MODE":

- **API URL**: Your BEAST MODE API endpoint (default: `https://playsmuggler.com`)
- **Enable Suggestions**: Toggle real-time suggestions (default: `true`)
- **Enable Quality Hints**: Toggle quality hints (default: `true`)
- **Use LLM**: Use LLM for suggestions (requires API key, default: `false`)

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Analyze Code Quality | - | Analyze current file's quality |
| Get AI Suggestions | `Ctrl+Shift+B` | Get code suggestions |
| Open Codebase Chat | `Ctrl+Shift+C` | Open chat interface |
| Generate Tests | - | Generate tests for current file |
| Refactor Code | - | Analyze and apply refactorings |
| Index Codebase | - | Index workspace for fast search |

## Features in Detail

### Quality Intelligence

BEAST MODE analyzes your code quality using ML models trained on thousands of repositories. Get instant feedback on:

- Code quality score (0-100)
- Test coverage
- Maintainability
- Security issues
- Performance bottlenecks
- Best practices

### Real-Time Suggestions

Get inline code completion as you type, powered by:

- Pattern matching from your codebase
- LLM-powered generation (optional)
- Quality-aware suggestions
- Context-aware completions

### Codebase Chat

Ask questions about your codebase in natural language:

- "How do I add authentication?"
- "Generate tests for this file"
- "Refactor this code"
- "What are the security issues?"

### Automated Testing

Generate comprehensive tests automatically:

- Detects test framework (Jest, Mocha, Pytest, etc.)
- Generates test cases for all functions/classes
- Estimates coverage
- Executes tests and reports results

### Automated Refactoring

Improve code quality automatically:

- Detects 7 types of refactoring opportunities
- Estimates quality improvement
- Applies refactorings safely
- Tracks improvements

## Requirements

- VS Code 1.80.0 or higher
- Node.js 18+ (for test execution)
- BEAST MODE API access (or self-hosted)

## Extension Settings

```json
{
  "beastMode.apiUrl": "https://playsmuggler.com",
  "beastMode.enableSuggestions": true,
  "beastMode.enableQualityHints": true,
  "beastMode.useLLM": false
}
```

## Known Issues

- Test execution requires test frameworks to be installed
- LLM features require API key configuration
- Large codebases may take time to index

## Release Notes

### 0.1.0
- Initial release
- Quality intelligence
- Real-time suggestions
- Codebase chat
- Automated testing
- Automated refactoring
- Codebase indexing

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## License

See [LICENSE](../../LICENSE) for details.

## Support

- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Documentation: [docs/](../../docs/)
- Email: support@playsmuggler.com

