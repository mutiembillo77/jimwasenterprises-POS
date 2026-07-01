// M-Pesa Payment Completion Logic
// Handles transaction completion with auto/manual modes

import type { STKStatusResponse } from './mpesa';
import { logAuditEvent, logSecurityEvent } from './auth';

export interface PaymentCompletionRequest {
  transaction_id: string;
  checkout_request_id: string;
  amount: number;
  phone_number: string;
  completion_mode: 'auto' | 'manual';
  payment_status: 'completed' | 'failed' | 'pending' | 'timeout';
  confirmation_source?: 'webhook' | 'polling';
  mpesa_receipt_number?: string;
  metadata?: Record<string, any>;
}

export interface PaymentCompletionResult {
  success: boolean;
  transaction_id: string;
  status: string;
  completion_timestamp?: string;
  receipt_number?: string;
  error?: string;
}

// Callbacks for payment completion events
const completionCallbacks: Map<string, (result: PaymentCompletionResult) => void> = new Map();

/**
 * Register a callback for payment completion
 */
export function onPaymentCompletion(
  transactionId: string,
  callback: (result: PaymentCompletionResult) => void
) {
  completionCallbacks.set(transactionId, callback);

  // Auto-cleanup after 10 minutes
  setTimeout(() => {
    completionCallbacks.delete(transactionId);
  }, 10 * 60 * 1000);
}

/**
 * Trigger payment completion based on mode
 */
export async function completePayment(
  request: PaymentCompletionRequest
): Promise<PaymentCompletionResult> {
  console.log('[v0] Payment completion initiated:', {
    transactionId: request.transaction_id,
    mode: request.completion_mode,
    source: request.confirmation_source,
  });

  try {
    // Validate payment status
    if (request.payment_status === 'failed' || request.payment_status === 'timeout') {
      return handlePaymentFailure(request);
    }

    // Handle auto-completion
    if (request.completion_mode === 'auto') {
      return await handleAutoCompletion(request);
    }

    // Handle manual completion (requires cashier confirmation)
    return await handleManualCompletion(request);
  } catch (error) {
    console.error('[v0] Payment completion error:', error);

    const result: PaymentCompletionResult = {
      success: false,
      transaction_id: request.transaction_id,
      status: 'error',
      error: error instanceof Error ? error.message : 'Payment completion failed',
    };

    triggerCompletionCallback(request.transaction_id, result);
    return result;
  }
}

/**
 * Handle automatic payment completion
 */
async function handleAutoCompletion(
  request: PaymentCompletionRequest
): Promise<PaymentCompletionResult> {
  try {
    // Log the completion
    await logAuditEvent(
      'MPESA_PAYMENT_COMPLETED',
      'system',
      'transaction',
      request.transaction_id,
      `Auto-completed M-Pesa payment via ${request.confirmation_source || 'unknown'}`
    );

    // Log security event
    await logSecurityEvent(
      'MPESA_PAYMENT_COMPLETED',
      'system',
      `M-Pesa payment completed automatically: ${request.transaction_id}`
    );

    const result: PaymentCompletionResult = {
      success: true,
      transaction_id: request.transaction_id,
      status: 'completed',
      completion_timestamp: new Date().toISOString(),
      receipt_number: request.mpesa_receipt_number,
    };

    console.log('[v0] Auto-completion successful:', result);
    triggerCompletionCallback(request.transaction_id, result);

    return result;
  } catch (error) {
    console.error('[v0] Auto-completion failed:', error);
    throw error;
  }
}

/**
 * Handle manual payment completion (awaiting cashier confirmation)
 */
async function handleManualCompletion(
  request: PaymentCompletionRequest
): Promise<PaymentCompletionResult> {
  try {
    // Store pending confirmation
    const pendingKey = `pending_completion_${request.transaction_id}`;
    const pendingData = {
      ...request,
      created_at: new Date().toISOString(),
      status: 'awaiting_confirmation',
    };

    // In a real app, this would be stored in DB
    // For now, we store in memory with cleanup
    sessionStorage.setItem(pendingKey, JSON.stringify(pendingData));

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      sessionStorage.removeItem(pendingKey);
    }, 10 * 60 * 1000);

    console.log('[v0] Payment awaiting manual confirmation:', request.transaction_id);

    const result: PaymentCompletionResult = {
      success: true,
      transaction_id: request.transaction_id,
      status: 'awaiting_confirmation',
    };

    triggerCompletionCallback(request.transaction_id, result);
    return result;
  } catch (error) {
    console.error('[v0] Manual completion setup failed:', error);
    throw error;
  }
}

/**
 * Confirm payment manually (called by cashier)
 */
export async function confirmPaymentManually(
  transactionId: string
): Promise<PaymentCompletionResult> {
  try {
    const pendingKey = `pending_completion_${transactionId}`;
    const pendingDataStr = sessionStorage.getItem(pendingKey);

    if (!pendingDataStr) {
      return {
        success: false,
        transaction_id: transactionId,
        status: 'not_found',
        error: 'Pending payment not found',
      };
    }

    const pendingData = JSON.parse(pendingDataStr) as PaymentCompletionRequest;

    // Log the manual confirmation
    await logAuditEvent(
      'MPESA_PAYMENT_MANUALLY_CONFIRMED',
      'system',
      'transaction',
      transactionId,
      `Cashier manually confirmed M-Pesa payment`
    );

    // Log security event
    await logSecurityEvent(
      'MPESA_PAYMENT_MANUALLY_CONFIRMED',
      'system',
      `M-Pesa payment manually confirmed: ${transactionId}`
    );

    // Clean up
    sessionStorage.removeItem(pendingKey);

    const result: PaymentCompletionResult = {
      success: true,
      transaction_id: transactionId,
      status: 'completed',
      completion_timestamp: new Date().toISOString(),
      receipt_number: pendingData.mpesa_receipt_number,
    };

    console.log('[v0] Manual confirmation successful:', result);
    triggerCompletionCallback(transactionId, result);

    return result;
  } catch (error) {
    console.error('[v0] Manual confirmation error:', error);

    const result: PaymentCompletionResult = {
      success: false,
      transaction_id: transactionId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Manual confirmation failed',
    };

    triggerCompletionCallback(transactionId, result);
    return result;
  }
}

/**
 * Reject payment manually (called by cashier)
 */
export async function rejectPaymentManually(
  transactionId: string,
  reason?: string
): Promise<PaymentCompletionResult> {
  try {
    const pendingKey = `pending_completion_${transactionId}`;
    sessionStorage.removeItem(pendingKey);

    // Log the rejection
    await logAuditEvent(
      'MPESA_PAYMENT_MANUALLY_REJECTED',
      'system',
      'transaction',
      transactionId,
      `Cashier manually rejected M-Pesa payment. Reason: ${reason || 'Not provided'}`
    );

    // Log security event
    await logSecurityEvent(
      'MPESA_PAYMENT_MANUALLY_REJECTED',
      'system',
      `M-Pesa payment rejected: ${transactionId}`
    );

    const result: PaymentCompletionResult = {
      success: false,
      transaction_id: transactionId,
      status: 'rejected',
      error: reason || 'Payment rejected by cashier',
    };

    console.log('[v0] Manual rejection logged:', result);
    triggerCompletionCallback(transactionId, result);

    return result;
  } catch (error) {
    console.error('[v0] Manual rejection error:', error);
    throw error;
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailure(
  request: PaymentCompletionRequest
): Promise<PaymentCompletionResult> {
  try {
    // Log the failure
    await logAuditEvent(
      'MPESA_PAYMENT_FAILED',
      'system',
      'transaction',
      request.transaction_id,
      `M-Pesa payment failed: ${request.payment_status}`
    );

    // Log security event
    await logSecurityEvent(
      'MPESA_PAYMENT_FAILED',
      'system',
      `M-Pesa payment failed for transaction ${request.transaction_id}`
    );

    const result: PaymentCompletionResult = {
      success: false,
      transaction_id: request.transaction_id,
      status: request.payment_status,
      error: `Payment ${request.payment_status}`,
    };

    console.log('[v0] Payment failure handled:', result);
    triggerCompletionCallback(request.transaction_id, result);

    return result;
  } catch (error) {
    console.error('[v0] Payment failure handling error:', error);
    throw error;
  }
}

/**
 * Get pending payment confirmation
 */
export function getPendingPaymentConfirmation(transactionId: string) {
  try {
    const pendingKey = `pending_completion_${transactionId}`;
    const pendingDataStr = sessionStorage.getItem(pendingKey);

    if (!pendingDataStr) {
      return null;
    }

    return JSON.parse(pendingDataStr) as PaymentCompletionRequest;
  } catch {
    return null;
  }
}

/**
 * Trigger completion callback
 */
function triggerCompletionCallback(transactionId: string, result: PaymentCompletionResult) {
  const callback = completionCallbacks.get(transactionId);
  if (callback) {
    try {
      callback(result);
    } catch (error) {
      console.error('[v0] Completion callback error:', error);
    }
  }
}

/**
 * Create a payment confirmation modal state
 */
export interface PaymentConfirmationState {
  isOpen: boolean;
  transactionId: string;
  amount: number;
  phoneNumber: string;
  mpesaReceiptNumber?: string;
  status: 'completed' | 'failed' | 'timeout' | 'pending';
  isAutoMode: boolean;
}

export function createConfirmationState(
  request: PaymentCompletionRequest,
  status: STKStatusResponse
): PaymentConfirmationState {
  return {
    isOpen: true,
    transactionId: request.transaction_id,
    amount: request.amount,
    phoneNumber: request.phone_number,
    mpesaReceiptNumber: status.mpesa_receipt_number,
    status: status.status.toLowerCase() as any,
    isAutoMode: request.completion_mode === 'auto',
  };
}
