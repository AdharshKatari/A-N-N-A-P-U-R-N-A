import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncOfflineQueue, isOnline as apiIsOnline } from '../services/api';

const OFFLINE_QUEUE_KEY = '@freshguard_offline_queue';
const MAX_QUEUE_SIZE = 100;

export interface OfflineTransaction {
  id: string;
  type: 'harvest_evaluation' | 'batch_create' | 'environmental_log' | 'sync_batch';
  payload: any;
  timestamp: string;
  retryCount: number;
  lastAttempt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface OfflineQueueState {
  transactions: OfflineTransaction[];
  lastSync: string | null;
  pendingCount: number;
}

async function getQueue(): Promise<OfflineTransaction[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveQueue(transactions: OfflineTransaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save offline queue:', err);
  }
}

export function useOfflineQueue() {
  const enqueueTransaction = async (
    type: OfflineTransaction['type'],
    payload: any
  ): Promise<string> => {
    const queue = await getQueue();
    
    if (queue.length >= MAX_QUEUE_SIZE) {
      const oldestCompleted = queue.findIndex(t => t.status === 'completed');
      if (oldestCompleted !== -1) {
        queue.splice(oldestCompleted, 1);
      } else {
        throw new Error('Offline queue full');
      }
    }

    const transaction: OfflineTransaction = {
      id: uuidv4(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    queue.push(transaction);
    await saveQueue(queue);
    return transaction.id;
  };

  const processQueue = async (
    processor: (tx: OfflineTransaction) => Promise<any>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: number; failed: number }> => {
    const queue = await getQueue();
    const pending = queue.filter(t => t.status === 'pending' || t.status === 'failed');
    
    let success = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      const tx = pending[i];
      const queueIndex = queue.findIndex(t => t.id === tx.id);
      
      if (queueIndex !== -1) {
        queue[queueIndex] = { ...tx, status: 'processing', lastAttempt: new Date().toISOString() };
        await saveQueue(queue);
      }

      try {
        await processor(tx);
        if (queueIndex !== -1) {
          queue[queueIndex] = { ...queue[queueIndex], status: 'completed' };
          success++;
        }
      } catch (err) {
        if (queueIndex !== -1) {
          const newRetryCount = queue[queueIndex].retryCount + 1;
          queue[queueIndex] = {
            ...queue[queueIndex],
            status: newRetryCount >= 3 ? 'failed' : 'pending',
            retryCount: newRetryCount,
            lastAttempt: new Date().toISOString(),
          };
        }
        failed++;
        console.error(`Offline queue transaction ${tx.id} failed:`, err);
      }

      await saveQueue(queue);
      onProgress?.(success + failed, pending.length);
    }

    return { success, failed };
  };

  const getPendingCount = async (): Promise<number> => {
    const queue = await getQueue();
    return queue.filter(t => t.status === 'pending' || t.status === 'failed').length;
  };

  const getQueueState = async (): Promise<OfflineQueueState> => {
    const queue = await getQueue();
    return {
      transactions: queue,
      lastSync: queue.find(t => t.status === 'completed')?.timestamp || null,
      pendingCount: queue.filter(t => t.status === 'pending' || t.status === 'failed').length,
    };
  };

  const clearCompleted = async (): Promise<void> => {
    const queue = await getQueue();
    const filtered = queue.filter(t => t.status !== 'completed');
    await saveQueue(filtered);
  };

  const retryFailed = async (): Promise<void> => {
    const queue = await getQueue();
    const updated: OfflineTransaction[] = queue.map(t =>
      t.status === 'failed' ? { ...t, status: 'pending' as const, retryCount: 0 } : t
    );
    await saveQueue(updated);
  };

  const removeTransaction = async (id: string): Promise<void> => {
    const queue = await getQueue();
    const filtered = queue.filter(t => t.id !== id);
    await saveQueue(filtered);
  };

  return {
    enqueueTransaction,
    processQueue,
    getPendingCount,
    getQueueState,
    clearCompleted,
    retryFailed,
    removeTransaction,
  };
}

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

  let wasOffline = false;

  netInfoUnsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
    const isConnected = state.isConnected === true && state.isInternetReachable !== false;
    
    if (!isConnected) {
      wasOffline = true;
      return;
    }

    // Network restored - check if we were offline and have pending transactions
    if (wasOffline && !syncInProgress) {
      wasOffline = false;
      await triggerAutoSync(config);
    }
  });

  // Also check on app foreground (when app comes to foreground)
  const appStateListener = NetInfo.addEventListener((state) => {
    if (state.isConnected && !syncInProgress) {
      triggerAutoSync(config);
    }
  });

  return () => {
    netInfoUnsubscribe?.();
    appStateListener?.();
  };
}

async function triggerAutoSync(config: SyncServiceConfig) {
  if (syncInProgress) return;
  
  try {
    syncInProgress = true;
    config.onSyncStart?.();

    const { processQueue, getPendingCount } = useOfflineQueue();
    const pendingCount = await getPendingCount();
    
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
  const pendingCount = await getPendingCount();
  return { isOnline: online, pendingCount };
}

export async function forceSyncNow(config: SyncServiceConfig = {}) {
  await triggerAutoSync(config);
}
