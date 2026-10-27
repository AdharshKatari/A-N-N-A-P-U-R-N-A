import { useOfflineQueue } from '../utils/offlineQueue';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncOfflineQueue, isOnline as apiIsOnline } from '../services/api';
import SyncService from './SyncService';

export { useOfflineQueue } from '../utils/offlineQueue';
export type { OfflineTransaction, OfflineQueueState } from '../utils/offlineQueue';

export async function isOnline(): Promise<boolean> {
  return apiIsOnline();
}

// ============================================================================
// OFFLINE SYNC SERVICE — Auto-sync on network restore
// ============================================================================

let syncInProgress = false;
let netInfoUnsubscribe: (() => void) | null = null;

interface SyncServiceConfig {
  onSyncStart?: () => void;
  onSyncProgress?: (completed: number, total: number) => void;
  onSyncComplete?: (result: { success: number; failed: number }) => void;
  onSyncError?: (error: Error) => void;
}

export function initializeOfflineSync(config: SyncServiceConfig = {}) {
  // Clean up any existing listener
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }

  netInfoUnsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
    const isConnected = state.isConnected === true && state.isInternetReachable !== false;
    if (isConnected && !syncInProgress) {
      await triggerAutoSync(config);
    }
  });
  return stopOfflineSync;
}

async function triggerAutoSync(config: SyncServiceConfig) {
  if (syncInProgress) return;
  
  try {
    syncInProgress = true;
    config.onSyncStart?.();

    const { processQueue, getPendingCount } = useOfflineQueue();
    const pendingCount = await getPendingCount() + (await SyncService.getPendingBatches()).length;
    
    if (pendingCount === 0) {
      syncInProgress = false;
      return;
    }

    // Try API sync first
    const online = await apiIsOnline();
    if (!online) {
      syncInProgress = false;
      return;
    }

    config.onSyncProgress?.(0, pendingCount);
    await SyncService.syncPendingBatches();

    // Build processor that calls the backend sync endpoint
    const processor = async (tx: any) => {
      // For each transaction, we send it to the backend sync endpoint
      await syncOfflineQueue({
        farmer_id: tx.payload.farmer_id || 'unknown',
        device_sync_timestamp: new Date().toISOString(),
        transactions: [{
          client_local_id: tx.id,
          batch_id: tx.payload.batch_id,
          crop_type: tx.payload.crop_type,
          weight_kg: tx.payload.weight_kg,
          harvest_timestamp: tx.payload.harvest_timestamp,
          cached_lat: tx.payload.cached_lat,
          cached_lng: tx.payload.cached_lng,
          is_ventilated: tx.payload.is_ventilated,
          manual_color_index: tx.payload.manual_color_index || 1,
          manual_bruise_index: tx.payload.manual_bruise_index || 0,
        }],
      });
    };

    const result = await processQueue(processor, (completed, total) => {
      config.onSyncProgress?.(completed, total);
    });

    config.onSyncComplete?.(result);
  } catch (error) {
    console.error('Auto-sync failed:', error);
    config.onSyncError?.(error as Error);
  } finally {
    syncInProgress = false;
  }
}

export function stopOfflineSync() {
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
}

export async function getSyncStatus(): Promise<{ isOnline: boolean; pendingCount: number }> {
  const online = await apiIsOnline();
  const { getPendingCount } = useOfflineQueue();
  const pendingCount = await getPendingCount() + (await SyncService.getPendingBatches()).length;
  return { isOnline: online, pendingCount };
}

export async function forceSyncNow(config: SyncServiceConfig = {}) {
  await triggerAutoSync(config);
}
