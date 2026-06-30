import { useState, useEffect } from 'react';
import { Clock, Plus, X, AlertCircle, Check } from 'lucide-react';
import { shiftRepository } from '../lib/repositories/OperationalRepositories';
import { useAuth } from '../context/AuthContext';
import type { Shift } from '../lib/types';

export function ShiftsManagement() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      if (!user) return;
      const allShifts = await shiftRepository.getActiveSifts(user.id);
      setShifts(allShifts.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()));
    } catch (err) {
      setError('Failed to load shifts');
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!user || !openingBalance) {
        setError('Please enter opening balance');
        return;
      }

      const newShift = await shiftRepository.openShift(user.id, Number(openingBalance));
      setShifts([newShift, ...shifts]);
      setOpeningBalance('');
      setShowOpenShift(false);
      setSuccess('Shift opened successfully');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open shift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseShift = async (shiftId: string, closingBalance: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!closingBalance) {
        setError('Please enter closing balance');
        return;
      }

      const closed = await shiftRepository.closeShift(shiftId, Number(closingBalance));
      if (closed) {
        await loadShifts();
        setSuccess('Shift closed successfully');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close shift');
    } finally {
      setIsLoading(false);
    }
  };

  const getShiftDuration = (openedAt: string, closedAt?: string) => {
    const end = closedAt ? new Date(closedAt) : new Date();
    const start = new Date(openedAt);
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Clock size={32} className="text-blue-400" />
              Shift Management
            </h1>
            <p className="text-slate-400 text-sm mt-2">Open, manage, and close your work shifts</p>
          </div>
          <button
            onClick={() => setShowOpenShift(!showOpenShift)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Open Shift
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Open Shift Form */}
          {showOpenShift && (
            <div className="bg-slate-800 rounded-lg p-6 border border-blue-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Open New Shift</h2>
                <button onClick={() => setShowOpenShift(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleOpenShift} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Opening Balance</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter opening cash balance"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOpenShift(false)}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    {isLoading ? 'Opening...' : 'Open Shift'}
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

          {/* Shifts List */}
          <div className="space-y-4">
            {shifts.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-8 text-center">
                <p className="text-slate-400">No shifts found. Open a shift to get started.</p>
              </div>
            ) : (
              shifts.map((shift) => (
                <div
                  key={shift.id}
                  className={`bg-slate-800 rounded-lg p-6 border-l-4 ${
                    shift.status === 'open' ? 'border-blue-500' : 'border-emerald-500'
                  }`}
                >
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Opened</p>
                      <p className="font-medium text-white">{new Date(shift.opened_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Opening Balance</p>
                      <p className="font-medium text-blue-400">{shift.opening_balance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Duration</p>
                      <p className="font-medium text-white">{getShiftDuration(shift.opened_at, shift.closed_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Status</p>
                      <p
                        className={`font-medium ${shift.status === 'open' ? 'text-blue-400' : 'text-emerald-400'}`}
                      >
                        {shift.status.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {shift.status === 'open' && (
                    <div className="pt-4 border-t border-slate-700">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const closingBalance = (
                            e.currentTarget.elements.namedItem('closingBalance') as HTMLInputElement
                          ).value;
                          handleCloseShift(shift.id, closingBalance);
                        }}
                        className="flex gap-3 items-end"
                      >
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-2">Closing Balance</label>
                          <input
                            type="number"
                            name="closingBalance"
                            className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                            placeholder="Enter closing balance"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium"
                        >
                          Close Shift
                        </button>
                      </form>
                    </div>
                  )}

                  {shift.status === 'closed' && shift.closing_balance && (
                    <div className="pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">Closing Balance</p>
                        <p className="font-medium text-emerald-400">{shift.closing_balance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">Transactions</p>
                        <p className="font-medium text-white">{shift.transactions_count}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
