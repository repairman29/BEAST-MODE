# Project Structure - BEAST MODE Ecosystem

**Date:** 2026-01-08  
**Status:** 📋 **PROJECT SEPARATION GUIDE**

---

## 🎯 Separate Projects

BEAST MODE is part of a larger ecosystem of separate projects:

### **1. BEAST MODE** 🚀
- **Domain:** `beast-mode.dev`
- **Repository:** `repairman29/BEAST-MODE` (public)
- **Purpose:** AI-powered code quality, intelligence & automation platform
- **Support:** `support@beast-mode.dev`
- **Status:** Active development, 85% launch-ready

### **2. Smugglers RPG** 🎲
- **Domain:** `playsmuggler.com`
- **Repository:** Private (in monorepo)
- **Purpose:** Tabletop RPG game platform
- **Status:** Separate game project

### **3. Echeo** 💰
- **Domain:** `echeo.io` / `echeo.ai`
- **Repository:** `repairman29/echeo-web`
- **Purpose:** Bounty platform for developers
- **Status:** Active, integrates with BEAST MODE for quality scoring

### **4. D6 Consortium** 🎯
- **Domain:** `d6consortium.com`
- **Purpose:** Publisher/marketing site
- **Status:** Separate project

---

## 🔗 Cross-Project Integrations

### **Echeo ↔ BEAST MODE**
- **Echeo calls BEAST MODE API** at: `https://beast-mode.dev/api/repos/quality`
- **Purpose:** Quality scoring for bounties
- **Integration:** Trust score includes quality component

### **BEAST MODE ↔ GitHub**
- **BEAST MODE API:** `https://beast-mode.dev/api/...`
- **Purpose:** Repository scanning, quality analysis
- **Integration:** GitHub OAuth, repository access

---

## 📁 Repository Structure

### **BEAST-MODE-PRODUCT/** (This Repository)
```
BEAST-MODE-PRODUCT/
├── website/              # Next.js app (beast-mode.dev)
├── lib/                  # Core libraries
├── scripts/              # Automation scripts
├── vscode-extension/     # VS Code extension
└── docs/                 # Documentation
```

### **Separate Repositories**
- `repairman29/BEAST-MODE` - Public repo (this one)
- `repairman29/echeo-web` - Echeo platform
- Smugglers game - Private monorepo

---

## 🌐 Domain Mapping

| Project | Domain | Purpose |
|---------|--------|---------|
| BEAST MODE | `beast-mode.dev` | Code quality platform |
| Smugglers RPG | `playsmuggler.com` | Game platform |
| Echeo | `echeo.io` / `echeo.ai` | Bounty platform |
| D6 Consortium | `d6consortium.com` | Publisher site |

---

## 📧 Support Emails

| Project | Support Email |
|---------|---------------|
| BEAST MODE | `support@beast-mode.dev` |
| Echeo | (TBD) |
| Smugglers | (TBD) |
| D6 Consortium | (TBD) |

---

## 🔌 API Endpoints

### **BEAST MODE APIs** (beast-mode.dev)
- Quality API: `https://beast-mode.dev/api/repos/quality`
- Benchmark API: `https://beast-mode.dev/api/repos/benchmark`
- Suggestions API: `https://beast-mode.dev/api/codebase/suggestions`
- Chat API: `https://beast-mode.dev/api/codebase/chat`
- Test Generation: `https://beast-mode.dev/api/codebase/tests/generate`
- Refactoring: `https://beast-mode.dev/api/codebase/refactor`

### **Echeo APIs** (echeo.io)
- Bounty API: `https://echeo.io/api/bounties/...`
- Trust Score: `https://echeo.io/api/trust-score`

### **Smugglers APIs** (playsmuggler.com)
- Game APIs: `https://playsmuggler.com/api/...`
- AI GM: `https://smuggler-ai-gm.vercel.app`

---

## 📋 Important Notes

1. **BEAST MODE is separate** from Smugglers game project
2. **Echeo integrates** with BEAST MODE for quality features
3. **Each project** has its own domain and repository
4. **Cross-project** integrations use appropriate domains
5. **Support emails** are project-specific

---

## ✅ Domain Usage Guidelines

### **Use `beast-mode.dev` for:**
- BEAST MODE website
- BEAST MODE API endpoints
- BEAST MODE documentation
- BEAST MODE support
- VS Code extension configuration

### **Use `playsmuggler.com` for:**
- Smugglers RPG game
- Game-related APIs
- Game documentation
- Game support

### **Use `echeo.io` for:**
- Echeo platform
- Echeo APIs
- Echeo documentation

### **Use `d6consortium.com` for:**
- Publisher site
- Marketing materials
- Press kit

---

## 🔗 Integration Points

### **Echeo → BEAST MODE**
- Echeo calls: `https://beast-mode.dev/api/repos/quality`
- Purpose: Get quality scores for bounties
- Integration: Trust score calculation

### **BEAST MODE → GitHub**
- BEAST MODE calls: GitHub API
- Purpose: Repository scanning
- Integration: Quality analysis

---

**Keep projects separate, integrations clear!** 🎯

