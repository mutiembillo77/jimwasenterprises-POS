# M-Pesa Timeout URL Setup Guide

## Overview

The Timeout URL is a webhook endpoint that M-Pesa calls when an STK PUSH payment prompt expires or is cancelled by the customer. This is critical for handling incomplete transactions and maintaining accurate payment state.

## What is a Timeout Webhook?

A timeout webhook is sent by M-Pesa when:
- **Customer cancels** the M-Pesa prompt (Result Code: 1032)
- **Prompt expires** after 2 minutes of inactivity (Result Code: 1001)
- **Network error** prevents completion (Result Code: 500)
- **System error** occurs during processing (Result Code: 500+)

## Understanding Timeout Response Codes

| Code | Scenario | Action |
|------|----------|--------|
| 1032 | User cancelled | Mark transaction as failed, allow retry |
| 1001 | Out of service | Mark as timeout, may retry or escalate |
| 500 | System error | Mark as failed, investigate |
| 0 | Unknown error | Mark as timeout, escalate |

## Implementation Options

### Option 1: Vercel (Recommended for POS Systems)

**Complexity**: Simple | **Cost**: Free tier included | **Scalability**: Auto

#### Step 1: Create API Route

Create `src/pages/api/mpesa/timeout.ts` or `app/api/mpesa/timeout/route.ts`:

```typescript
// pages/api/mpesa/timeout.ts (Next.js Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleTimeoutWebhook } from '@/lib/mpesa-timeout-handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleTimeoutWebhook(req.body);
    
    if (result.success) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
        ...result,
      });
    } else {
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: result.error,
        ...result,
      });
    }
  } catch (error) {
    console.error('Timeout webhook error:', error);
    return res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

#### Step 2: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "Add M-Pesa timeout URL endpoint"

# Push to Vercel
git push origin main
```

#### Step 3: Configure Timeout URL

- Your Vercel deployment URL: `https://your-project.vercel.app`
- Timeout URL: `https://your-project.vercel.app/api/mpesa/timeout`

### Option 2: Firebase Cloud Functions

**Complexity**: Moderate | **Cost**: Free tier available | **Scalability**: Auto

#### Step 1: Initialize Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

#### Step 2: Create Timeout Handler

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { handleTimeoutWebhook } from '../../../src/lib/mpesa-timeout-handler';

export const mpesaTimeout = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleTimeoutWebhook(req.body);
    
    res.json({
      ResultCode: result.success ? 0 : 1,
      ResultDesc: result.success ? 'Accepted' : result.error,
      ...result,
    });
  } catch (error) {
    console.error('Timeout webhook error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal server error',
    });
  }
});
```

#### Step 3: Deploy

```bash
firebase deploy --only functions:mpesaTimeout
```

#### Step 4: Get Function URL

Find your function URL in Firebase Console:
- `https://us-central1-<project-id>.cloudfunctions.net/mpesaTimeout`

### Option 3: AWS Lambda

**Complexity**: Moderate | **Cost**: Free tier includes requests | **Scalability**: Auto

#### Step 1: Create Lambda Function

Use AWS Console to create a new Lambda function with Node.js runtime.

#### Step 2: Add Handler Code

```javascript
// lambda handler
const { handleTimeoutWebhook } = require('./lib/mpesa-timeout-handler');

exports.handler = async (event) => {
  try {
    // Parse POST body
    let body = event.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const result = await handleTimeoutWebhook(body);
    
    return {
      statusCode: result.success ? 200 : 400,
      body: JSON.stringify({
        ResultCode: result.success ? 0 : 1,
        ResultDesc: result.success ? 'Accepted' : result.error,
        ...result,
      }),
    };
  } catch (error) {
    console.error('Timeout webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ResultCode: 1,
        ResultDesc: 'Internal server error',
        error: error.message,
      }),
    };
  }
};
```

#### Step 3: Set Up API Gateway

1. Create REST API in API Gateway
2. Configure POST method pointing to Lambda
3. Deploy and note the endpoint URL

#### Step 4: Configure Timeout URL

API Gateway URL format:
- `https://<api-id>.execute-api.<region>.amazonaws.com/prod/mpesa-timeout`

### Option 4: Custom VPS (Express.js)

**Complexity**: Complex | **Cost**: Variable | **Scalability**: Manual

#### Step 1: Create Express Route

```typescript
// src/routes/mpesa-timeout.ts
import express, { Request, Response } from 'express';
import { handleTimeoutWebhook } from '../lib/mpesa-timeout-handler';

const router = express.Router();

router.post('/timeout', async (req: Request, res: Response) => {
  try {
    const result = await handleTimeoutWebhook(req.body);
    
    res.json({
      ResultCode: result.success ? 0 : 1,
      ResultDesc: result.success ? 'Accepted' : result.error,
      ...result,
    });
  } catch (error) {
    console.error('Timeout webhook error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal server error',
    });
  }
});

export default router;
```

#### Step 2: Register Route in App

```typescript
import mpesaRoutes from './routes/mpesa-timeout';

app.use('/api/mpesa', mpesaRoutes);
```

#### Step 3: Set Up SSL Certificate

```bash
# Using Let's Encrypt (free)
sudo certbot certonly --standalone -d your-domain.com

# Nginx configuration
server {
  listen 443 ssl http2;
  server_name your-domain.com;
  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
  
  location /api/mpesa/timeout {
    proxy_pass http://localhost:3000;
  }
}
```

#### Step 4: Configure Timeout URL

- Your VPS domain: `your-domain.com`
- Timeout URL: `https://your-domain.com/api/mpesa/timeout`

### Option 5: Ngrok (Local Development)

**Complexity**: Simple | **Cost**: Free | **Scalability**: Not for production

#### Step 1: Install Ngrok

```bash
# Download from https://ngrok.com/download
# Or: npm install -g ngrok
```

#### Step 2: Start Local Server

```bash
# Terminal 1: Start your development server
npm run dev

# Terminal 2: Start Ngrok
ngrok http 3000
```

#### Step 3: Configure Timeout URL

Ngrok will output:
```
Forwarding https://a1b2c3d4e5f6.ngrok.io -> http://localhost:3000
```

Use: `https://a1b2c3d4e5f6.ngrok.io/api/mpesa/timeout`

## Testing Your Timeout URL

### Manual Testing with cURL

```bash
curl -X POST https://your-domain.com/api/mpesa/timeout \
  -H "Content-Type: application/json" \
  -d '{
    "Result": {
      "ResultType": 0,
      "ResultCode": 1032,
      "ResultDesc": "Request cancelled by user",
      "OriginatorConversationID": "TEST-ID",
      "ConversationID": "TEST-CONV",
      "TransactionID": "TEST-TXN",
      "ReferenceData": {
        "ReferenceItem": [
          {
            "Key": "CheckoutRequestID",
            "Value": "ws_CO_12345"
          }
        ]
      }
    }
  }'
```

### Using the Test Button in Settings

1. Open POS Settings → M-Pesa Configuration
2. Enter your timeout URL
3. Click "Send Test Webhook"
4. Check the response to verify endpoint is working

## Handling Timeout Scenarios

### Scenario 1: User Cancels (Code 1032)

**Action**: Mark transaction as failed, allow customer to retry

```typescript
const result = await handleTimeoutWebhook(payload);
// Transaction status updated to 'failed', stk_status to 'timeout'
// Customer can initiate new STK PUSH
```

### Scenario 2: Prompt Expires (Code 1001)

**Action**: Check if payment went through with polling, or mark as timeout

```typescript
// System will have already detected via polling if payment succeeded
// If not detected, timeout marks it as failed for retry
```

### Scenario 3: Network Error (Code 500)

**Action**: Log incident, may require manual verification

```typescript
const { should_retry, action } = await notifyTransactionTimeout(
  transactionId,
  resultCode
);
// Can be: 'retry', 'manual_verify', 'cancel'
```

## Security Considerations

### 1. Validate Webhook Signature

```typescript
import crypto from 'crypto';

function validateWebhookSignature(payload: any, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}
```

### 2. Rate Limiting

Protect against abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
});

app.post('/api/mpesa/timeout', limiter, handleTimeoutWebhook);
```

### 3. HTTPS Only

Always use HTTPS for webhook endpoints. M-Pesa requires it for production.

### 4. Duplicate Prevention

Check if transaction was already processed:

```typescript
async function isDuplicateTimeout(checkoutRequestId: string): Promise<boolean> {
  const transaction = await findTransactionByCheckoutRequestId(checkoutRequestId);
  return transaction?.stk_status === 'timeout';
}
```

## Monitoring & Debugging

### Enable Logging

```typescript
// In timeout handler
console.log('[v0] Timeout webhook received:', {
  checkoutRequestId: parsed.checkout_request_id,
  resultCode: parsed.result_code,
  timestamp: new Date().toISOString(),
});
```

### Monitor Webhook Responses

Set up alerts for:
- High timeout rate (>30% of transactions)
- Endpoint errors (5xx responses)
- Missing CheckoutRequestID in payload
- Duplicate timeout webhooks

### Test Endpoint Health

```bash
# Weekly health check
curl -X HEAD https://your-domain.com/api/mpesa/timeout

# Should return 405 (Method Not Allowed) for HEAD, indicating endpoint exists
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Timeouts not received | Wrong URL configured | Verify in M-Pesa Console |
| 404 errors | Endpoint doesn't exist | Check deployment, verify route exists |
| 500 errors | Server error | Check logs, verify DB connection |
| Duplicate processing | Missing deduplication | Implement idempotency check |
| Slow response | Timeout processing takes too long | Optimize DB queries, use async |

## Next Steps

1. **Set Up Your Endpoint**: Choose deployment option above
2. **Configure Timeout URL**: Update M-Pesa settings in POS app
3. **Test**: Use "Test Webhook" button in settings
4. **Monitor**: Set up error alerts and logging
5. **Go Live**: Update M-Pesa account with production URL

## Support

For issues or questions:
1. Check webhook logs in your deployment platform
2. Verify HTTPS is enabled
3. Test with sample payload
4. Contact M-Pesa support for webhook delivery issues
