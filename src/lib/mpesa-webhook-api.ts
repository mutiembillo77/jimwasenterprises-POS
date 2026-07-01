// M-Pesa Webhook API Endpoint Handler
// For use in serverless functions or backend endpoints

import { handleWebhookCallback, type WebhookPayload } from './mpesa-webhook';
import { logSecurityEvent } from './auth';

export interface WebhookRequest {
  body: WebhookPayload;
  headers: Record<string, string>;
  ip?: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  requestId?: string;
  error?: string;
}

/**
 * Validate webhook request comes from M-Pesa
 * In production, you should verify the callback signature using M-Pesa's public key
 */
export function validateWebhookSource(headers: Record<string, string>, ip?: string): boolean {
  // M-Pesa calls typically come from their IP ranges
  // For production, validate:
  // 1. Request signature (if M-Pesa provides one)
  // 2. IP whitelist (if available)
  // 3. HTTPS requirement

  // Check for required headers
  const contentType = headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return false;
  }

  // In production, implement proper signature validation
  // using M-Pesa's public certificate/key

  return true;
}

/**
 * Main webhook handler - Call this from your backend endpoint
 * 
 * Example usage in Express:
 * ```
 * app.post('/api/mpesa/callback', async (req, res) => {
 *   const result = await handleMpesaWebhook({
 *     body: req.body,
 *     headers: req.headers as any,
 *     ip: req.ip,
 *   });
 *   res.json(result);
 * });
 * ```
 */
export async function handleMpesaWebhook(request: WebhookRequest): Promise<WebhookResponse> {
  const requestId = generateRequestId();

  try {
    console.log('[v0] Webhook received:', { requestId, timestamp: new Date().toISOString() });

    // Validate source
    if (!validateWebhookSource(request.headers, request.ip)) {
      console.warn('[v0] Webhook validation failed:', { requestId });
      
      await logSecurityEvent(
        'MPESA_WEBHOOK_INVALID_SOURCE',
        'system',
        `Invalid webhook source: ${request.ip}`
      );

      return {
        success: false,
        message: 'Webhook validation failed',
        requestId,
        error: 'Invalid source',
      };
    }

    // Validate webhook payload
    if (!request.body || !request.body.Body) {
      console.warn('[v0] Invalid webhook payload:', { requestId });
      
      return {
        success: false,
        message: 'Invalid payload structure',
        requestId,
        error: 'Missing Body',
      };
    }

    // Process the webhook
    const success = await handleWebhookCallback(request.body);

    if (success) {
      console.log('[v0] Webhook processed successfully:', { requestId });
      
      await logSecurityEvent(
        'MPESA_WEBHOOK_PROCESSED',
        'system',
        `M-Pesa webhook successfully processed: ${requestId}`
      );

      return {
        success: true,
        message: 'Webhook processed successfully',
        requestId,
      };
    } else {
      console.error('[v0] Webhook processing failed:', { requestId });
      
      return {
        success: false,
        message: 'Webhook processing failed',
        requestId,
        error: 'Processing error',
      };
    }
  } catch (error) {
    console.error('[v0] Webhook error:', { requestId, error });

    await logSecurityEvent(
      'MPESA_WEBHOOK_ERROR',
      'system',
      `M-Pesa webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`
    ).catch(err => console.error('[v0] Failed to log security event:', err));

    return {
      success: false,
      message: 'Webhook processing error',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Webhook Setup Instructions
 * 
 * For Vite/React POS application, you have several deployment options:
 * 
 * 1. VERCEL (Recommended)
 *    - Deploy your app to Vercel
 *    - Create a serverless function at api/mpesa/callback.ts:
 * 
 *      import type { VercelRequest, VercelResponse } from '@vercel/node';
 *      import { handleMpesaWebhook } from '../../src/lib/mpesa-webhook-api';
 * 
 *      export default async (req: VercelRequest, res: VercelResponse) => {
 *        if (req.method !== 'POST') {
 *          return res.status(405).json({ error: 'Method not allowed' });
 *        }
 * 
 *        const result = await handleMpesaWebhook({
 *          body: req.body,
 *          headers: req.headers as any,
 *          ip: req.headers['x-forwarded-for'] as string,
 *        });
 * 
 *        res.status(result.success ? 200 : 400).json(result);
 *      };
 * 
 *    - Callback URL: https://yourapp.vercel.app/api/mpesa/callback
 * 
 * 2. FIREBASE FUNCTIONS
 *    - Create a cloud function:
 * 
 *      import * as functions from 'firebase-functions';
 *      import { handleMpesaWebhook } from './mpesa-webhook-api';
 * 
 *      exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
 *        const result = await handleMpesaWebhook({
 *          body: req.body,
 *          headers: req.headers as any,
 *          ip: req.ip,
 *        });
 *        res.status(result.success ? 200 : 400).json(result);
 *      });
 * 
 *    - Callback URL: https://region-projectid.cloudfunctions.net/mpesaCallback
 * 
 * 3. AWS LAMBDA
 *    - Create a Lambda function with API Gateway trigger
 *    - Use the handler with event.body and event.headers
 * 
 * 4. SELF-HOSTED SERVER
 *    - Express.js:
 * 
 *      app.post('/api/mpesa/callback', async (req, res) => {
 *        const result = await handleMpesaWebhook({
 *          body: req.body,
 *          headers: req.headers as any,
 *          ip: req.ip,
 *        });
 *        res.json(result);
 *      });
 * 
 * IMPORTANT CONFIGURATION:
 * - Set callback_url in M-Pesa Settings to point to your endpoint
 * - URL must be HTTPS in production
 * - M-Pesa will make POST requests with JSON payload
 * - Your server should respond quickly (before M-Pesa timeout)
 * - Implement request validation in production (verify IP and signature)
 */

/**
 * Generate callback URL configuration for different platforms
 */
export function getCallbackUrlConfig(environment: 'sandbox' | 'production', provider: string) {
  const baseUrl = environment === 'production'
    ? process.env.PROD_CALLBACK_URL || 'https://yourapp.com'
    : process.env.SANDBOX_CALLBACK_URL || 'http://localhost:3000';

  const configs: Record<string, string> = {
    vercel: `${baseUrl}/api/mpesa/callback`,
    firebase: `${baseUrl}/mpesaCallback`,
    heroku: `${baseUrl}/api/mpesa/callback`,
    railway: `${baseUrl}/api/mpesa/callback`,
    replit: `${baseUrl}/api/mpesa/callback`,
  };

  return configs[provider] || configs.vercel;
}

/**
 * Test webhook payload for development
 */
export function generateTestWebhookPayload(status: 'success' | 'failure' = 'success') {
  const checkoutRequestId = `ws_CO_${Date.now()}`;
  const timestamp = new Date().toISOString().replace(/[:\-.]/g, '').slice(0, 14);

  return {
    Body: {
      stkCallback: {
        MerchantRequestID: `${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: status === 'success' ? 0 : 1,
        ResultDesc: status === 'success' ? 'The service request has been processed successfully.' : 'An error occurred processing the request',
        CallbackMetadata: status === 'success' ? {
          Item: [
            { Name: 'Amount', Value: 1000 },
            { Name: 'MpesaReceiptNumber', Value: 'QTI61H7DRV' },
            { Name: 'TransactionTimestamp', Value: timestamp },
            { Name: 'PhoneNumber', Value: '254708374149' },
          ],
        } : undefined,
      },
    },
  };
}
