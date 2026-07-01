# M-Pesa Callback URL Setup Guide

## Overview

The callback URL is where M-Pesa sends payment confirmation webhooks. Your POS system needs this URL configured in both:
1. **M-Pesa Settings** - In the POS application settings
2. **Your Backend** - To receive and process the webhooks

---

## Quick Start

### Option 1: Vercel (Recommended)

**Best for:** Easy deployment, automatic HTTPS, global CDN

1. Deploy to Vercel:
```bash
vercel deploy
```

2. Get your deployment URL (e.g., `https://jimwas-pos.vercel.app`)

3. In POS Settings → M-Pesa:
```
Callback URL: https://jimwas-pos.vercel.app/api/mpesa/callback
```

4. Set environment variables on Vercel:
```
MPESA_CALLBACK_URL=https://jimwas-pos.vercel.app/api/mpesa/callback
```

### Option 2: Firebase Cloud Functions

**Best for:** Serverless, integrates with Firestore

1. Deploy function:
```bash
firebase deploy --only functions
```

2. Copy function URL from Firebase Console

3. In POS Settings → M-Pesa:
```
Callback URL: https://region-project.cloudfunctions.net/mpesa-callback
```

### Option 3: Custom Domain / VPS

**Best for:** Full control, your own servers

1. Set up SSL certificate (Let's Encrypt is free)
2. Configure your backend server
3. In POS Settings → M-Pesa:
```
Callback URL: https://your-domain.com/api/mpesa/callback
```

### Option 4: Local Development (Ngrok)

**Best for:** Testing during development

1. Install Ngrok: https://ngrok.com
2. Start your local server: `npm run dev`
3. In new terminal: `ngrok http 3000`
4. Copy HTTPS URL from Ngrok output
5. In POS Settings → M-Pesa:
```
Callback URL: https://abc123.ngrok.io/api/mpesa/callback
```

---

## Detailed Setup by Deployment Type

### Vercel Setup

#### Step 1: Prepare Your Code
Create the webhook endpoint (`pages/api/mpesa/callback.ts` or `app/api/mpesa/callback/route.ts`):

```typescript
// pages/api/mpesa/callback.ts
import { handleMpesaCallback } from '../../../lib/mpesa-webhook-api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleMpesaCallback(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
```

#### Step 2: Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel deploy
```

#### Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add these variables:

```
MPESA_CALLBACK_URL=https://your-project.vercel.app/api/mpesa/callback
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORT_CODE=your-short-code
MPESA_ENVIRONMENT=sandbox (or production)
```

3. Redeploy to apply changes:
```bash
vercel deploy --prod
```

#### Step 4: Test the Webhook

Use the callback URL testing feature in M-Pesa settings to verify it's working.

---

### Firebase Cloud Functions Setup

#### Step 1: Create Cloud Function

Create `functions/src/mpesa.ts`:

```typescript
import * as functions from 'firebase-functions';
import { handleMpesaCallback } from '../lib/mpesa-webhook-api';

export const mpesaCallback = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = await handleMpesaCallback(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

#### Step 2: Deploy Function

```bash
cd functions
npm run deploy
```

#### Step 3: Get Function URL

In Firebase Console:
1. Go to Cloud Functions
2. Click on `mpesaCallback` function
3. Copy the Trigger URL

#### Step 4: Configure in POS Settings

Use the copied URL as your callback URL in M-Pesa settings.

---

### AWS Lambda Setup

#### Step 1: Create Lambda Function

1. Go to AWS Lambda Console
2. Create new function (Node.js 18+)
3. Add code:

```typescript
import { handleMpesaCallback } from '../lib/mpesa-webhook-api';

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const result = await handleMpesaCallback(body);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Webhook processing failed' }),
    };
  }
};
```

#### Step 2: Create API Gateway Trigger

1. In Lambda function, click "Add trigger"
2. Select "API Gateway"
3. Create new REST API
4. Copy the API Gateway URL

#### Step 3: Format Callback URL

Your callback URL should be:
```
https://{api-id}.execute-api.{region}.amazonaws.com/prod/mpesa-callback
```

---

### Custom Domain Setup

#### Step 1: Set Up SSL/TLS Certificate

Using Let's Encrypt (free):

```bash
# Ubuntu/Debian with Nginx
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

#### Step 2: Configure Web Server

**Nginx example:**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /api/mpesa/callback {
        proxy_pass http://localhost:3000/api/mpesa/callback;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Step 3: Ensure Backend is Running

Start your Node.js backend:
```bash
npm run start
```

#### Step 4: Use Domain as Callback URL

```
https://your-domain.com/api/mpesa/callback
```

---

### Local Development with Ngrok

#### Step 1: Install Ngrok

```bash
# macOS
brew install ngrok

# Windows
choco install ngrok

# Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip
unzip ngrok-v3-stable-linux-amd64.zip
```

#### Step 2: Authenticate Ngrok

```bash
ngrok config add-authtoken YOUR_TOKEN
```

(Get free token from https://dashboard.ngrok.com/auth/your-authtoken)

#### Step 3: Start Local Server

```bash
npm run dev
```

Typically runs on `http://localhost:3000`

#### Step 4: Create Public Tunnel

In new terminal:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

#### Step 5: Use Ngrok URL

```
Callback URL: https://abc123.ngrok.io/api/mpesa/callback
```

**Important:** Ngrok URL changes on restart, so you'll need to update the callback URL each time.

---

## Webhook Payload Structure

Your callback endpoint will receive:

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "string",
      "CheckoutRequestID": "string",
      "ResultCode": 0,
      "ResultDesc": "The service request has been accepted successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 1000 },
          { "Name": "MpesaReceiptNumber", "Value": "LK431H35OP" },
          { "Name": "PhoneNumber", "Value": 254712345678 },
          { "Name": "TransactionTimestamp", "Value": 20231225120000 }
        ]
      }
    }
  }
}
```

---

## Testing Your Callback URL

### Option 1: In-App Testing

Use the M-Pesa Callback Setup component in POS Settings:
1. Go to Settings → Payment Methods → M-Pesa
2. Click "Test Callback URL"
3. System sends sample webhook
4. Verify it's received and processed

### Option 2: Manual Testing with curl

```bash
curl -X POST https://your-callback-url.com/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-123",
        "CheckoutRequestID": "test-456",
        "ResultCode": 0,
        "ResultDesc": "The service request has been accepted successfully.",
        "CallbackMetadata": {
          "Item": [
            {"Name": "Amount", "Value": 1000},
            {"Name": "MpesaReceiptNumber", "Value": "LK431H35OP"},
            {"Name": "PhoneNumber", "Value": 254712345678}
          ]
        }
      }
    }
  }'
```

### Option 3: Webhook Inspector Tools

- **Webhook.cool**: https://webhook.cool
- **Webhook.site**: https://webhook.site
- **RequestBin**: https://requestbin.com

---

## Troubleshooting

### Callback URL Not Receiving Webhooks

1. **Check HTTPS**: M-Pesa requires HTTPS (except localhost)
   ```bash
   # Test SSL certificate
   openssl s_client -connect your-domain.com:443
   ```

2. **Check Firewall**: Ensure port 443 (HTTPS) is open
   ```bash
   # Linux
   sudo ufw allow 443

   # AWS Security Group
   Add inbound rule: HTTPS (443) from 0.0.0.0/0
   ```

3. **Check Logs**: Review application logs for errors
   ```bash
   # Vercel
   vercel logs

   # Firebase
   firebase functions:log

   # Docker/Server
   docker logs container-name
   ```

4. **Whitelist M-Pesa IPs**: Contact Safaricom for their API server IPs

### Timeout Issues

1. **Check Processing Time**: Callbacks have 30-second timeout
   ```typescript
   // Don't make long-running operations synchronously
   // Use background jobs instead
   ```

2. **Use Polling Backup**: System automatically polls M-Pesa if webhook times out

### Certificate Errors

```bash
# Verify certificate
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout

# Renew certificate
sudo certbot renew
```

---

## Security Best Practices

1. **Validate Webhook Signature**
   ```typescript
   import crypto from 'crypto';

   function validateSignature(payload, signature, secret) {
     const hash = crypto
       .createHmac('sha256', secret)
       .update(JSON.stringify(payload))
       .digest('hex');
     return hash === signature;
   }
   ```

2. **Use HTTPS Only**
   - Always use HTTPS for production
   - Keep SSL certificate updated

3. **Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });

   app.post('/api/mpesa/callback', limiter, handleCallback);
   ```

4. **Request Validation**
   - Validate all incoming data
   - Check `CheckoutRequestID` exists in database
   - Prevent double-processing

---

## M-Pesa Configuration Checklist

- [ ] Callback URL is configured in M-Pesa Settings
- [ ] Backend endpoint is created and deployed
- [ ] Endpoint accepts POST requests
- [ ] SSL certificate is valid (for production)
- [ ] Firewall rules allow incoming webhooks
- [ ] Environment variables are set
- [ ] Callback URL has been tested successfully
- [ ] Logging is in place for debugging
- [ ] Rate limiting is configured
- [ ] Webhook validation is implemented
