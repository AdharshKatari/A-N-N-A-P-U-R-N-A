import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuid } from 'expo-modules-core';
import { API_BASE_URL } from '../constants/api';

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
  } catch (err) {
    console.error('Failed to read offline queue:', err);
    throw err;
  }
}

async function saveQueue(transactions: OfflineTransaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save offline queue:', err);
    throw err;
  }
}

export async function enqueueTransaction(
  type: OfflineTransaction['type'],
  payload: any,
): Promise<string> {
  const queue = await getQueue();
  if (queue.length >= MAX_QUEUE_SIZE) throw new Error('Offline queue full');
  const transaction: OfflineTransaction = {
    id: uuid.v4(), type, payload, timestamp: new Date().toISOString(), retryCount: 0, status: 'pending',
  };
  await saveQueue([...queue, transaction]);
  return transaction.id;
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
      id: uuid.v4(),
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
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${API_BASE_URL}/api/v5/health`, { 
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
