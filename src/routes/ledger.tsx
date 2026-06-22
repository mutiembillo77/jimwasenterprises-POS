// Ledger Page - Financial tracking and reporting

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Package,
  RefreshCw, Download, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  getLedgerEntries,
  getDailySummary,
  getPeriodSummary,
  getTodaySummary,
  getWeekSummary,
  getMonthSummary,
  formatCurrency,
  getPaymentMethodLabel,
} from '../lib/ledger';
import type { LedgerEntry, DailySummary, PeriodSummary } from '../lib/ledger';

type ViewMode = 'entries' | 'daily' | 'period';

export function LedgerPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [weekSummary, setWeekSummary] = useState<PeriodSummary | null>(null);
  const [monthSummary, setMonthSummary] = useState<PeriodSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('entries');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entryType, setEntryType] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [today, week, month] = await Promise.all([
        getTodaySummary(),
        getWeekSummary(),
        getMonthSummary(),
      ]);

      setTodaySummary(today);
      setWeekSummary(week);
      setMonthSummary(month);

      // Load recent entries (last 50)
      const recent = await getLedgerEntries();
      setEntries(recent.slice(0, 50));
    } catch (error) {
      console.error('Failed to load ledger data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      const filtered = await getLedgerEntries(dateFrom, dateTo, entryType || undefined);
      setEntries(filtered.slice(0, 100));

      if (dateFrom && dateTo) {
        const period = await getPeriodSummary(dateFrom, dateTo);
        setWeekSummary(period);
      }
    } catch (error) {
      console.error('Failed to apply filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return TrendingUp;
      case 'refund': return TrendingDown;
      case 'void': return TrendingDown;
      case 'installment_payment': return CreditCard;
      case 'loyalty_redemption': return Package;
      default: return DollarSign;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'text-emerald-400 bg-emerald-900/30';
      case 'refund': return 'text-amber-400 bg-amber-900/30';
      case 'void': return 'text-red-400 bg-red-900/30';
      case 'installment_payment': return 'text-blue-400 bg-blue-900/30';
      case 'loyalty_redemption': return 'text-purple-400 bg-purple-900/30';
      default: return 'text-slate-400 bg-slate-700';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportLedger = () => {
    const data = {
      exported_at: new Date().toISOString(),
      today: todaySummary,
      week: weekSummary,
      month: monthSummary,
      entries,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ledger</h1>
          <p className="text-slate-400">Financial transactions and reporting</p>
        </div>
        <button
          onClick={exportLedger}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition flex items-center gap-2"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-emerald-400" />
            <span className="text-slate-400 text-sm">Today</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(todaySummary?.net_revenue || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {todaySummary?.transaction_count || 0} transactions
          </p>
        </div>

        {/* This Week */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-blue-400" />
            <span className="text-slate-400 text-sm">This Week</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(weekSummary?.net_revenue || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Avg: {formatCurrency(weekSummary?.average_daily || 0)}/day
          </p>
        </div>

        {/* This Month */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-amber-400" />
            <span className="text-slate-400 text-sm">This Month</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(monthSummary?.net_revenue || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {monthSummary?.transaction_count || 0} transactions
          </p>
        </div>

        {/* Payment Methods */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-purple-400" />
            <span className="text-slate-400 text-sm">By Method</span>
          </div>
          <div className="space-y-1">
            {todaySummary && Object.entries(todaySummary.by_payment_method).slice(0, 3).map(([method, amount]) => (
              <div key={method} className="flex justify-between text-xs">
                <span className="text-slate-400">{getPaymentMethodLabel(method)}</span>
                <span className="text-white">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('entries')}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === 'entries'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Entries
        </button>
        <button
         onClick={() => setViewMode('daily')}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === 'daily'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Daily Summary
        </button>
        <button
          onClick={() => setViewMode('period')}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === 'period'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Period Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Type</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="sale">Sales</option>
              <option value="refund">Refunds</option>
              <option value="void">Voids</option>
              <option value="installment_payment">Installment Payments</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
            >
              <Filter size={18} />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading ledger data...</div>
        </div>
      ) : viewMode === 'entries' ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-700">
            {entries.map((entry) => {
              const Icon = getTypeIcon(entry.type);
              const colorClass = getTypeColor(entry.type);

              return (
                <div key={entry.id} className="p-4 hover:bg-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${colorClass}`}>
                          {entry.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-500">via {getPaymentMethodLabel(entry.payment_method)}</span>
                      </div>
                      <p className="text-white text-sm">{entry.description}</p>
                      <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        entry.type === 'sale' || entry.type === 'installment_payment'
                          ? 'text-emerald-400'
                          : entry.type === 'refund'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}>
                        {entry.type === 'sale' || entry.type === 'installment_payment' ? '+' : entry.type === 'refund' ? '-' : ''}
                        {formatCurrency(entry.amount)}
                      </p>
                      {entry.cashier_name && (
                        <p className="text-xs text-slate-500">by {entry.cashier_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {entries.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
              <p>No entries found</p>
            </div>
          )}
        </div>
      ) : viewMode === 'daily' ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Sales</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Refunds</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Net</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Trans.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {monthSummary?.daily_breakdown.map((day) => (
                <tr key={day.date} className="hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-white">{day.date}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{formatCurrency(day.total_sales)}</td>
                  <td className="py-3 px-4 text-right text-amber-400">{formatCurrency(day.total_refunds)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${day.net_revenue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(day.net_revenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">{day.transaction_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Period Summary</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-400">Total Sales</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(monthSummary?.total_sales || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Refunds</p>
              <p className="text-2xl font-bold text-amber-400">{formatCurrency(monthSummary?.total_refunds || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Installment Payments</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(monthSummary?.total_installment_payments || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Net Revenue</p>
              <p className={`text-2xl font-bold ${(monthSummary?.net_revenue || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(monthSummary?.net_revenue || 0)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3">By Payment Method</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {monthSummary && Object.entries(monthSummary.by_payment_method).map(([method, amount]) => (
                <div key={method} className="bg-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400">{getPaymentMethodLabel(method)}</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
