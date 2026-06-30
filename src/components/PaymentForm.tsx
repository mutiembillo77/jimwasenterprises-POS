import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface PaymentFormProps {
  totalAmount: number;
  allowedMethods: string[];
  onPaymentComplete: (method: string, amount: number, notes?: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function PaymentForm({
  totalAmount,
  allowedMethods,
  onPaymentComplete,
  onCancel,
  isProcessing,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState(allowedMethods[0] || 'cash');
  const [amountPaid, setAmountPaid] = useState(totalAmount);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const changeAmount = amountPaid - totalAmount;
  const isValid = amountPaid >= totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('Amount paid must be at least the total amount');
      return;
    }

    onPaymentComplete(paymentMethod, amountPaid, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">Payment</h3>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Total Amount Display */}
      <div className="bg-slate-700 rounded p-4 text-center">
        <p className="text-slate-400 text-sm mb-2">Total Amount</p>
        <p className="text-white text-3xl font-bold">{totalAmount.toLocaleString()}</p>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Payment Method</label>
        <div className="grid grid-cols-2 gap-2">
          {allowedMethods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`p-3 rounded-lg font-medium transition ${
                paymentMethod === method
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Paid */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Amount Paid</label>
        <input
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(Number(e.target.value))}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          min={totalAmount}
          step="0.01"
        />
      </div>

      {/* Change Amount */}
      {changeAmount >= 0 && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded p-4">
          <p className="text-emerald-400 text-sm mb-1">Change</p>
          <p className="text-white text-2xl font-bold">{changeAmount.toLocaleString()}</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none resize-none"
          rows={2}
          placeholder="Add any payment notes..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isProcessing}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          <Check size={20} />
          {isProcessing ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </form>
  );
}
