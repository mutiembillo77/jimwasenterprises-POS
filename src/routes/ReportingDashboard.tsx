import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Package, Calendar, Download } from 'lucide-react';
import { reportingService, DashboardMetrics, SalesReport } from '../lib/services/ReportingService';

export function ReportingDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    // Set default date range to this month
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    });
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await reportingService.generateDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      const report = await reportingService.generateSalesReport(
        new Date(dateRange.start),
        new Date(dateRange.end)
      );
      setSalesReport(report);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!salesReport) return;

    const csv = [
      ['Sales Report', dateRange.start, 'to', dateRange.end],
      [],
      ['Metric', 'Value'],
      ['Total Sales', salesReport.totalSales],
      ['Transaction Count', salesReport.transactionCount],
      ['Average Transaction', salesReport.averageTransaction],
      ['Total Discount', salesReport.totalDiscount],
      ['Total Tax', salesReport.totalTax],
      [],
      ['Payment Method', 'Amount'],
      ['Cash', salesReport.totalCash],
      ['Card', salesReport.totalCard],
      ['M-Pesa', salesReport.totalMpesa],
    ].map((row) => row.join(','));

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv.join('\n')));
    element.setAttribute('download', `sales-report-${dateRange.start}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 size={32} className="text-cyan-400" />
          Reports & Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-2">Business metrics, sales trends, and performance insights</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Key Metrics */}
          {metrics && (
            <>
              {/* Today's Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-blue-500">
                  <p className="text-slate-400 text-sm uppercase mb-2">Today's Sales</p>
                  <p className="text-3xl font-bold text-white">{metrics.today.sales.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-2">{metrics.today.transactions} transactions</p>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-emerald-500">
                  <p className="text-slate-400 text-sm uppercase mb-2">Avg Transaction</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {metrics.today.averageValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Today&apos;s average</p>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-amber-500">
                  <p className="text-slate-400 text-sm uppercase mb-2">This Week</p>
                  <p className="text-3xl font-bold text-amber-400">{metrics.thisWeek.sales.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-2">{metrics.thisWeek.transactions} transactions</p>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-purple-500">
                  <p className="text-slate-400 text-sm uppercase mb-2">This Month</p>
                  <p className="text-3xl font-bold text-purple-400">{metrics.thisMonth.sales.toLocaleString()}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${metrics.thisMonth.targetProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{metrics.thisMonth.targetProgress.toFixed(1)}% of target</p>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={24} />
                  Top Cashiers This Month
                </h2>
                <div className="space-y-2">
                  {metrics.topPerformers.map((performer) => (
                    <div
                      key={performer.cashier}
                      className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span
                          className={`text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full ${
                            performer.rank === 1
                              ? 'bg-amber-500 text-white'
                              : performer.rank === 2
                                ? 'bg-slate-500 text-white'
                                : performer.rank === 3
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-slate-600 text-slate-300'
                          }`}
                        >
                          {performer.rank}
                        </span>
                        <div>
                          <p className="font-medium text-white">{performer.cashier}</p>
                          <p className="text-sm text-slate-400">{performer.transactions} transactions</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-emerald-400">{performer.sales.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Report Generator */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar size={24} />
              Generate Report
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isLoading || !dateRange.start || !dateRange.end}
                className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <TrendingUp size={20} />
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Report Results */}
          {salesReport && (
            <div className="bg-slate-800 rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Report Results</h2>
                <button
                  onClick={handleExportReport}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition flex items-center gap-2"
                >
                  <Download size={20} />
                  Export CSV
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded p-4">
                  <p className="text-slate-400 text-sm mb-2">Total Sales</p>
                  <p className="text-2xl font-bold text-white">{salesReport.totalSales.toLocaleString()}</p>
                </div>
                <div className="bg-slate-700 rounded p-4">
                  <p className="text-slate-400 text-sm mb-2">Transactions</p>
                  <p className="text-2xl font-bold text-white">{salesReport.transactionCount}</p>
                </div>
                <div className="bg-slate-700 rounded p-4">
                  <p className="text-slate-400 text-sm mb-2">Average Value</p>
                  <p className="text-2xl font-bold text-white">{salesReport.averageTransaction.toLocaleString()}</p>
                </div>
              </div>

              {/* Sales by Type */}
              <div>
                <h3 className="font-bold text-white mb-3">Sales by Type</h3>
                <div className="space-y-2">
                  {Object.entries(salesReport.salesByType).map(([type, data]) => (
                    <div key={type} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                      <span className="capitalize text-white font-medium">{type}</span>
                      <div className="text-right">
                        <p className="text-white">{data.count} transactions</p>
                        <p className="text-sm text-slate-400">{data.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="font-bold text-white mb-3">Payment Methods</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-700 rounded p-4 text-center">
                    <p className="text-slate-400 text-sm mb-2">Cash</p>
                    <p className="text-xl font-bold text-white">{salesReport.totalCash.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-700 rounded p-4 text-center">
                    <p className="text-slate-400 text-sm mb-2">Card</p>
                    <p className="text-xl font-bold text-white">{salesReport.totalCard.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-700 rounded p-4 text-center">
                    <p className="text-slate-400 text-sm mb-2">M-Pesa</p>
                    <p className="text-xl font-bold text-white">{salesReport.totalMpesa.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div>
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Package size={20} />
                  Top Products
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {salesReport.topProducts.map((product, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                      <span className="text-white">{product.product}</span>
                      <div className="text-right">
                        <p className="text-white font-medium">{product.quantity} units</p>
                        <p className="text-sm text-slate-400">{product.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
