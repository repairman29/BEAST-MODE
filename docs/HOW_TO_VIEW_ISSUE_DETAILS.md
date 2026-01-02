# How to View Issue Details & Summaries

## 🎯 Quick Access Methods

### Method 1: Quality Tab (Main Dashboard) ⚡

**This is where everything happens!**

1. **Go to:** Dashboard → Click **⚡ Quality** in the sidebar
2. **Scan a repository:**
   - Enter repo name (e.g., `owner/repo`) in the search box at top
   - Or click "Scan Repository" button
3. **After scanning**, you'll see:
   - Quality score card
   - Issue count
   - List of issues (click any issue to expand)
4. **Click any issue** to see:
   - Full description
   - File paths
   - Expected paths
   - Suggestions
   - Checked paths/patterns
   - Repository context

### Method 2: Scan Details Modal (Full Details)

1. **Go to:** Dashboard → **⚡ Quality** tab
2. **Click on any scan result card** (the card showing repo name, score, etc.)
3. **Modal opens** with:
   - Full scan summary
   - All issues with **"Show Context & Details"** button
   - Recommendations
   - Raw scan data
4. **Click "Show Context & Details"** on any issue for:
   - Full context information
   - All checked paths
   - Metrics
   - Repository information

---

## 🔍 Viewing Enhanced Issue Context

### In Quality Tab

1. **Click an issue** in the list
2. **Expands to show:**
   - Description
   - File/expected path
   - **💡 Suggestion** (if available)
   - **Checked paths** (first 5)
   - **Repository link**

### In Scan Details Modal

1. **Open modal** (click scan card)
2. **Find issue** in "Detected Issues" section
3. **Click "Show Context & Details"** button
4. **See full context:**
   - 💡 Suggestion
   - Checked Paths (all of them)
   - Checked Patterns
   - Expected Files
   - Metrics
   - Repository Info (branch, URL, languages, etc.)

---

## 📊 What Information You'll See

### Basic Issue Info
- **Title**: Issue name
- **Priority**: high/medium/low
- **Category**: documentation, quality, devops, etc.
- **Description**: What the issue is

### Enhanced Context (New!)
- **💡 Suggestion**: Actionable recommendation
- **Checked Paths**: What files/locations were checked
- **Checked Patterns**: What patterns were searched
- **Expected Files**: What files should exist
- **Metrics**: File counts, code ratios, etc.
- **Repository Info**: 
  - Default branch
  - Repository URL (clickable)
  - Issues URL (clickable)
  - Languages detected
  - Primary language

---

## 🎨 Visual Guide

### Quality Tab View
```
┌─────────────────────────────────────┐
│ 🐛 Detected Issues (5)              │
├─────────────────────────────────────┤
│ [high] Missing README.md            │ ← Click to expand
│   ▼ Show Context & Details          │
│   💡 Suggestion: Create README...    │
│   Checked: README.md, readme.md...  │
│   Expected: README.md                │
└─────────────────────────────────────┘
```

### Scan Details Modal
```
┌─────────────────────────────────────┐
│ 📊 Scan Details                     │
├─────────────────────────────────────┤
│ Score: 75 | Issues: 5              │
├─────────────────────────────────────┤
│ 🐛 Detected Issues (5)              │
│                                     │
│ [high] Missing README.md            │
│   ▶ Show Context & Details          │ ← Click here
│                                     │
│   [Expanded View]                   │
│   💡 Suggestion: ...                 │
│   Checked Paths: ...                 │
│   Repository Info: ...               │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Tips

1. **Click issues** in Quality tab for quick view
2. **Click scan cards** for full modal with all details
3. **Use "Show Context & Details"** for deep dive
4. **Check suggestions** for actionable fixes
5. **Click repository links** to go to GitHub

---

## 🔧 Troubleshooting

### Can't see issue details?
- Make sure you've scanned a repository first
- Check that the scan completed successfully
- Try refreshing the page

### Details not expanding?
- Click directly on the issue title/card
- Look for "Show Context & Details" button
- Check browser console for errors (F12)

### Missing context information?
- Ensure you're using the latest version
- Some issues may not have full context (older scans)
- Re-scan the repository to get enhanced context

