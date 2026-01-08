# Custom Models - Simple Guide for Everyone

## 🎯 The Simple Version

**Want to save 97% on code generation costs?** Just run one command:

```bash
node scripts/simple-setup-custom-model.js
```

That's it! Answer a few questions, and you're done. ✨

---

## 📋 What You Need

1. **An API endpoint** (your model's URL)
2. **An API key** (to access your model)
3. **2 minutes** (seriously, that's it!)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Setup

```bash
node scripts/simple-setup-custom-model.js
```

### Step 2: Answer Questions

The wizard will ask:
- What to call your model? → `My Code Model`
- What's your endpoint URL? → `https://api.openai.com/v1/chat/completions`
- What type of API? → `1` (OpenAI-compatible)
- What's your API key? → `sk-...`
- Description? → (optional)

### Step 3: Done!

That's it! Your model is now set up and will be used automatically. 🎉

---

## 💡 How It Works

**Before:**
- You generate code → Uses GPT-4 → Costs $0.03/1K tokens

**After:**
- You generate code → Uses your custom model → Costs $0.001/1K tokens
- **You save 97%!** 💰

**Best part:** It happens automatically. No configuration needed!

---

## ❓ Common Questions

### "Do I need to change my code?"

**No!** Once set up, your custom model is used automatically for all code generation.

### "What if my model fails?"

**No worries!** The system automatically falls back to provider models if your custom model has issues.

### "How do I know it's working?"

Check your metrics:
```bash
node scripts/monitor-custom-models.js
```

### "Can I use multiple models?"

Yes! Register as many as you want. The system will use your most recent one automatically.

### "What if I don't have a custom model?"

That's fine! The system will use provider models (GPT-3.5, GPT-4, etc.) automatically.

---

## 🎨 Visual Guide

```
┌─────────────────────────────────────────┐
│  You: "Create a login component"        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  System: "Using your custom model!"    │
│  💰 97% cost savings!                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  ✅ Code generated with your model      │
└─────────────────────────────────────────┘
```

---

## 📊 Check Your Savings

```bash
# See how much you've saved
node scripts/monitor-custom-models.js
```

You'll see:
- ✅ How many requests used your model
- 💰 Total cost savings
- 📈 Success rate
- ⚡ Performance metrics

---

## 🆘 Need Help?

### "Setup failed"

1. Make sure you're logged in:
   ```bash
   node scripts/simple-setup-custom-model.js --user-id=YOUR_USER_ID
   ```

2. Check your endpoint URL is correct

3. Verify your API key is valid

### "Model not working"

1. Check model health:
   ```bash
   node scripts/test-custom-model-health.js --model-id=custom:your-model
   ```

2. Check metrics:
   ```bash
   node scripts/monitor-custom-models.js
   ```

3. System will auto-fallback to provider models if needed

---

## 🎯 That's It!

**Remember:**
- ✅ One command to set up: `node scripts/simple-setup-custom-model.js`
- ✅ Works automatically after setup
- ✅ Saves 97% on costs
- ✅ No configuration needed

**You're all set!** 🚀

---

## 📚 Want More Details?

- **Quick Reference:** `docs/CUSTOM_MODELS_QUICK_START.md`
- **Full Guide:** `docs/CUSTOM_MODELS_CODE_GENERATION.md`
- **Workflow Integration:** `docs/CUSTOM_MODELS_WORKFLOW_INTEGRATION.md`

But honestly, you probably don't need them. The simple setup is all you need! 😊
