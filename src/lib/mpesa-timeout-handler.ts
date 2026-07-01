// M-Pesa Timeout Webhook Handler
// Processes timeout events when STK PUSH prompts expire or are cancelled by user

import type { PaymentTransaction } from './types';
import { savePaymentTransaction, getPaymentTransaction, logAuditEvent, logSecurityEvent } from './db';

export interface TimeoutWebhookPayload {
  Result?: {
    ResultType?: number;
    ResultCode?: number;
    ResultDesc?: string;
    OriginatorConversationID?: string;
    ConversationID?: string;
    TransactionID?: string;
    ReferenceData?: {
      ReferenceItem?: Array<{
        Key?: string;
        Value?: string;
      }>;
    };
  };
}

export interface TimeoutHandlerResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
  error?: string;
}

/**
 * Parse timeout webhook payload from M-Pesa
 */
export function parseTimeoutWebhook(payload: TimeoutWebhookPayload): {
  checkout_request_id?: string;
  result_code?: number;
  result_description?: string;
  conversation_id?: string;
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload.Result) {
    errors.push('Missing Result object in timeout payload');
  }

  let checkoutRequestId: string | undefined;
  const resultCode = payload.Result?.ResultCode;
  const resultDescription = payload.Result?.ResultDesc;
  const conversationId = payload.Result?.ConversationID;

  // Extract CheckoutRequestID from ReferenceData
  if (payload.Result?.ReferenceData?.ReferenceItem) {
    const checkoutItem = payload.Result.ReferenceData.ReferenceItem.find(
      item => item.Key === 'CheckoutRequestID'
    );
    checkoutRequestId = checkoutItem?.Value;
  }

  if (!checkoutRequestId) {
    errors.push('Missing CheckoutRequestID in timeout payload');
  }

  // Validate result code indicates timeout/cancellation
  const validTimeoutCodes = [1032, 1001, 500]; // 1032=User cancelled, 1001=Out of service, 500=Generic error
  if (resultCode && !validTimeoutCodes.includes(resultCode)) {
    // Not necessarily an error - could be a timeout
  }

  return {
    checkout_request_id: checkoutRequestId,
    result_code: resultCode,
    result_description: resultDescription,
    conversation_id: conversationId,
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Handle M-Pesa timeout webhook
 */
export async function handleTimeoutWebhook(
  payload: TimeoutWebhookPayload,
  userId?: string
): Promise<TimeoutHandlerResponse> {
  try {
    const parsed = parseTimeoutWebhook(payload);

    if (!parsed.valid || !parsed.checkout_request_id) {
      return {
        success: false,
        message: 'Invalid timeout webhook payload',
        error: parsed.errors.join('; '),
      };
    }

    // Find transaction by checkout request ID
    const transaction = await findTransactionByCheckoutRequestId(parsed.checkout_request_id);

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found for timeout',
        error: `No transaction found with checkout request ID: ${parsed.checkout_request_id}`,
      };
    }

    // Update transaction with timeout status
    const timeoutReason = mapTimeoutReason(parsed.result_code);
    const updatedTransaction: PaymentTransaction = {
      ...transaction,
      stk_status: 'timeout',
      status: 'failed',
      callback_data: payload,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await savePaymentTransaction(updatedTransaction);

    // Log security event for timeout
    await logSecurityEvent('MPESA_PAYMENT_TIMEOUT', userId || 'system', 
      `M-Pesa payment timed out for transaction ${transaction.id}. Reason: ${timeoutReason}`
    );

    // Log audit event
    await logAuditEvent('MPESA_PAYMENT_TIMEOUT', userId || 'system', 'payment', transaction.id,
      `STK PUSH timed out: ${timeoutReason} (Code: ${parsed.result_code})`
    );

    return {
      success: true,
      message: `Payment timeout processed for transaction ${transaction.id}`,
      transaction_id: transaction.id,
    };
  } catch (error) {
    console.error('[v0] Timeout webhook handler error:', error);
    return {
      success: false,
      message: 'Error processing timeout webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find transaction by checkout request ID
 */
async function findTransactionByCheckoutRequestId(checkoutRequestId: string): Promise<PaymentTransaction | null> {
  try {
    // This would typically query the database index
    // For now, returning null - implement based on your DB layer
    const transaction = await getPaymentTransaction(checkoutRequestId);
    return transaction || null;
  } catch {
    return null;
  }
}

/**
 * Map M-Pesa timeout result codes to human-readable reasons
 */
export function mapTimeoutReason(resultCode?: number): string {
  const reasons: Record<number, string> = {
    1032: 'User cancelled the transaction',
    1001: 'Out of service or network error',
    500: 'Server error during processing',
    0: 'Unknown error',
  };

  return reasons[resultCode || 0] || `Timeout with code ${resultCode}`;
}

/**
 * Check if a timeout indicates need for manual intervention
 */
export function requiresManualIntervention(resultCode?: number): boolean {
  // Codes that indicate user action vs system error
  const userCancelledCodes = [1032];
  const systemErrorCodes = [1001, 500];

  if (resultCode && userCancelledCodes.includes(resultCode)) {
    return false; // User cancelled - no intervention needed
  }

  if (resultCode && systemErrorCodes.includes(resultCode)) {
    return true; // System error - may need investigation
  }

  return false;
}

/**
 * Notify transaction handler of timeout (for retry/polling logic)
 */
export async function notifyTransactionTimeout(
  transactionId: string,
  resultCode?: number
): Promise<{
  should_retry: boolean;
  should_poll: boolean;
  action: 'retry' | 'manual_verify' | 'cancel' | 'none';
}> {
  const requiresIntervention = requiresManualIntervention(resultCode);
  const wasUserCancelled = resultCode === 1032;

  return {
    should_retry: requiresIntervention && !wasUserCancelled,
    should_poll: false, // Polling already stopped on timeout
    action: wasUserCancelled ? 'manual_verify' : requiresIntervention ? 'manual_verify' : 'cancel',
  };
}
