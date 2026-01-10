# GitHub App Manual Setup Guide

**Date:** 2026-01-09  
**Method:** Manual form filling (no manifest option available)

---

## 📋 Step-by-Step Form Filling

### 1. GitHub App name
**Value:** `BEAST MODE` or `Beast-Mode`  
**Field:** "GitHub App name *" (required)

---

### 2. Description
**Value:** 
```
AI-powered code quality intelligence platform. Automatically analyzes pull requests, provides quality scores, and suggests improvements.
```
**Field:** Description text area

---

### 3. Homepage URL
**Value:** `https://beast-mode.dev`  
**Field:** "Homepage URL *" (required)

---

### 4. Identifying and authorizing users

#### Callback URL
**Value:** `https://beast-mode.dev/api/github/app/callback`  
**Field:** "Callback URL"  
**Action:** Click "Add Callback URL" button

#### Expire user authorization tokens
**Value:** ✅ **Checked** (recommended)  
**Field:** Checkbox

#### Request user authorization (OAuth) during installation
**Value:** ⬜ **Unchecked** (not needed for basic setup)  
**Field:** Checkbox

#### Enable Device Flow
**Value:** ⬜ **Unchecked** (not needed)  
**Field:** Checkbox

---

### 5. Post installation

#### Setup URL (optional)
**Value:** Leave empty  
**Field:** "Setup URL (optional)"

#### Redirect on update
**Value:** ⬜ **Unchecked**  
**Field:** Checkbox

---

### 6. Webhook

#### Active
**Value:** ✅ **Checked** (required)  
**Field:** Checkbox

#### Webhook URL
**Value:** `https://beast-mode.dev/api/github/webhook`  
**Field:** "Webhook URL *" (required)

#### Secret
**Value:** Generate a random secret (save this!)  
**Field:** "Secret"  
**Action:** Click "Generate" or enter a secure random string  
**Example:** Use `openssl rand -hex 20` to generate

---

### 7. Permissions

#### Repository permissions
Expand the "Repository permissions" section and set:

- **Contents:** `Read-only` ✅
- **Metadata:** `Read-only` ✅
- **Pull requests:** `Read & write` ✅
- **Checks:** `Read & write` ✅
- **Issues:** `Read-only` ✅

#### Organization permissions
**Value:** Leave all as "No access" (unless you need org features)

#### Account permissions
**Value:** Leave all as "No access" (unless you need user account features)

---

### 8. Subscribe to events

Check these events:
- ✅ **Pull request** - When PRs are opened, updated, closed
- ✅ **Push** - When code is pushed to repository
- ✅ **Installation** - When app is installed/uninstalled
- ✅ **Installation repositories** - When repos are added/removed

**Optional events:**
- ⬜ Installation target (not needed)
- ⬜ Meta (not needed)
- ⬜ Security advisory (optional)

---

### 9. Where can this GitHub App be installed?

**Value:** Select **"Only on this account"** (for now)  
**Field:** Radio button  
**Note:** You can change this later to "Any account" if you want to publish it

---

### 10. Create the App

Click the green **"Create GitHub App"** button.

---

## 🔑 After Creation

GitHub will show you:
1. **App ID** - Save this!
2. **Client ID** - Save this!
3. **Client Secret** - Save this! (shown once)
4. **Webhook Secret** - The one you generated (or GitHub generated)

**Download the Private Key:**
- Click "Generate a private key"
- Save the `.pem` file securely

---

## 💾 Save Credentials

After getting all credentials, run:

```bash
beast-mode github-app save-credentials
```

Enter:
- App ID
- Client ID
- Client Secret
- Webhook Secret
- Private key file path (the .pem file you downloaded)

---

## ✅ Verify Setup

```bash
beast-mode github-app check
```

Should show all ✅ green checkmarks.

---

## 🚀 Next Steps

1. **Install the app on a test repo:**
   - Go to your GitHub App settings
   - Click "Install App"
   - Select a test repository

2. **Test it:**
   - Create a test PR
   - BEAST MODE should automatically comment!

---

**That's it! You're ready to go! 🎉**
