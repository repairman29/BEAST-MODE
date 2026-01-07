# Resend Email Setup for BEAST MODE
## Email Addresses and Projects Configuration

**Date:** January 2026  
**Domain:** `beast-mode.dev`  
**Status:** 📋 **Setup Required**

---

## 🎯 **REQUIRED EMAIL ADDRESSES**

### **1. Primary Sending Address** ⭐

#### `notifications@beast-mode.dev`
- **Purpose:** Main sending address for all transactional emails
- **Used For:**
  - Welcome emails
  - Account verification
  - API key generation notifications
  - Usage alerts
  - Billing notifications
  - Quality scan results
  - System notifications
- **Reply-To:** `support@beast-mode.dev`
- **Status:** ⚠️ **Needs Setup**

---

### **2. Support & Contact Addresses** 📞

#### `support@beast-mode.dev` **REQUIRED**
- **Purpose:** Customer support inquiries
- **Used For:**
  - Reply-to address for all transactional emails
  - Customer support page (`/support`)
  - Help requests
  - General inquiries
  - Billing questions
- **Status:** ⚠️ **Needs Setup**
- **Action:** Set up email forwarding or inbox

#### `security@beast-mode.dev` **REQUIRED**
- **Purpose:** Security-related inquiries
- **Used For:**
  - Security vulnerability reports
  - Security policy contact
  - Bug reports
  - Security incidents
- **Status:** ⚠️ **Needs Setup**
- **Action:** Set up email forwarding or inbox

---

### **3. Admin Addresses** 👤

#### `admin@beast-mode.dev` **OPTIONAL**
- **Purpose:** Administrative communications
- **Used For:**
  - Admin notifications
  - System alerts
  - Internal communications
- **Status:** ⚠️ **Optional - Set up if needed**

---

## 🚀 **SETUP STEPS**

### **Step 1: Add Domain to Resend**

1. **Go to Resend Dashboard:**
   - https://resend.com/domains
   - Click "Add Domain"
   - Enter: `beast-mode.dev`

2. **Add DNS Records:**
   - DKIM record (provided by Resend)
   - SPF record: `v=spf1 include:resend.com ~all`
   - DMARC record: `v=DMARC1; p=none; rua=mailto:dmarc@beast-mode.dev`

3. **Wait for Verification:**
   - Usually 5-10 minutes
   - Check status in Resend dashboard

---

### **Step 2: Configure Email Addresses**

#### **Option A: Use Resend Dashboard (Recommended)**

1. **Go to Resend Dashboard:**
   - https://resend.com/domains
   - Click on `beast-mode.dev`
   - All addresses on verified domain are automatically available

2. **No Additional Setup Needed:**
   - Once domain is verified, you can send from any `@beast-mode.dev` address
   - Receiving addresses can be viewed in Resend dashboard

#### **Option B: Use Automation Script**

```bash
# Check current status
cd BEAST-MODE-PRODUCT
node scripts/check-resend-status.js

# Set up email addresses
node scripts/setup-resend-addresses.js
```

---

### **Step 3: Store API Key in Supabase**

```bash
# Store Resend API key
node scripts/store-resend-key.js re_YOUR_API_KEY
```

**Or manually:**
1. Go to Supabase dashboard
2. Navigate to `user_api_keys` table
3. Insert:
   - `provider`: `'resend'`
   - `encrypted_key`: (encrypted API key)
   - `user_id`: (your user ID)

---

### **Step 4: Configure Email Service**

Update email service configuration:

```typescript
// In email service config
{
  from: 'notifications@beast-mode.dev',
  replyTo: 'support@beast-mode.dev',
  provider: 'resend'
}
```

---

### **Step 5: Set Up Email Forwarding (Optional)**

If you want to receive emails in your personal inbox:

#### **Option A: Use DNS Provider (Porkbun)**
1. Go to Porkbun dashboard
2. Navigate to `beast-mode.dev` → Email Forwarding
3. Set up forwarding:
   - `support@beast-mode.dev` → your-email@example.com
   - `security@beast-mode.dev` → your-email@example.com

#### **Option B: Use Resend Dashboard**
- View emails directly in Resend dashboard
- No forwarding needed

---

## 📊 **EMAIL ADDRESSES MATRIX**

| Address | Type | Purpose | Status | Action Needed |
|---------|------|---------|--------|---------------|
| `notifications@beast-mode.dev` | Sending | Primary transactional emails | ⚠️ Needs setup | Verify domain |
| `support@beast-mode.dev` | Receiving | Customer support | ⚠️ Needs setup | Set up forwarding |
| `security@beast-mode.dev` | Receiving | Security inquiries | ⚠️ Needs setup | Set up forwarding |
| `admin@beast-mode.dev` | Receiving | Admin communications | ⚠️ Optional | Set up if needed |

---

## 🔍 **CURRENT USAGE**

### **Where Email Addresses Are Referenced:**

1. **Support Page:**
   - `website/app/support/page.tsx` - References support email

2. **Documentation:**
   - `docs/README.md` - Support email: support@beast-mode.dev
   - `README.md` - Support email references

3. **API Routes:**
   - Email integration routes may reference email addresses

---

## 🛠️ **AUTOMATION SCRIPTS**

### **Check Status:**
```bash
node scripts/check-resend-status.js
```

### **Set Up Addresses:**
```bash
node scripts/setup-resend-addresses.js
```

### **Store API Key:**
```bash
node scripts/store-resend-key.js re_YOUR_API_KEY
```

### **Test Email Sending:**
```bash
node scripts/test-email-sending.js your-email@example.com
```

---

## 📚 **RELATED DOCUMENTATION**

- **Resend Expert Guide:** `docs/RESEND_EXPERT_ONBOARDING.md`
- **Echeo Setup (Reference):** `echeo-landing/docs/RESEND_EMAIL_ADDRESSES_SETUP.md`
- **Email Automation:** `echeo-landing/docs/RESEND_AUTOMATION_GUIDE.md`

---

## ✅ **CHECKLIST**

- [ ] Add `beast-mode.dev` domain to Resend
- [ ] Add DNS records (DKIM, SPF, DMARC)
- [ ] Verify domain in Resend
- [ ] Store Resend API key in Supabase
- [ ] Configure email service with from/reply-to addresses
- [ ] Set up email forwarding (optional)
- [ ] Test email sending
- [ ] Update documentation with email addresses

---

**Status:** ⚠️ **Setup Required - Follow steps above to configure**

