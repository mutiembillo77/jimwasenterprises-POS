import { useEffect, useState, useCallback } from 'react';
import { getSyncStats, checkSyncHealth, SyncStats } from '../lib/syncMetrics';
import type { SyncStats as SyncStatsType } from '../lib/syncMetrics';

export interface SyncHealthStatus {
  isHealthy: boolean;
  warnings: string[];
}

export function useSyncMetrics(refreshInterval: number = 30000) {
  const [stats, setStats] = useState<SyncStatsType | null>(null);
  const [health, setHealth] = useState<SyncHealthStatus>({ isHealthy: true, warnings: [] });
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [newStats, healthStatus] = await Promise.all([
        getSyncStats(24),
        checkSyncHealth(),
      ]);
      setStats(newStats);
      setHealth(healthStatus);
    } catch (error) {
      console.error('Failed to refresh sync stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refreshStats();

    // Set up interval for continuous monitoring
    const interval = setInterval(refreshStats, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refreshStats]);

  return {
    stats,
    health,
    isLoading,
    refresh: refreshStats,
  };
}
