# M-Pesa URLs - Quick Reference Card

## COPY & PASTE THESE VALUES

### Choose Your Deployment Type

#### 🔧 DEVELOPMENT (Ngrok)
```
Callback URL: https://[NGROK-ID].ngrok.io/api/mpesa/callback
Timeout URL:  https://[NGROK-ID].ngrok.io/api/mpesa/timeout
```
**How to get Ngrok ID:** Run `ngrok http 5173` and copy the ID from the URL

---

#### ☁️ VERCEL (Production)
```
Callback URL: https://[PROJECT-NAME].vercel.app/api/mpesa/callback
Timeout URL:  https://[PROJECT-NAME].vercel.app/api/mpesa/timeout
```
**How to get Project Name:** Check your Vercel dashboard URL

---

#### 🏠 SELF-HOSTED (Custom Domain)
```
Callback URL: https://your-domain.com/api/mpesa/callback
Timeout URL:  https://your-domain.com/api/mpesa/timeout
```
**How to get Domain:** Your website URL

---

#### 🔥 FIREBASE
```
Callback URL: https://[REGION]-[PROJECT-ID].cloudfunctions.net/mpesaCallback
Timeout URL:  https://[REGION]-[PROJECT-ID].cloudfunctions.net/mpesaTimeout
```

---

#### ⚙️ AWS LAMBDA
```
Callback URL: https://[API-ID].execute-api.[REGION].amazonaws.com/prod/mpesa/callback
Timeout URL:  https://[API-ID].execute-api.[REGION].amazonaws.com/prod/mpesa/timeout
```

---

## WHERE TO PASTE

### Step 1: Open Settings
**Settings → Payment Methods → M-Pesa Configuration**

### Step 2: Find These Two Fields

| Field | What to Paste |
|-------|---|
| **Callback URL** | `https://your-url/api/mpesa/callback` |
| **Timeout URL** | `https://your-url/api/mpesa/timeout` |

### Step 3: Save
Click **"Save M-Pesa Settings"**

---

## EXAMPLE: Using Ngrok

### 1. Start Ngrok
```bash
ngrok http 5173
```

### 2. Terminal Output Shows
```
Forwarding  https://abc123def456.ngrok.io -> http://localhost:5173
```

### 3. Copy These URLs to Settings
```
Callback URL: https://abc123def456.ngrok.io/api/mpesa/callback
Timeout URL:  https://abc123def456.ngrok.io/api/mpesa/timeout
```

### 4. Save and Test

---

## CHECKLIST

Before saving, make sure:

- [ ] URL starts with `https://` (not `http://`)
- [ ] URL includes `/api/mpesa/callback` or `/api/mpesa/timeout`
- [ ] URL does NOT end with `/` (no trailing slash)
- [ ] URL is publicly accessible (test with curl or browser)
- [ ] For Ngrok: URL matches your current Ngrok session

---

## QUICK TEST

### Test Callback URL
```bash
curl -X POST https://your-url/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "success"}'
```

### Test Timeout URL
```bash
curl -X POST https://your-url/api/mpesa/timeout \
  -H "Content-Type: application/json" \
  -d '{"test": "timeout"}'
```

Expected: HTTP 200 response

---

## COMMON MISTAKES

❌ **WRONG:**
- `https://your-url/api/mpesa/callback/` (trailing slash)
- `https://localhost:5173/api/mpesa/callback` (localhost)
- `http://your-url/api/mpesa/callback` (HTTP not HTTPS)
- `https://your-url/callback` (missing `/api/mpesa/` path)

✅ **CORRECT:**
- `https://your-url/api/mpesa/callback`
- `https://abc123.ngrok.io/api/mpesa/callback`
- `https://project.vercel.app/api/mpesa/callback`

---

## FIELDS IN M-PESA SETTINGS FORM

```
┌─────────────────────────────────────────┐
│  Callback URL                           │
│  https://your-url/api/mpesa/callback    │  ← PASTE HERE
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Timeout URL                            │
│  https://your-url/api/mpesa/timeout     │  ← PASTE HERE
└─────────────────────────────────────────┘
```

---

## WHAT THESE URLS DO

### Callback URL
- **When:** User completes payment successfully
- **What:** M-Pesa confirms payment to your system
- **Result:** Transaction marked as PAID

### Timeout URL
- **When:** User cancels payment or prompt expires
- **What:** M-Pesa notifies your system of failure
- **Result:** Transaction marked as FAILED/CANCELLED

---

## DEPLOYMENT FLOWCHART

```
Do you have a domain?
│
├─ NO  → Use Ngrok (development)
│        https://[ngrok-id].ngrok.io/api/mpesa/callback
│
└─ YES → Is it on Vercel?
   │
   ├─ YES → https://[project].vercel.app/api/mpesa/callback
   │
   └─ NO  → https://your-domain.com/api/mpesa/callback
```

---

## STILL NOT WORKING?

1. **Check Ngrok is running:** `ngrok http 5173`
2. **Verify dev server:** `npm run dev`
3. **Test URL:** `curl https://your-url/api/mpesa/callback`
4. **Check logs:** Look at browser console for errors
5. **See full guide:** MPESA_URLS_SPECIFICATION.md

---

## SHORT URLS (Copy Ready)

### For Ngrok
```
https://[NGROK-ID].ngrok.io/api/mpesa/callback
https://[NGROK-ID].ngrok.io/api/mpesa/timeout
```

### For Vercel
```
https://[PROJECT].vercel.app/api/mpesa/callback
https://[PROJECT].vercel.app/api/mpesa/timeout
```

### For Custom
```
https://your-domain.com/api/mpesa/callback
https://your-domain.com/api/mpesa/timeout
```

---

**Last Updated:** 2024
**Documentation:** See MPESA_URLS_SPECIFICATION.md for full guide
