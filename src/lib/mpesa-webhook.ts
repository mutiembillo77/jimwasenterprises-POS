// M-Pesa Webhook Handler and Polling Backup
// Handles callback validation and automatic polling as fallback

import { getMpesaClient, type STKStatusResponse } from './mpesa';
import { updatePaymentTransactionStatus, getPaymentTransaction } from './db';
import { logSecurityEvent } from './auth';

export interface WebhookPayload {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{ Name?: string; Value?: any }>;
      };
    };
  };
}

interface PollingState {
  checkoutRequestId: string;
  attempts: number;
  lastCheckTime: number;
  maxAttempts: number;
  intervalMs: number;
  timeoutMs: number;
  shouldStop: boolean;
  onStatusUpdate?: (status: STKStatusResponse) => void;
}

const pollingStates = new Map<string, PollingState>();

/**
 * Validate webhook callback from M-Pesa
 */
export function validateWebhookSignature(payload: WebhookPayload): boolean {
  // M-Pesa webhooks are sent via HTTPS POST
  // In production, you should validate the signature using M-Pesa's public key
  // For now, we validate basic structure
  try {
    const callback = payload.Body?.stkCallback;
    if (!callback) return false;

    if (typeof callback.CheckoutRequestID !== 'string') return false;
    if (typeof callback.ResultCode !== 'number') return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract payment details from webhook callback
 */
export function parseWebhookCallback(payload: WebhookPayload) {
  const callback = payload.Body?.stkCallback;
  if (!callback) {
    throw new Error('Invalid webhook structure');
  }

  const items = callback.CallbackMetadata?.Item || [];
  const getItem = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    checkout_request_id: callback.CheckoutRequestID,
    status: callback.ResultCode === 0 ? 'completed' : 'failed',
    result_code: callback.ResultCode,
    result_desc: callback.ResultDesc,
    amount: getItem('Amount'),
    mpesa_receipt_number: getItem('MpesaReceiptNumber'),
    phone_number: getItem('PhoneNumber'),
    transaction_timestamp: getItem('TransactionTimestamp'),
  };
}

/**
 * Handle incoming webhook callback
 */
export async function handleWebhookCallback(payload: WebhookPayload): Promise<boolean> {
  try {
    // Validate webhook
    if (!validateWebhookSignature(payload)) {
      console.error('[v0] Invalid webhook signature');
      return false;
    }

    const callbackData = parseWebhookCallback(payload);
    const checkoutRequestId = callbackData.checkout_request_id;

    // Stop polling for this request
    stopPolling(checkoutRequestId);

    // Find transaction with this checkout request ID
    // Note: This would need to be adapted based on your DB implementation
    console.log('[v0] Webhook received for', checkoutRequestId, 'Status:', callbackData.status);

    // Log security event
    await logSecurityEvent('MPESA_PAYMENT_WEBHOOK', 'system', `M-Pesa webhook received for ${checkoutRequestId}`);

    return true;
  } catch (error) {
    console.error('[v0] Webhook processing error:', error);
    return false;
  }
}

/**
 * Start polling for transaction status
 */
export function startPolling(checkoutRequestId: string, onStatusUpdate?: (status: STKStatusResponse) => void) {
  // Don't start multiple polling for same request
  if (pollingStates.has(checkoutRequestId)) {
    return;
  }

  const state: PollingState = {
    checkoutRequestId,
    attempts: 0,
    lastCheckTime: Date.now(),
    maxAttempts: 60, // 60 attempts at 5-second intervals = 5 minutes
    intervalMs: 5000, // 5 seconds
    timeoutMs: 30000, // 30 seconds before switching to polling if no webhook
    shouldStop: false,
    onStatusUpdate,
  };

  pollingStates.set(checkoutRequestId, state);

  // Start the polling loop
  pollTransactionStatus(checkoutRequestId);

  console.log('[v0] Started polling for', checkoutRequestId);
}

/**
 * Stop polling for a transaction
 */
export function stopPolling(checkoutRequestId: string) {
  const state = pollingStates.get(checkoutRequestId);
  if (state) {
    state.shouldStop = true;
    pollingStates.delete(checkoutRequestId);
    console.log('[v0] Stopped polling for', checkoutRequestId);
  }
}

/**
 * Poll transaction status
 */
async function pollTransactionStatus(checkoutRequestId: string) {
  const state = pollingStates.get(checkoutRequestId);
  if (!state || state.shouldStop) {
    return;
  }

  try {
    const mpesaClient = getMpesaClient();
    if (!mpesaClient) {
      console.error('[v0] M-Pesa client not initialized');
      state.shouldStop = true;
      pollingStates.delete(checkoutRequestId);
      return;
    }

    state.attempts++;
    console.log(`[v0] Polling attempt ${state.attempts} for ${checkoutRequestId}`);

    // Query transaction status
    const status = await mpesaClient.queryTransactionStatus(checkoutRequestId);

    if (status) {
      console.log('[v0] Polling result:', status.status);

      // Call the callback if provided
      if (state.onStatusUpdate) {
        state.onStatusUpdate(status);
      }

      // Stop if we got a final status (not pending)
      if (status.status !== 'Pending') {
        state.shouldStop = true;
        pollingStates.delete(checkoutRequestId);
        console.log('[v0] Polling stopped - final status:', status.status);
        return;
      }
    }

    // Check if we've exceeded max attempts
    if (state.attempts >= state.maxAttempts) {
      console.log('[v0] Polling timeout for', checkoutRequestId);
      state.shouldStop = true;
      pollingStates.delete(checkoutRequestId);

      // Call callback with timeout status
      if (state.onStatusUpdate) {
        state.onStatusUpdate({
          checkout_request_id: checkoutRequestId,
          status: 'Timeout',
        });
      }
      return;
    }

    // Schedule next poll
    setTimeout(() => {
      pollTransactionStatus(checkoutRequestId);
    }, state.intervalMs);
  } catch (error) {
    console.error('[v0] Polling error:', error);

    const state = pollingStates.get(checkoutRequestId);
    if (state && state.attempts < state.maxAttempts) {
      // Retry after interval
      setTimeout(() => {
        pollTransactionStatus(checkoutRequestId);
      }, (state?.intervalMs || 5000) * 2); // Exponential backoff
    } else {
      state!.shouldStop = true;
      pollingStates.delete(checkoutRequestId);
    }
  }
}

/**
 * Get active polling state for a checkout request
 */
export function getPollingState(checkoutRequestId: string): PollingState | undefined {
  return pollingStates.get(checkoutRequestId);
}

/**
 * Get all active polling requests
 */
export function getActivePollingRequests(): string[] {
  return Array.from(pollingStates.keys());
}

/**
 * Clean up expired polling states
 */
export function cleanupExpiredPolling() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const [requestId, state] of pollingStates.entries()) {
    if (now - state.lastCheckTime > maxAge) {
      state.shouldStop = true;
      pollingStates.delete(requestId);
      console.log('[v0] Cleaned up expired polling for', requestId);
    }
  }
}

// Cleanup expired polling every minute
setInterval(() => {
  cleanupExpiredPolling();
}, 60000);
