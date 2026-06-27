import { openDB } from 'idb';

export interface SyncMetric {
  id: string;
  timestamp: string;
  operation: string; // 'insert', 'update', 'delete'
  table: string;
  recordId: string;
  status: 'success' | 'failed' | 'pending';
  duration: number; // milliseconds
  error?: string;
  retryCount: number;
}

export interface SyncStats {
  totalOperations: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  averageDuration: number;
  lastSyncTime?: string;
  operationsByTable: Record<string, number>;
  operationsByStatus: Record<string, number>;
}

const DB_NAME = 'jimwas-pos';
const STORE_NAME = 'sync_metrics';

/**
 * Initialize sync metrics store in IndexedDB
 */
export async function initializeSyncMetrics() {
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });

    return db;
  } catch (error) {
    console.error('Failed to initialize sync metrics:', error);
    throw error;
  }
}

/**
 * Record a sync operation metric
 */
export async function recordSyncMetric(metric: SyncMetric) {
  try {
    const db = await openDB(DB_NAME);
    await db.add(STORE_NAME, metric);
  } catch (error) {
    console.error('Failed to record sync metric:', error);
  }
}

/**
 * Update sync metric status
 */
export async function updateSyncMetric(
  id: string,
  updates: Partial<SyncMetric>
) {
  try {
    const db = await openDB(DB_NAME);
    const metric = await db.get(STORE_NAME, id);
    if (metric) {
      Object.assign(metric, updates);
      await db.put(STORE_NAME, metric);
    }
  } catch (error) {
    console.error('Failed to update sync metric:', error);
  }
}

/**
 * Get sync statistics
 */
export async function getSyncStats(hoursBack: number = 24): Promise<SyncStats> {
  try {
    const db = await openDB(DB_NAME);
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const allMetrics = await db.getAll(STORE_NAME);
    const recentMetrics = allMetrics.filter((m) => m.timestamp >= cutoffTime);

    const stats: SyncStats = {
      totalOperations: recentMetrics.length,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      successRate: 0,
      averageDuration: 0,
      operationsByTable: {},
      operationsByStatus: {},
    };

    let totalDuration = 0;

    recentMetrics.forEach((metric) => {
      // Count by status
      if (metric.status === 'success') stats.successCount++;
      else if (metric.status === 'failed') stats.failedCount++;
      else if (metric.status === 'pending') stats.pendingCount++;

      // Sum duration
      totalDuration += metric.duration || 0;

      // Count by table
      stats.operationsByTable[metric.table] =
        (stats.operationsByTable[metric.table] || 0) + 1;

      // Count by status
      stats.operationsByStatus[metric.status] =
        (stats.operationsByStatus[metric.status] || 0) + 1;
    });

    // Calculate averages
    if (stats.totalOperations > 0) {
      stats.successRate = (stats.successCount / stats.totalOperations) * 100;
      stats.averageDuration = totalDuration / stats.totalOperations;
      stats.lastSyncTime = recentMetrics[recentMetrics.length - 1]?.timestamp;
    }

    return stats;
  } catch (error) {
    console.error('Failed to get sync stats:', error);
    return {
      totalOperations: 0,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      successRate: 0,
      averageDuration: 0,
      operationsByTable: {},
      operationsByStatus: {},
    };
  }
}

/**
 * Get metrics for a specific table
 */
export async function getTableMetrics(
  table: string,
  hoursBack: number = 24
): Promise<SyncMetric[]> {
  try {
    const db = await openDB(DB_NAME);
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const allMetrics = await db.getAll(STORE_NAME);
    return allMetrics.filter(
      (m) => m.table === table && m.timestamp >= cutoffTime
    );
  } catch (error) {
    console.error(`Failed to get metrics for table ${table}:`, error);
    return [];
  }
}

/**
 * Clear old metrics (older than specified days)
 */
export async function clearOldMetrics(daysOld: number = 30) {
  try {
    const db = await openDB(DB_NAME);
    const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const allMetrics = await db.getAll(STORE_NAME);
    const idsToDelete = allMetrics
      .filter((m) => m.timestamp < cutoffTime)
      .map((m) => m.id);

    for (const id of idsToDelete) {
      await db.delete(STORE_NAME, id);
    }

    return idsToDelete.length;
  } catch (error) {
    console.error('Failed to clear old metrics:', error);
    return 0;
  }
}

/**
 * Export metrics as JSON (for analysis/debugging)
 */
export async function exportMetrics(hoursBack: number = 24): Promise<string> {
  try {
    const db = await openDB(DB_NAME);
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const allMetrics = await db.getAll(STORE_NAME);
    const recentMetrics = allMetrics.filter((m) => m.timestamp >= cutoffTime);
    const stats = await getSyncStats(hoursBack);

    return JSON.stringify(
      {
        exportTime: new Date().toISOString(),
        stats,
        metrics: recentMetrics,
      },
      null,
      2
    );
  } catch (error) {
    console.error('Failed to export metrics:', error);
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Download metrics as JSON file
 */
export async function downloadMetrics(filename: string = 'sync-metrics.json') {
  try {
    const json = await exportMetrics(24);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download metrics:', error);
  }
}

/**
 * Monitor sync health (can be called periodically)
 */
export async function checkSyncHealth(): Promise<{
  isHealthy: boolean;
  warnings: string[];
}> {
  const stats = await getSyncStats(24);
  const warnings: string[] = [];

  // Warning: Low success rate
  if (stats.successRate < 70 && stats.totalOperations > 0) {
    warnings.push(`Low sync success rate: ${stats.successRate.toFixed(1)}%`);
  }

  // Warning: Many pending operations
  if (stats.pendingCount > 100) {
    warnings.push(`High number of pending syncs: ${stats.pendingCount}`);
  }

  // Warning: High failure rate
  if (stats.failedCount > stats.successCount && stats.totalOperations > 10) {
    warnings.push('More failed syncs than successful syncs in last 24 hours');
  }

  // Warning: Slow performance
  if (stats.averageDuration > 5000) {
    // 5 seconds
    warnings.push(`Sync operations are slow: avg ${stats.averageDuration.toFixed(0)}ms`);
  }

  return {
    isHealthy: warnings.length === 0,
    warnings,
  };
}
