# M-Pesa Settings Form - Visual Layout & Instructions

## EXACT LOCATION IN POS SYSTEM

### Navigate To:
```
Dashboard → Settings (⚙️) → Payment Methods → M-Pesa Configuration
```

---

## THE FORM - WITH EXACT FIELDS

### Section 1: API Credentials (Top)
```
┌────────────────────────────────────────────────────────────────┐
│                    M-Pesa Configuration                         │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Business Short Code (Required)                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 603103                                         ← SANDBOX    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ℹ️ Use 603103 for testing, 174379 for live                    │
│                                                                  │
│  Consumer Key (Required)                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxx                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  From: https://developer.safaricom.co.ke/                       │
│                                                                  │
│  Consumer Secret (Required)                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxx                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  From: https://developer.safaricom.co.ke/                       │
│                                                                  │
│  Passkey (Required)                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxx                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  From Safaricom's Lipa Na M-Pesa Online                         │
│                                                                  │
│  Environment (Required)                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Sandbox ▼]                                                │ │
│  │ • Sandbox (Testing)                                        │ │
│  │ • Production (Live)                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

### Section 2: Callback & Timeout URLs (MAIN SECTION)
```
┌────────────────────────────────────────────────────────────────┐
│               Callback & Timeout URLs                           │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠️ IMPORTANT: These URLs receive payment notifications.        │
│  Must use HTTPS.                                                │
│                                                                  │
│  Example URLs:                                                  │
│  🔧 Development:   https://[ngrok-id].ngrok.io/api/mpesa/cb   │
│  ☁️  Vercel:        https://[project].vercel.app/api/mpesa/cb  │
│  🏠 Self-Hosted:   https://your-domain.com/api/mpesa/cb        │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Callback URL [emerald]              Timeout URL [red]          │
│  Payment Success                      Payment Failed/Cancelled  │
│  ────────────────────────────────     ─────────────────────────│
│  ┌──────────────────────────────────┐ ┌──────────────────────┐ │
│  │ https://your-url.com/api/        │ │ https://your-url.co  │ │
│  │ mpesa/callback                   │ │ m/api/mpesa/timeout  │ │
│  └──────────────────────────────────┘ └──────────────────────┘ │
│                                                                  │
│  📝 Receives confirmation when        📝 Receives notification   │
│  payment is successful                when payment fails,       │
│                                       times out, or is          │
│                                       cancelled                 │
│                                                                  │
│  ℹ️ See MPESA_URLS_SPECIFICATION.md for exact URLs              │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## STEP-BY-STEP INSTRUCTIONS

### STEP 1️⃣: Determine Your Deployment Type

| Type | URL Pattern | Example |
|------|---|---|
| **Development (Ngrok)** | `https://[ID].ngrok.io` | `https://abc123.ngrok.io` |
| **Vercel** | `https://[PROJECT].vercel.app` | `https://my-pos.vercel.app` |
| **Self-Hosted** | `https://your-domain.com` | `https://pos.mycompany.com` |

**→ Pick ONE and proceed to Step 2**

---

### STEP 2️⃣: Get Your Base URL

#### If Using Ngrok:
```bash
# Terminal:
$ ngrok http 5173

# Output:
Forwarding  https://abc123def456.ngrok.io -> http://localhost:5173

# Your URL: https://abc123def456.ngrok.io
```

#### If Using Vercel:
```bash
# Your URL appears in Vercel dashboard
# Example: https://my-pos-system.vercel.app
```

#### If Self-Hosted:
```
# Your URL is your domain
# Example: https://pos.mycompany.com
```

---

### STEP 3️⃣: Construct Full URLs

#### Take your base URL and ADD these paths:

**Callback URL:**
```
[BASE_URL] + /api/mpesa/callback
```

**Timeout URL:**
```
[BASE_URL] + /api/mpesa/timeout
```

#### Examples:

##### Example A: Ngrok
```
Base URL:     https://abc123def456.ngrok.io

Callback URL: https://abc123def456.ngrok.io/api/mpesa/callback
Timeout URL:  https://abc123def456.ngrok.io/api/mpesa/timeout
```

##### Example B: Vercel
```
Base URL:     https://my-pos.vercel.app

Callback URL: https://my-pos.vercel.app/api/mpesa/callback
Timeout URL:  https://my-pos.vercel.app/api/mpesa/timeout
```

##### Example C: Self-Hosted
```
Base URL:     https://pos.mycompany.com

Callback URL: https://pos.mycompany.com/api/mpesa/callback
Timeout URL:  https://pos.mycompany.com/api/mpesa/timeout
```

---

### STEP 4️⃣: Open M-Pesa Settings

1. Click **Settings** ⚙️ in top navigation
2. Find **Payment Methods** section
3. Select **M-Pesa Configuration**

---

### STEP 5️⃣: Locate the Two URL Fields

Scroll down to find:
```
┌─────────────────────────────────┐
│ Callback & Timeout URLs         │
│                                 │
│ Callback URL: [_______________] │ ← FIELD 1
│                                 │
│ Timeout URL:  [_______________] │ ← FIELD 2
└─────────────────────────────────┘
```

---

### STEP 6️⃣: Paste the Callback URL

1. Click the **Callback URL** field
2. Clear any existing text
3. Copy from above and **PASTE:**
   ```
   https://your-url/api/mpesa/callback
   ```
   (Replace `your-url` with your actual URL)

---

### STEP 7️⃣: Paste the Timeout URL

1. Click the **Timeout URL** field
2. Clear any existing text
3. Copy from above and **PASTE:**
   ```
   https://your-url/api/mpesa/timeout
   ```
   (Replace `your-url` with your actual URL)

---

### STEP 8️⃣: Save Settings

Scroll down and click:
```
[💾 Save M-Pesa Settings]
```

Wait for confirmation message ✅

---

## VALIDATION CHECKLIST

After pasting URLs, verify:

- ✅ URL starts with `https://` (secure)
- ✅ URL includes `/api/mpesa/callback` or `/api/mpesa/timeout`
- ✅ No trailing slash `/` at the end
- ✅ No space before/after URL
- ✅ URL is exactly as shown (case-sensitive)

---

## BEFORE & AFTER EXAMPLES

### ❌ WRONG EXAMPLES
```
❌ http://your-url/api/mpesa/callback
   (HTTP instead of HTTPS - insecure)

❌ https://your-url/api/mpesa/callback/
   (Trailing slash)

❌ https://localhost:5173/api/mpesa/callback
   (Localhost not accessible from M-Pesa)

❌ https://your-url/callback
   (Missing /api/mpesa/ part)

❌ https://your-url/api/mpesa/callback?test=1
   (Query parameters not allowed)
```

### ✅ CORRECT EXAMPLES
```
✅ https://abc123.ngrok.io/api/mpesa/callback
✅ https://my-pos.vercel.app/api/mpesa/callback
✅ https://pos.mycompany.com/api/mpesa/callback
✅ https://192-168-1-1.ngrok.io/api/mpesa/callback
```

---

## TESTING YOUR URLS

### Quick Test (After Saving)

#### Using curl (Terminal):
```bash
# Test Callback URL
curl -i https://your-url/api/mpesa/callback

# Should return:
# HTTP/1.1 200 OK
# or
# HTTP/1.1 405 Method Not Allowed
# (Both are OK - means endpoint exists)
```

#### Using Browser:
```
1. Open DevTools (F12)
2. Go to Console tab
3. Run:
   fetch('https://your-url/api/mpesa/callback', {method: 'POST'})
   
4. Check Network tab for response
```

---

## REAL-WORLD SCENARIO

### You Have Ngrok Running:

```
Step 1: Terminal shows
  Forwarding  https://xyz789abc123.ngrok.io

Step 2: Your base URL is
  https://xyz789abc123.ngrok.io

Step 3: Add the paths
  Callback URL: https://xyz789abc123.ngrok.io/api/mpesa/callback
  Timeout URL:  https://xyz789abc123.ngrok.io/api/mpesa/timeout

Step 4: Go to Settings → M-Pesa Configuration

Step 5: Paste these URLs into the fields

Step 6: Click Save

Step 7: Make test payment to verify
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| "Connection refused" | Make sure dev server is running: `npm run dev` |
| "Ngrok URL changed" | Restart Ngrok and update URLs in settings |
| "SSL certificate error" | Use HTTPS, not HTTP. Ngrok handles this automatically |
| "URL not found" | Check URL doesn't have trailing slash or typos |
| "Webhook never triggered" | Verify polling is enabled (automatic fallback) |

---

## SUPPORT RESOURCES

📖 Full Guide: `MPESA_URLS_SPECIFICATION.md`
📋 Quick Reference: `MPESA_QUICK_REFERENCE.md`
🔗 M-Pesa API: https://developer.safaricom.co.ke/
🔗 Ngrok: https://ngrok.com/docs

---

## SUMMARY

| When | Do This |
|------|---------|
| **Development** | Use Ngrok: `ngrok http 5173` → Copy URL → Add `/api/mpesa/callback` |
| **Testing** | Use same URL for both Callback and Timeout (for now) |
| **Production** | Use actual domain with HTTPS certificate |
| **Changed Domain?** | Update both URLs in settings |

---

**Your URLs are ready to paste!** ✨
