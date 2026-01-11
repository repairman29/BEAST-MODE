# Building IDE from User Stories with BEAST MODE

**Date:** January 11, 2025

---

## 🎯 Overview

This document explains how we're using BEAST MODE APIs to build the IDE directly from user stories.

---

## 🚀 Quick Start

### 1. Start BEAST MODE Server
```bash
cd BEAST-MODE-PRODUCT/website
npm run dev
```

### 2. Build from Stories
```bash
cd beast-mode-ide
npm run build:from-stories P0 10
```

---

## 📋 Usage

### Basic Usage
```bash
npm run build:from-stories [priority] [limit]
```

### Examples
```bash
# Build 10 P0 (Must Have) stories
npm run build:from-stories P0 10

# Build 5 P1 (Should Have) stories
npm run build:from-stories P1 5

# Build 50 P0 stories
npm run build:from-stories P0 50
```

---

## 🔄 How It Works

### 1. Load Stories
- Reads `docs/user-stories/ALL_STORIES.json`
- Filters by priority
- Skips already processed stories

### 2. Generate Code
- Sends each story to BEAST MODE API
- Uses `/api/codebase/chat` endpoint
- Includes story details and acceptance criteria

### 3. Save Code
- Organizes by category
- Saves to `renderer/features/[category]/[story-id].js`
- Includes metadata file

### 4. Track Progress
- Saves progress to `docs/user-stories/BUILD_PROGRESS.json`
- Tracks completed, failed, and in-progress stories

---

## 📁 Output Structure

```
renderer/features/
├── file-management/
│   ├── US-0001.js
│   ├── US-0001.meta.json
│   └── ...
├── code-editing/
│   ├── US-0011.js
│   └── ...
├── navigation/
│   └── ...
├── ai/
│   └── ...
├── quality/
│   └── ...
├── collaboration/
│   └── ...
├── performance/
│   └── ...
└── general/
    └── ...
```

---

## 📊 Progress Tracking

### View Progress
```bash
cat docs/user-stories/BUILD_PROGRESS.json
```

### Progress File Structure
```json
{
  "completed": ["US-0001", "US-0002", ...],
  "inProgress": [],
  "failed": [
    {"id": "US-0003", "reason": "API timeout"}
  ],
  "stats": {
    "total": 1093,
    "completed": 50,
    "inProgress": 0,
    "failed": 3
  }
}
```

---

## 🎯 Priority Strategy

### P0 (Must Have) - 269 stories
- Core functionality
- Essential features
- Build first

### P1 (Should Have) - 775 stories
- Important features
- Build after P0

### P2 (Nice to Have) - 49 stories
- Polish features
- Build last

---

## 🔧 Customization

### Modify Generation Prompt
Edit `scripts/build-from-user-stories.js`:
```javascript
const prompt = `Your custom prompt here...`;
```

### Change Output Location
Edit file path logic in `saveGeneratedCode()` function.

### Add Custom Processing
Add logic in `processStories()` function.

---

## 📈 Best Practices

1. **Start Small**: Build 5-10 stories at a time
2. **Test Often**: Test generated code before continuing
3. **Review Code**: Review BEAST MODE generated code
4. **Track Progress**: Monitor BUILD_PROGRESS.json
5. **Fix Failures**: Address failed stories

---

## 🐛 Troubleshooting

### BEAST MODE API Not Available
```bash
# Start BEAST MODE server
cd BEAST-MODE-PRODUCT/website
npm run dev
```

### Stories File Not Found
```bash
# Generate stories first
node scripts/generate-all-user-stories.js
```

### API Timeout
- Reduce limit (try 5 instead of 10)
- Check BEAST MODE server logs
- Verify API is responding

### Generated Code Issues
- Review generated code
- Fix manually if needed
- Mark as completed in progress file

---

## 🚀 Next Steps

1. **Build P0 Stories**: Start with must-have features
2. **Test Generated Code**: Ensure code works
3. **Integrate Features**: Connect features together
4. **Build P1 Stories**: Add important features
5. **Polish**: Add P2 features

---

**Last Updated:** January 11, 2025  
**Status:** ✅ Ready to Build
