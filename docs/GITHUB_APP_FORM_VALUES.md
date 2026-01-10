# GitHub App Form - Quick Reference Values

**Copy and paste these values into the GitHub App registration form:**

---

## 📝 Form Values

### Basic Information
- **GitHub App name:** `BEAST MODE`
- **Description:** `AI-powered code quality intelligence platform. Automatically analyzes pull requests, provides quality scores, and suggests improvements.`
- **Homepage URL:** `https://beastmode.dev`

### Callback URL
- **Callback URL:** `https://beastmode.dev/api/github/app/callback`
- **Expire user authorization tokens:** ✅ Checked
- **Request user authorization (OAuth) during installation:** ⬜ Unchecked
- **Enable Device Flow:** ⬜ Unchecked

### Post Installation
- **Setup URL:** (leave empty)
- **Redirect on update:** ⬜ Unchecked

### Webhook
- **Active:** ✅ Checked
- **Webhook URL:** `https://beastmode.dev/api/github/webhook`
- **Secret:** (generate one - see below)

### Repository Permissions
- **Contents:** `Read-only`
- **Metadata:** `Read-only`
- **Pull requests:** `Read & write`
- **Checks:** `Read & write`
- **Issues:** `Read-only`

### Events to Subscribe
- ✅ **Pull request**
- ✅ **Push**
- ✅ **Installation**
- ✅ **Installation repositories**

### Installation
- **Where can this GitHub App be installed?:** `Only on this account`

---

## 🔐 Generate Webhook Secret

Run this command to generate a secure webhook secret:

```bash
openssl rand -hex 20
```

Copy the output and paste it into the "Secret" field.

**Save this secret!** You'll need it when running `beast-mode github-app save-credentials`.

---

## 📋 Quick Checklist

- [ ] App name: `BEAST MODE`
- [ ] Homepage URL: `https://beastmode.dev`
- [ ] Callback URL: `https://beastmode.dev/api/github/app/callback`
- [ ] Webhook URL: `https://beastmode.dev/api/github/webhook`
- [ ] Webhook Secret: (generated)
- [ ] Permissions: Contents (read), Pull requests (write), Checks (write)
- [ ] Events: Pull request, Push, Installation, Installation repositories
- [ ] Click "Create GitHub App"
- [ ] Save App ID, Client ID, Client Secret, Webhook Secret
- [ ] Download private key (.pem file)
- [ ] Run: `beast-mode github-app save-credentials`

---

**Ready to fill out the form! 🚀**
