# M-Pesa Webhook Endpoint Implementations

This guide shows how to implement the webhook endpoint for different backends.

---

## Vercel (Next.js) - App Router

**File: `app/api/mpesa/callback/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleMpesaCallback } from '@/lib/mpesa-webhook-api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const payload = await request.json();

    // Process callback
    const result = await handleMpesaCallback(payload);

    // Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[M-Pesa Webhook Error]', error);

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

**File: `pages/api/mpesa/callback.ts`** (Pages Router)

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleMpesaCallback } from '@/lib/mpesa-webhook-api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Process callback
    const result = await handleMpesaCallback(req.body);

    // Return success
    res.status(200).json(result);
  } catch (error) {
    console.error('[M-Pesa Webhook Error]', error);

    res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

## Firebase Cloud Functions

**File: `functions/src/mpesa.ts`**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleMpesaCallback } from '../lib/mpesa-webhook-api';

admin.initializeApp();

export const mpesaCallback = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).send('');
      return;
    }

    // Only POST allowed
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Validate request
      if (!req.body || typeof req.body !== 'object') {
        throw new Error('Invalid request body');
      }

      // Process callback
      const result = await handleMpesaCallback(req.body);

      // Log to Firestore for audit trail
      await admin
        .firestore()
        .collection('mpesa_webhooks')
        .add({
          payload: req.body,
          result,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'processed',
        });

      res.status(200).json(result);
    } catch (error) {
      console.error('[M-Pesa Webhook Error]', error);

      // Log error
      await admin
        .firestore()
        .collection('mpesa_webhooks')
        .add({
          payload: req.body,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'error',
        });

      res.status(500).json({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
```

**Deploy with:**
```bash
firebase deploy --only functions:mpesaCallback
```

---

## AWS Lambda + API Gateway

**File: `src/handlers/mpesa.ts`**

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleMpesaCallback } from '../lib/mpesa-webhook-api';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse body
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    // Process callback
    const result = await handleMpesaCallback(body);

    // Store in DynamoDB for audit trail
    await dynamodb.send(
      new PutCommand({
        TableName: process.env.WEBHOOKS_TABLE || 'mpesa-webhooks',
        Item: {
          checkoutRequestId:
            body.Body?.stkCallback?.CheckoutRequestID || 'unknown',
          timestamp: new Date().toISOString(),
          payload: body,
          result,
          status: 'processed',
        },
      })
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('[M-Pesa Webhook Error]', error);

    // Store error in DynamoDB
    try {
      await dynamodb.send(
        new PutCommand({
          TableName: process.env.WEBHOOKS_TABLE || 'mpesa-webhooks',
          Item: {
            checkoutRequestId: 'error',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed',
          },
        })
      );
    } catch (dbError) {
      console.error('Failed to log error to DynamoDB:', dbError);
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
```

**Deployment with SAM:**
```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  MpesaCallbackFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: mpesa-callback
      CodeUri: src/
      Handler: handlers/mpesa.handler
      Runtime: nodejs18.x
      Timeout: 30
      Environment:
        Variables:
          WEBHOOKS_TABLE: mpesa-webhooks
      Policies:
        - DynamoDBCrudPolicy:
            TableName: mpesa-webhooks
      Events:
        MpesaCallbackEvent:
          Type: Api
          Properties:
            Path: /mpesa-callback
            Method: POST
            RestApiId: !Ref MpesaApi

  MpesaApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod

  WebhooksTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: mpesa-webhooks
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: checkoutRequestId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
      KeySchema:
        - AttributeName: checkoutRequestId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
```

Deploy with:
```bash
sam build
sam deploy --guided
```

---

## Express.js (Node.js)

**File: `src/routes/mpesa.ts`**

```typescript
import express, { Router, Request, Response } from 'express';
import { handleMpesaCallback } from '../lib/mpesa-webhook-api';
import { db } from '../database';

const router = Router();

// Middleware for CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
  } else {
    next();
  }
});

// M-Pesa Callback Endpoint
router.post('/callback', async (req: Request, res: Response) => {
  try {
    // Log incoming webhook
    console.log('[M-Pesa Webhook] Received:', {
      timestamp: new Date().toISOString(),
      checkoutRequestId:
        req.body.Body?.stkCallback?.CheckoutRequestID || 'unknown',
    });

    // Validate request
    if (!req.body || typeof req.body !== 'object') {
      return res
        .status(400)
        .json({ error: 'Invalid request body' });
    }

    // Process callback
    const result = await handleMpesaCallback(req.body);

    // Store in database for audit trail
    await db.insert('mpesa_webhooks').values({
      checkout_request_id:
        req.body.Body?.stkCallback?.CheckoutRequestID || null,
      payload: JSON.stringify(req.body),
      result: JSON.stringify(result),
      created_at: new Date(),
      status: 'processed',
    });

    // Return success
    res.status(200).json(result);
  } catch (error) {
    console.error('[M-Pesa Webhook Error]', error);

    // Store error
    try {
      await db.insert('mpesa_webhooks').values({
        payload: JSON.stringify(req.body),
        error: error instanceof Error ? error.message : 'Unknown error',
        created_at: new Date(),
        status: 'error',
      });
    } catch (dbError) {
      console.error('Failed to log error:', dbError);
    }

    res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

**File: `src/server.ts`**

```typescript
import express from 'express';
import mpesaRoutes from './routes/mpesa';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/mpesa', mpesaRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## FastAPI (Python)

**File: `main.py`**

```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json
import logging

from lib.mpesa_webhook import handle_mpesa_callback
from database import db

app = FastAPI()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/api/mpesa/callback")
async def mpesa_callback(request: Request):
    try:
        # Parse request body
        payload = await request.json()

        logger.info(f"[M-Pesa Webhook] Received: {payload.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')}")

        # Validate request
        if not payload or not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Invalid request body")

        # Process callback
        result = await handle_mpesa_callback(payload)

        # Store in database
        db.insert('mpesa_webhooks', {
            'checkout_request_id': payload.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID'),
            'payload': json.dumps(payload),
            'result': json.dumps(result),
            'created_at': datetime.now(),
            'status': 'processed'
        })

        return result

    except Exception as error:
        logger.error(f"[M-Pesa Webhook Error] {str(error)}")

        # Store error
        try:
            db.insert('mpesa_webhooks', {
                'payload': json.dumps(payload if 'payload' in locals() else {}),
                'error': str(error),
                'created_at': datetime.now(),
                'status': 'error'
            })
        except Exception as db_error:
            logger.error(f"Failed to log error: {str(db_error)}")

        raise HTTPException(status_code=500, detail="Webhook processing failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Key Implementation Points

### 1. Always Validate Input
```typescript
if (!payload.Body?.stkCallback?.CheckoutRequestID) {
  throw new Error('Invalid webhook structure');
}
```

### 2. Handle Async Operations
```typescript
// Don't block the webhook response
// Return immediately, process asynchronously
res.status(200).json({ success: true });

// Then process in background
processPaymentInBackground(payload).catch(err => 
  logger.error('Background processing failed:', err)
);
```

### 3. Implement Idempotency
```typescript
// Prevent duplicate processing
const existingTransaction = await db.findUnique({
  where: { checkout_request_id: checkoutRequestId }
});

if (existingTransaction) {
  return { success: true, duplicate: true };
}

// Process new transaction
```

### 4. Log Everything
```typescript
logger.info('Webhook received', {
  checkoutRequestId: callback.CheckoutRequestID,
  amount: callback.Amount,
  timestamp: new Date().toISOString()
});
```

### 5. Handle Errors Gracefully
```typescript
try {
  // Process
} catch (error) {
  logger.error('Webhook error', error);
  // Return 500 so M-Pesa retries
  res.status(500).json({ error: 'Processing failed' });
}
```

---

## Testing the Endpoint

### Using curl:
```bash
curl -X POST https://your-domain.com/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "test-merchant-123",
      "CheckoutRequestID": "test-checkout-456",
      "ResultCode": 0,
      "ResultDesc": "The service request has been accepted successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 1000},
          {"Name": "MpesaReceiptNumber", "Value": "LK431H35OP"},
          {"Name": "PhoneNumber", "Value": 254712345678},
          {"Name": "TransactionTimestamp", "Value": 20231225120000}
        ]
      }
    }
  }
}
EOF
```

### Using Postman:
1. Create new POST request
2. URL: `https://your-domain.com/api/mpesa/callback`
3. Body → raw → JSON
4. Paste the JSON payload above
5. Click Send

### Expected Response:
```json
{
  "success": true,
  "checkout_request_id": "test-checkout-456",
  "message": "Payment processed successfully"
}
```
