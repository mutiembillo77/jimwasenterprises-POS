// M-Pesa STK PUSH Payment Form
// Handles phone input, STK status tracking, and completion modes

import { useState, useEffect } from 'react';
import { AlertCircle, Check, Phone, Loader, X } from 'lucide-react';
import { getMpesaClient, type STKPushResponse } from '../lib/mpesa';
import { startPolling, stopPolling, getPollingState } from '../lib/mpesa-webhook';
import { completePayment, confirmPaymentManually, rejectPaymentManually, getPendingPaymentConfirmation, type PaymentConfirmationState } from '../lib/mpesa-payment-completion';
import type { MpesaSettings } from '../lib/settings-types';

interface MpesaPaymentFormProps {
  totalAmount: number;
  transactionId: string;
  mpesaSettings?: MpesaSettings;
  onPaymentComplete: (success: boolean, receiptNumber?: string, error?: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function MpesaPaymentForm({
  totalAmount,
  transactionId,
  mpesaSettings,
  onPaymentComplete,
  onCancel,
  isProcessing: externalProcessing,
}: MpesaPaymentFormProps) {
  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [completionMode, setCompletionMode] = useState<'auto' | 'manual'>('auto');
  const [error, setError] = useState('');

  // STK PUSH states
  const [isProcessing, setIsProcessing] = useState(false);
  const [stkResponse, setStkResponse] = useState<STKPushResponse | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | 'timeout'>('pending');
  const [mpesaReceiptNumber, setMpesaReceiptNumber] = useState<string | undefined>();

  // Manual confirmation states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);

  // Phone number validation
  const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
    const mpesaClient = getMpesaClient();
    if (!mpesaClient) {
      return { valid: false, error: 'M-Pesa client not initialized' };
    }
    return mpesaClient.validatePhoneNumber(phone);
  };

  // Handle STK PUSH initiation
  const handleInitiateSTKPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error);
      return;
    }

    setIsProcessing(true);

    try {
      const mpesaClient = getMpesaClient();
      if (!mpesaClient) {
        setError('M-Pesa client not initialized');
        setIsProcessing(false);
        return;
      }

      // Initiate STK PUSH
      const response = await mpesaClient.initiateSTKPush({
        phone_number: phoneNumber,
        amount: totalAmount,
        account_reference: transactionId,
        transaction_desc: `Payment for transaction ${transactionId}`,
      });

      setStkResponse(response);

      if (response.success && response.checkout_request_id) {
        // Show status modal
        setShowStatusModal(true);
        setPaymentStatus('pending');

        // Start polling for status updates
        startPolling(response.checkout_request_id, (status) => {
          console.log('[v0] Polling status update:', status);

          if (status.status === 'Completed') {
            setPaymentStatus('completed');
            setMpesaReceiptNumber(status.mpesa_receipt_number);

            // Auto-complete if in auto mode
            if (completionMode === 'auto') {
              handleAutoCompletion(response.checkout_request_id!, status.mpesa_receipt_number);
            } else {
              // Show manual confirmation
              setShowConfirmation(true);
            }
          } else if (status.status === 'Failed') {
            setPaymentStatus('failed');
            setError('Payment failed. Please try again.');
          } else if (status.status === 'Timeout') {
            setPaymentStatus('timeout');
            setError('Payment timed out. Please try again.');
          }
        });

        console.log('[v0] STK PUSH initiated:', response.checkout_request_id);
      } else {
        setError(response.error || 'Failed to initiate STK PUSH');
      }
    } catch (err) {
      console.error('[v0] STK PUSH error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle auto-completion
  const handleAutoCompletion = async (checkoutRequestId: string, receiptNumber?: string) => {
    try {
      stopPolling(checkoutRequestId);

      await completePayment({
        transaction_id: transactionId,
        checkout_request_id: checkoutRequestId,
        amount: totalAmount,
        phone_number: phoneNumber,
        completion_mode: 'auto',
        payment_status: 'completed',
        confirmation_source: 'webhook', // Will be updated based on source
        mpesa_receipt_number: receiptNumber,
      });

      // Close modals and complete
      setShowStatusModal(false);
      setShowConfirmation(false);
      onPaymentComplete(true, receiptNumber);
    } catch (err) {
      console.error('[v0] Auto-completion error:', err);
      setError('Failed to complete payment');
    }
  };

  // Handle manual confirmation
  const handleConfirmPayment = async () => {
    if (!stkResponse?.checkout_request_id) return;

    try {
      stopPolling(stkResponse.checkout_request_id);

      const result = await completePayment({
        transaction_id: transactionId,
        checkout_request_id: stkResponse.checkout_request_id,
        amount: totalAmount,
        phone_number: phoneNumber,
        completion_mode: 'manual',
        payment_status: 'completed',
        confirmation_source: 'polling',
        mpesa_receipt_number: mpesaReceiptNumber,
      });

      setShowStatusModal(false);
      setShowConfirmation(false);
      onPaymentComplete(true, mpesaReceiptNumber);
    } catch (err) {
      console.error('[v0] Manual confirmation error:', err);
      setError('Failed to confirm payment');
    }
  };

  // Handle payment rejection
  const handleRejectPayment = async () => {
    if (!stkResponse?.checkout_request_id) return;

    try {
      stopPolling(stkResponse.checkout_request_id);

      await rejectPaymentManually(transactionId, 'Cashier rejected payment');

      setShowStatusModal(false);
      setShowConfirmation(false);
      onPaymentComplete(false, undefined, 'Payment rejected by cashier');
    } catch (err) {
      console.error('[v0] Payment rejection error:', err);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    if (stkResponse?.checkout_request_id) {
      stopPolling(stkResponse.checkout_request_id);
    }
    setShowStatusModal(false);
    setShowConfirmation(false);
    setStkResponse(null);
  };

  return (
    <>
      {/* Main Form */}
      <form onSubmit={handleInitiateSTKPush} className="bg-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">M-Pesa Payment</h3>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Total Amount */}
        <div className="bg-slate-700 rounded p-4 text-center">
          <p className="text-slate-400 text-sm mb-2">Total Amount</p>
          <p className="text-white text-3xl font-bold">{totalAmount.toLocaleString()}</p>
        </div>

        {/* Phone Number Input */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678 or +254712345678"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              disabled={isProcessing || externalProcessing}
              required
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Enter your M-Pesa registered phone number</p>
        </div>

        {/* Completion Mode Selection */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Completion Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCompletionMode('auto')}
              className={`p-3 rounded-lg font-medium transition text-sm ${
                completionMode === 'auto'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Auto Complete
            </button>
            <button
              type="button"
              onClick={() => setCompletionMode('manual')}
              className={`p-3 rounded-lg font-medium transition text-sm ${
                completionMode === 'manual'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Manual Confirm
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {completionMode === 'auto'
              ? 'Receipt will print automatically after payment'
              : 'You will review and confirm payment before receipt'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing || externalProcessing}
            className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!phoneNumber || isProcessing || externalProcessing}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader size={20} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Check size={20} />
                Send M-Pesa Prompt
              </>
            )}
          </button>
        </div>
      </form>

      {/* STK Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Payment Status</h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Status Indicator */}
            <div className="text-center py-6">
              {paymentStatus === 'pending' && (
                <>
                  <Loader size={48} className="mx-auto mb-4 text-emerald-500 animate-spin" />
                  <p className="text-white font-semibold">Waiting for payment...</p>
                  <p className="text-slate-400 text-sm mt-2">Check your phone for M-Pesa prompt</p>
                </>
              )}

              {paymentStatus === 'completed' && (
                <>
                  <Check size={48} className="mx-auto mb-4 text-emerald-500" />
                  <p className="text-white font-semibold">Payment Confirmed</p>
                  {mpesaReceiptNumber && (
                    <p className="text-slate-400 text-sm mt-2">Receipt: {mpesaReceiptNumber}</p>
                  )}
                </>
              )}

              {paymentStatus === 'failed' && (
                <>
                  <X size={48} className="mx-auto mb-4 text-red-500" />
                  <p className="text-white font-semibold">Payment Failed</p>
                  <p className="text-slate-400 text-sm mt-2">Please try again</p>
                </>
              )}

              {paymentStatus === 'timeout' && (
                <>
                  <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
                  <p className="text-white font-semibold">Payment Timeout</p>
                  <p className="text-slate-400 text-sm mt-2">Please try again</p>
                </>
              )}
            </div>

            {/* Manual Confirmation Buttons */}
            {showConfirmation && paymentStatus === 'completed' && completionMode === 'manual' && (
              <div className="space-y-3 mt-6 border-t border-slate-700 pt-4">
                <button
                  onClick={handleConfirmPayment}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={handleRejectPayment}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Reject Payment
                </button>
              </div>
            )}

            {/* Close Button for Non-Pending Status */}
            {paymentStatus !== 'pending' && !showConfirmation && (
              <button
                onClick={handleCloseModal}
                className="w-full mt-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
