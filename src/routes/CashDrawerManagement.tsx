import { useState, useEffect } from 'react';
import { Wallet, Plus, Minus, AlertCircle, Check, RefreshCw } from 'lucide-react';

interface CashDrawerEntry {
  id: string;
  timestamp: string;
  type: 'deposit' | 'withdrawal' | 'reconcile';
  amount: number;
  reason: string;
  operator: string;
}

export function CashDrawerManagement() {
  const [entries, setEntries] = useState<CashDrawerEntry[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [entryType, setEntryType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDrawerData();
  }, []);

  const loadDrawerData = async () => {
    try {
      // In a real app, this would fetch from the database
      // For now, we'll use a mock balance
      setCurrentBalance(50000); // Mock current balance
      setEntries([
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'deposit',
          amount: 10000,
          reason: 'Morning opening',
          operator: 'John Doe',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'withdrawal',
          amount: 5000,
          reason: 'Supplier payment',
          operator: 'John Doe',
        },
      ]);
    } catch (err) {
      setError('Failed to load cash drawer');
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!amount || !reason) {
        setError('Please fill in all fields');
        return;
      }

      const parsedAmount = Number(amount);
      if (parsedAmount <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      const newEntry: CashDrawerEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: entryType,
        amount: parsedAmount,
        reason,
        operator: 'Current User', // Would be replaced with actual user
      };

      setEntries([newEntry, ...entries]);

      // Update balance
      const newBalance = entryType === 'deposit' ? currentBalance + parsedAmount : currentBalance - parsedAmount;
      setCurrentBalance(newBalance);

      // Reset form
      setAmount('');
      setReason('');
      setShowAddEntry(false);
      setSuccess(`${entryType === 'deposit' ? 'Deposit' : 'Withdrawal'} recorded successfully`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // In a real app, this would reconcile drawer against actual inventory
      setSuccess('Cash drawer reconciled successfully');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Reconciliation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wallet size={32} className="text-emerald-400" />
              Cash Drawer Management
            </h1>
            <p className="text-slate-400 text-sm mt-2">Track cash deposits, withdrawals, and balance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReconcile}
              disabled={isLoading}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={20} />
              Reconcile
            </button>
            <button
              onClick={() => setShowAddEntry(!showAddEntry)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Add Entry
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Current Balance</p>
          <p className="text-4xl font-bold text-emerald-400">{currentBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Add Entry Form */}
          {showAddEntry && (
            <div className="bg-slate-800 rounded-lg p-6 border border-emerald-700">
              <h2 className="text-xl font-bold text-white mb-4">Add Cash Entry</h2>

              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Entry Type</label>
                    <select
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value as 'deposit' | 'withdrawal')}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="Enter amount"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none resize-none"
                    placeholder="Enter reason for this entry"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddEntry(false)}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium"
                  >
                    {isLoading ? 'Recording...' : 'Record Entry'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              <AlertCircle size={24} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300">
              <Check size={24} />
              {success}
            </div>
          )}

          {/* Entries List */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
            {entries.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-8 text-center">
                <p className="text-slate-400">No entries yet. Add a cash entry to get started.</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="bg-slate-800 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        entry.type === 'deposit' ? 'bg-emerald-900/30' : 'bg-red-900/30'
                      }`}
                    >
                      {entry.type === 'deposit' ? (
                        <Plus
                          size={24}
                          className={entry.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}
                        />
                      ) : (
                        <Minus size={24} className="text-red-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-white capitalize">{entry.type}</p>
                      <p className="text-sm text-slate-400">{entry.reason}</p>
                      <p className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        entry.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {entry.type === 'deposit' ? '+' : '-'} {entry.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">{entry.operator}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
