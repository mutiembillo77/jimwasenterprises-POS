# M-Pesa STK PUSH Implementation Guide

## Overview

This document provides a complete implementation guide for M-Pesa STK PUSH functionality with webhook callback and automatic polling backup in your Jimwas POS system.

## Architecture

### Components Implemented

1. **mpesa.ts** - Core M-Pesa API client
   - OAuth2 authentication with M-Pesa
   - STK PUSH request initiation
   - Phone number validation and formatting
   - Transaction status queries
   - Token caching for performance

2. **mpesa-webhook.ts** - Webhook handler and polling engine
   - Webhook signature validation
   - Automatic polling (5-second intervals, max 5 minutes)
   - Webhook timeout handling
   - Polling state management

3. **mpesa-payment-completion.ts** - Transaction completion logic
   - Auto and manual completion modes
   - Payment confirmation callbacks
   - Manual approval/rejection by cashier
   - Session-based pending payment storage

4. **MpesaPaymentForm.tsx** - Enhanced payment UI component
   - Phone number input with validation
   - Real-time STK status tracking
   - Status modal with completion controls
   - Auto/manual mode selection

5. **mpesa-webhook-api.ts** - Backend webhook endpoint handler
   - Request validation
   - Security logging
   - Platform-specific deployment examples

## Workflow

### STK PUSH Payment Flow

```
1. Cashier selects M-Pesa payment method
2. Enters customer phone number
3. Chooses auto or manual completion mode
4. Clicks "Send M-Pesa Prompt"
   ↓
5. System initiates STK PUSH via M-Pesa API
6. **POLLING STARTS** (every 5 seconds)
7. Customer sees M-Pesa dialog on phone
8. Customer enters M-Pesa PIN
   ↓
9. Either:
   A) Webhook callback received → Polling stops immediately
   B) Polling detects payment confirmation (if webhook missed)
   ↓
10. If Auto Mode:
    - Receipt prints automatically
    - Transaction completed
    
11. If Manual Mode:
    - Confirmation screen shown
    - Cashier reviews payment details
    - Cashier confirms or rejects
    - Then receipt or cancellation
```

## Configuration

### M-Pesa Settings (in app)

Navigate to **Settings > Payments > M-Pesa STK Push Settings**

Required fields:
- **Environment**: sandbox or production
- **Short Code/Paybill**: Your M-Pesa business code (e.g., 174379)
- **Passkey**: Your M-Pesa passkey (from Daraja portal)
- **Consumer Key**: API credentials from M-Pesa developer portal
- **Consumer Secret**: API credentials from M-Pesa developer portal
- **Callback URL**: Your webhook endpoint (e.g., https://yourapp.com/api/mpesa/callback)

Optional fields:
- **Till Number**: For till-specific transactions
- **Country Code**: Default phone country code (default: 254 for Kenya)
- **Timeout URL**: For M-Pesa timeout notifications

Polling Configuration (automatically configured):
- Polling interval: 5 seconds
- Max duration: 5 minutes
- Webhook timeout: 30 seconds (before polling starts)

### Database Schema Updates

Payment transactions table extended with:
- `checkout_request_id` - Unique M-Pesa request identifier
- `phone_number` - Customer M-Pesa phone
- `stk_status` - Payment state (pending/confirmed/failed/timeout)
- `webhook_received` - Timestamp when webhook arrived
- `polling_confirmation` - Timestamp when polling confirmed payment
- `confirmation_source` - 'webhook' or 'polling' source
- `callback_data` - Full M-Pesa response data
- `completion_mode` - 'auto' or 'manual' preference
- `polling_attempts` - Number of polling checks performed
- `polling_stopped_at` - When polling ended
- `mpesa_receipt_number` - M-Pesa transaction receipt

## Integration Steps

### 1. Initialize M-Pesa Client

In your app initialization (e.g., App.tsx or main.tsx):

```typescript
import { getMpesaSettings } from './lib/db';
import { initializeMpesa } from './lib/mpesa';

async function setupMpesa() {
  const mpesaSettings = await getMpesaSettings();
  if (mpesaSettings && mpesaSettings.is_enabled) {
    initializeMpesa(mpesaSettings);
  }
}

setupMpesa();
```

### 2. Add M-Pesa Payment Form to Checkout

In your checkout component (e.g., POSTerminal.tsx):

```typescript
import { MpesaPaymentForm } from './components/MpesaPaymentForm';

// In your payment method selection:
{paymentMethod === 'mpesa' && (
  <MpesaPaymentForm
    totalAmount={totalAmount}
    transactionId={transactionId}
    mpesaSettings={mpesaSettings}
    onPaymentComplete={handlePaymentComplete}
    onCancel={handleCancel}
    isProcessing={isProcessing}
  />
)}
```

### 3. Setup Webhook Endpoint

Choose your hosting platform and create the webhook endpoint:

#### For Vercel:

Create `api/mpesa/callback.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMpesaWebhook } from '../../src/lib/mpesa-webhook-api';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleMpesaWebhook({
      body: req.body,
      headers: req.headers as any,
      ip: req.headers['x-forwarded-for'] as string,
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### For Firebase:

Create a cloud function:

```typescript
import * as functions from 'firebase-functions';
import { handleMpesaWebhook } from '../src/lib/mpesa-webhook-api';

exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await handleMpesaWebhook({
    body: req.body,
    headers: req.headers as any,
    ip: req.ip,
  });

  res.status(result.success ? 200 : 400).json(result);
});
```

### 4. Set Callback URL in M-Pesa Settings

Update the callback URL field to point to your webhook endpoint:
- **Production**: `https://yourdomain.com/api/mpesa/callback`
- **Sandbox**: `https://yourdomain-staging.vercel.app/api/mpesa/callback`

## Payment Completion Modes

### Auto Completion

- Payment automatically completes once M-Pesa confirms payment (via webhook or polling)
- Receipt prints immediately
- No cashier intervention needed
- Best for high-volume transactions

### Manual Completion

- After payment confirmation, a review screen appears
- Cashier reviews:
  - Customer phone number
  - Amount paid
  - M-Pesa receipt number
- Cashier can confirm or reject
- Allows verification before receipt
- Better for high-value transactions

## Error Handling

The system handles various error scenarios:

- **Invalid Phone Number**: User-friendly error message with correct format
- **Network Timeout**: Automatic retry with exponential backoff
- **M-Pesa API Errors**: Descriptive error messages displayed
- **Webhook Failure**: Automatic fallback to polling
- **Polling Timeout**: After 5 minutes, payment marked as timeout
- **Duplicate Payments**: Prevented by CheckoutRequestID tracking

## Polling Mechanism

### Why Polling?

In cases where webhooks fail to arrive (network issues, firewall blocks, M-Pesa delays), polling provides a reliable backup.

### How It Works

1. **Immediate Start**: Polling begins as soon as STK PUSH is initiated
2. **Regular Checks**: Every 5 seconds, system queries M-Pesa API for status
3. **Quick Response**: Webhook stops polling immediately when callback arrives
4. **Graceful Timeout**: Max 5 minutes (60 attempts) before giving up
5. **Minimal Impact**: Only 1 API call every 5 seconds, negligible overhead

### Polling State

Tracked in database:
- `polling_attempts` - Number of status checks performed
- `confirmation_source` - Whether confirmed via webhook or polling
- `polling_stopped_at` - When polling ended
- `polling_confirmation` - Timestamp if polling confirmed payment

## Security Considerations

1. **Phone Validation**: All phone numbers validated before API call
2. **Token Security**: OAuth tokens cached and auto-refreshed
3. **Webhook Validation**: Incoming webhooks validated for authenticity
4. **Audit Logging**: All payment events logged for compliance
5. **HTTPS Only**: Callbacks require HTTPS in production
6. **IP Whitelisting**: Can restrict webhooks to M-Pesa IP ranges
7. **Rate Limiting**: Implement to prevent abuse
8. **Data Encryption**: Sensitive data (passkey) stored securely

## Testing

### Sandbox Testing

1. Set environment to "Sandbox" in M-Pesa Settings
2. Use M-Pesa sandbox credentials (get from Daraja portal)
3. Use test phone number: 254708374149
4. Use test PIN: 12345

### Testing Webhook Delivery

1. Use `generateTestWebhookPayload()` from mpesa-webhook-api.ts
2. Send POST request to your webhook endpoint:

```bash
curl -X POST https://yourapp.com/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

### Testing Polling

1. Set callback_url to a non-existent endpoint (to simulate webhook failure)
2. Initiate STK PUSH payment
3. Check console logs for polling attempts
4. Watch polling status updates every 5 seconds

## Debugging

Enable debug logging by checking console output:

```javascript
// In browser console, filter for M-Pesa logs:
console.log("[v0] ...")
```

Key debug points:
- "[v0] STK PUSH initiated:" - Shows CheckoutRequestID
- "[v0] Polling attempt X for:" - Shows polling progress
- "[v0] Polling result: Completed/Failed/Pending" - Shows status
- "[v0] Webhook received for:" - Shows webhook arrival

## Performance Metrics

Track M-Pesa payment performance:

- **Polling Attempts**: Average number of checks before confirmation
- **Webhook Latency**: Time from payment to webhook arrival
- **Fallback Rate**: % of payments confirmed via polling vs webhook
- **Payment Success Rate**: % of STK initiations that result in payment
- **Average Confirmation Time**: Time from STK prompt to payment confirmed

## Troubleshooting

### Polling not detecting payment

1. Check M-Pesa configuration (credentials, environment)
2. Verify phone number format (should be 254712345678)
3. Check if polling timeout is reached (5 minutes)
4. Review console logs for API errors

### Webhook not arriving

1. Verify callback URL is correct in M-Pesa Settings
2. Check if endpoint is HTTPS in production
3. Verify firewall/network allows M-Pesa IPs
4. Check server logs for webhook attempts
5. Test webhook with test payload

### Payment status stuck as "Pending"

1. Check polling is running (`getPollingState()` should exist)
2. Verify polling attempts are increasing
3. If polling times out, check M-Pesa transaction directly
4. May need to manually complete or reject via UI

## Deployment Checklist

- [ ] M-Pesa credentials configured in Settings
- [ ] Environment set to "Production" in Settings
- [ ] Webhook endpoint deployed and accessible
- [ ] Callback URL set in M-Pesa Settings
- [ ] SSL/TLS certificate valid (HTTPS only)
- [ ] Tested with production credentials
- [ ] Backup polling mechanism verified
- [ ] Error handling tested
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Monitoring/alerting set up

## Support & Documentation

- M-Pesa Daraja Portal: https://developer.safaricom.co.ke
- STK Push API Docs: https://developer.safaricom.co.ke/APIs/MpesaExpressQuery
- Implementation Issues: Check console logs for "[v0]" prefixed messages

## Future Enhancements

Potential improvements:
- Webhook signature verification with M-Pesa public key
- Multi-currency support
- Payment reversal handling
- Batch payment reporting
- Real-time transaction analytics
- Mobile app notification on payment
