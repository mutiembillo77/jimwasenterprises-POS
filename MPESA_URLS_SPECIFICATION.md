# M-Pesa Callback & Timeout URLs - Exact Specifications

## Quick Reference - Copy & Paste Values

### For Development/Testing (Ngrok)
```
Callback URL: https://[YOUR-NGROK-ID].ngrok.io/api/mpesa/callback
Timeout URL:  https://[YOUR-NGROK-ID].ngrok.io/api/mpesa/timeout
```

### For Vercel Production
```
Callback URL: https://[YOUR-PROJECT-NAME].vercel.app/api/mpesa/callback
Timeout URL:  https://[YOUR-PROJECT-NAME].vercel.app/api/mpesa/timeout
```

### For Firebase Cloud Functions
```
Callback URL: https://[REGION]-[PROJECT-ID].cloudfunctions.net/mpesaCallback
Timeout URL:  https://[REGION]-[PROJECT-ID].cloudfunctions.net/mpesaTimeout
```

### For AWS Lambda + API Gateway
```
Callback URL: https://[API-ID].execute-api.[REGION].amazonaws.com/prod/mpesa/callback
Timeout URL:  https://[API-ID].execute-api.[REGION].amazonaws.com/prod/mpesa/timeout
```

### For Custom VPS/Self-Hosted
```
Callback URL: https://your-domain.com/api/mpesa/callback
Timeout URL:  https://your-domain.com/api/mpesa/timeout
```

---

## Step-by-Step: Where to Paste in M-Pesa Settings Page

### 1. Open Settings Page
- Go to **Settings** → **Payment Methods** → **M-Pesa Configuration**

### 2. Locate the M-Pesa Settings Section

You'll see a form with these fields:

| Field | Value |
|-------|-------|
| **Business Short Code** | `603103` (Sandbox) or `174379` (Production) |
| **Consumer Key** | Your M-Pesa app consumer key |
| **Consumer Secret** | Your M-Pesa app consumer secret |
| **Passkey** | Your M-Pesa passkey (Lipa Na M-Pesa Online) |
| **Environment** | Select: `sandbox` or `production` |
| **Callback URL** | *See below* |
| **Timeout URL** | *See below* |

### 3. Callback URL Field
**Label:** "Callback URL" or "Confirmation URL"

**Paste Here:**
```
https://your-ngrok-id.ngrok.io/api/mpesa/callback
```
(Replace `your-ngrok-id` with your actual Ngrok ID)

**What this does:**
- Receives payment confirmations from M-Pesa
- Called when user completes payment successfully
- Marks transaction as confirmed

---

### 4. Timeout URL Field
**Label:** "Timeout URL"

**Paste Here:**
```
https://your-ngrok-id.ngrok.io/api/mpesa/timeout
```
(Replace `your-ngrok-id` with your actual Ngrok ID)

**What this does:**
- Receives timeout notifications from M-Pesa
- Called when user cancels payment or prompt expires
- Marks transaction as failed/timeout

---

## Important: URL Requirements

### ✓ MUST Have
- [x] HTTPS (not HTTP) - M-Pesa requires secure endpoints
- [x] Publicly accessible (not localhost)
- [x] Active and responding within 30 seconds
- [x] Valid SSL certificate

### ✓ MUST Include
- [x] `/api/mpesa/callback` - for callback URL
- [x] `/api/mpesa/timeout` - for timeout URL
- [x] Proper domain matching your deployment

### ✗ MUST NOT Have
- [x] Query parameters in the URL
- [x] Port numbers (e.g., `:3000`, `:8080`)
- [x] Trailing slashes (e.g., `/callback/`)
- [x] Authentication parameters

---

## Deployment-Specific Instructions

### **Option A: Development with Ngrok** ⭐ Recommended for Testing

#### Step 1: Get Your Ngrok URL
```bash
ngrok http 5173
```
Output: `Forwarding https://abc123def456.ngrok.io -> http://localhost:5173`

#### Step 2: Extract Your Ngrok ID
From the output above: `abc123def456` is your Ngrok ID

#### Step 3: Construct URLs
```
Callback URL: https://abc123def456.ngrok.io/api/mpesa/callback
Timeout URL:  https://abc123def456.ngrok.io/api/mpesa/timeout
```

#### Step 4: Paste in Settings
1. Go to Settings → M-Pesa Configuration
2. Find "Callback URL" field → paste the callback URL
3. Find "Timeout URL" field → paste the timeout URL
4. Click "Save M-Pesa Settings"

---

### **Option B: Vercel Production**

#### Step 1: Deploy to Vercel
```bash
vercel deploy --prod
```

#### Step 2: Get Your Project URL
After deployment, you'll get: `https://your-project-name.vercel.app`

#### Step 3: Construct URLs
```
Callback URL: https://your-project-name.vercel.app/api/mpesa/callback
Timeout URL:  https://your-project-name.vercel.app/api/mpesa/timeout
```

#### Step 4: Paste in Settings
1. Go to Settings → M-Pesa Configuration
2. Find "Callback URL" field → paste the callback URL
3. Find "Timeout URL" field → paste the timeout URL
4. Click "Save M-Pesa Settings"

---

### **Option C: Firebase Cloud Functions**

#### Step 1: Deploy Functions
```bash
firebase deploy --only functions
```

#### Step 2: Get Function URLs
```
mpesaCallback: https://us-central1-your-project.cloudfunctions.net/mpesaCallback
mpesaTimeout:  https://us-central1-your-project.cloudfunctions.net/mpesaTimeout
```

#### Step 3: Construct URLs
```
Callback URL: https://us-central1-your-project.cloudfunctions.net/mpesaCallback
Timeout URL:  https://us-central1-your-project.cloudfunctions.net/mpesaTimeout
```

#### Step 4: Paste in Settings
Same as above - paste into the M-Pesa settings fields

---

### **Option D: AWS Lambda + API Gateway**

#### Step 1: Get API Gateway URL
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

#### Step 2: Construct URLs
```
Callback URL: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/mpesa/callback
Timeout URL:  https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/mpesa/timeout
```

#### Step 3: Paste in Settings
Same as above

---

### **Option E: Custom VPS/Self-Hosted**

#### Step 1: Get Your Domain
Example: `pos.mycompany.com`

#### Step 2: Ensure HTTPS is Enabled
- SSL certificate must be valid
- Port 443 (HTTPS) must be open
- Test: `curl -I https://pos.mycompany.com`

#### Step 3: Construct URLs
```
Callback URL: https://pos.mycompany.com/api/mpesa/callback
Timeout URL:  https://pos.mycompany.com/api/mpesa/timeout
```

#### Step 4: Paste in Settings
Same as above

---

## How to Find Your Exact URLs

### For Ngrok
```bash
# Terminal output shows:
# Forwarding https://XXXXXXXX.ngrok.io -> http://localhost:5173

# Your URL is:
https://XXXXXXXX.ngrok.io
```

### For Vercel
```bash
# After deployment:
# Deployment ready on https://your-project-name.vercel.app

# Your URL is:
https://your-project-name.vercel.app
```

### For Firebase
```bash
# After deployment shows:
# ✔  Deploy complete!
# Function URL (mpesaCallback): https://us-central1-project-id.cloudfunctions.net/mpesaCallback

# Your URL is:
https://us-central1-project-id.cloudfunctions.net
```

### For AWS
```bash
# From API Gateway console:
# Invoke URL: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod

# Your URL is:
https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

---

## Testing Your URLs

### Before Saving, Test Each URL

#### Test Callback URL
```bash
curl -X POST https://your-url/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-123",
        "CheckoutRequestID": "ws_CO_123",
        "ResultCode": 0,
        "ResultDesc": "The service request has been initiated successfully"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Callback processed successfully"
}
```

#### Test Timeout URL
```bash
curl -X POST https://your-url/api/mpesa/timeout \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-456",
        "CheckoutRequestID": "ws_CO_456",
        "ResultCode": 1032,
        "ResultDesc": "Request cancelled by user"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Timeout processed successfully"
}
```

---

## Troubleshooting

### "Failed to connect to callback URL"
**Problem:** URL is not publicly accessible
**Solution:** 
- Verify Ngrok is running: `ngrok http 5173`
- Check deployment is complete (Vercel/Firebase/AWS)
- Verify HTTPS (not HTTP)

### "Connection refused"
**Problem:** Dev server not running
**Solution:**
- Start your dev server: `npm run dev`
- Verify port 5173 is in use: `lsof -i :5173`

### "SSL certificate error"
**Problem:** Invalid or self-signed certificate
**Solution:**
- Use proper domain with valid SSL
- For self-hosted, get cert from Let's Encrypt
- In development, Ngrok handles SSL automatically

### "URL already exists in M-Pesa account"
**Problem:** Same URL previously configured
**Solution:**
- Update instead of creating new config
- Or use different endpoint paths (e.g., `/callback-v2`)

### "Timeout webhook never triggered"
**Problem:** User not waiting for timeout or M-Pesa not calling
**Solution:**
- Verify timeout URL is correct in M-Pesa settings
- Check logs for webhook attempts
- Enable polling as backup (auto-enabled in POS system)

---

## Security Checklist

Before going to production:

- [ ] URLs use HTTPS (not HTTP)
- [ ] SSL certificate is valid and not self-signed
- [ ] Domain is properly configured
- [ ] Endpoints validate M-Pesa signatures
- [ ] Rate limiting is enabled
- [ ] Sensitive data is not logged
- [ ] Environment variables are used for API credentials
- [ ] URLs are not exposed in client-side code

---

## Quick Paste Templates

### Development (Ngrok)
```
Callback URL: https://[NGROK-ID].ngrok.io/api/mpesa/callback
Timeout URL:  https://[NGROK-ID].ngrok.io/api/mpesa/timeout
```

### Production (Vercel)
```
Callback URL: https://[PROJECT-NAME].vercel.app/api/mpesa/callback
Timeout URL:  https://[PROJECT-NAME].vercel.app/api/mpesa/timeout
```

### Production (Custom Domain)
```
Callback URL: https://[YOUR-DOMAIN].com/api/mpesa/callback
Timeout URL:  https://[YOUR-DOMAIN].com/api/mpesa/timeout
```

---

## Next Steps

1. **Get Your URL** - Using one of the deployment options above
2. **Construct Full URLs** - Add `/api/mpesa/callback` and `/api/mpesa/timeout`
3. **Open M-Pesa Settings** - Go to Settings → Payment Methods → M-Pesa
4. **Paste Callback URL** - Into the "Callback URL" field
5. **Paste Timeout URL** - Into the "Timeout URL" field
6. **Test URLs** - Use curl commands above to verify
7. **Save Settings** - Click "Save M-Pesa Settings"
8. **Verify Webhooks** - Make a test payment to confirm endpoints receive data

---

## Support & Resources

- **M-Pesa API Docs:** https://developer.safaricom.co.ke/docs
- **Ngrok Docs:** https://ngrok.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Firebase Functions Docs:** https://firebase.google.com/docs/functions
