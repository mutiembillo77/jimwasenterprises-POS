import { useSyncMetrics } from '../hooks/useSyncMetrics';
import { downloadMetrics } from '../lib/syncMetrics';
import { BarChart3, Download, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export function SyncMetricsPanel() {
  const { stats, health, isLoading, refresh } = useSyncMetrics(30000);

  if (!stats) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <p className="text-gray-500">Loading sync metrics...</p>
      </div>
    );
  }

  const handleDownload = () => {
    downloadMetrics(`sync-metrics-${new Date().toISOString().slice(0, 10)}.json`);
  };

  return (
    <div className="space-y-4">
      {/* Health Status */}
      <div
        className={`rounded-lg p-4 border ${
          health.isHealthy
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {health.isHealthy ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h3
              className={`font-semibold ${
                health.isHealthy ? 'text-green-900' : 'text-amber-900'
              }`}
            >
              {health.isHealthy ? 'Sync Healthy' : 'Sync Warnings'}
            </h3>
            {health.warnings.length > 0 && (
              <ul className="mt-2 space-y-1">
                {health.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-amber-800">
                    • {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Total Operations</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOperations}</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Success Rate</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-green-600">
              {stats.successRate.toFixed(0)}%
            </p>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingCount}</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Avg Duration</p>
          <p className="text-2xl font-bold text-blue-600">
            {(stats.averageDuration / 1000).toFixed(1)}s
          </p>
        </div>
      </div>

      {/* Operations by Table */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Operations by Table
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.operationsByTable)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([table, count]) => (
              <div key={table} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{table}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Status Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-600">Successful</p>
            <p className="text-xl font-bold text-green-600">{stats.successCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-xl font-bold text-red-600">{stats.failedCount}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {stats.lastSyncTime && (
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date(stats.lastSyncTime).toLocaleString()}
        </p>
      )}
    </div>
  );
}
