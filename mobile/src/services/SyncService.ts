import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeBatch } from './api';

export interface OfflineBatch {
  id?: number;
  crop_type: string;
  images: string; // JSON array of base64 strings
  latitude: number;
  longitude: number;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
}

const STORAGE_KEY = '@freshguard_offline_batches';

class SyncService {
  private db: any = null;

  constructor() {
    if (Platform.OS !== 'web') {
      try {
        const SQLite = require('expo-sqlite');
        this.db = SQLite.openDatabaseSync('freshguard_offline.db');
        this.initDB();
      } catch (err) {
        console.warn('SQLite init failed, falling back to AsyncStorage:', err);
        this.db = null;
      }
    }
  }

  private initDB() {
    if (this.db) {
      try {
        this.db.execSync(`
          CREATE TABLE IF NOT EXISTS offline_batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop_type TEXT NOT NULL,
            images TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT DEFAULT 'pending'
          );
        `);
      } catch (err) {
        console.warn('SQLite table creation failed:', err);
      }
    }
  }

  public async queueBatch(batch: Omit<OfflineBatch, 'id' | 'status'>): Promise<number> {
    if (this.db) {
      try {
        const statement = await this.db.prepareAsync(
          `INSERT INTO offline_batches (crop_type, images, latitude, longitude, timestamp, status)
           VALUES ($crop_type, $images, $latitude, $longitude, $timestamp, 'pending')`
        );
        try {
          const result = await statement.executeAsync({
            $crop_type: batch.crop_type,
            $images: batch.images,
            $latitude: batch.latitude,
            $longitude: batch.longitude,
            $timestamp: batch.timestamp,
          });
          return result.lastInsertRowId;
        } finally {
          await statement.finalizeAsync();
        }
      } catch (err) {
        console.warn('SQLite queueBatch failed, fallback to AsyncStorage:', err);
      }
    }

    // AsyncStorage fallback (Web & SQLite failure)
    try {
      const existingStr = await AsyncStorage.getItem(STORAGE_KEY);
      const batches: OfflineBatch[] = existingStr ? JSON.parse(existingStr) : [];
      const newId = Date.now();
      batches.push({ ...batch, id: newId, status: 'pending' });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
      return newId;
    } catch (err) {
      console.error('AsyncStorage queueBatch failed:', err);
      throw err;
    }
  }

  public async getPendingBatches(): Promise<OfflineBatch[]> {
    if (this.db) {
      try {
        return await this.db.getAllAsync(
          `SELECT * FROM offline_batches WHERE status IN ('pending', 'failed', 'syncing')`
        );
      } catch (err) {
        console.warn('SQLite getPendingBatches failed, fallback to AsyncStorage:', err);
      }
    }

    try {
      const existingStr = await AsyncStorage.getItem(STORAGE_KEY);
      const batches: OfflineBatch[] = existingStr ? JSON.parse(existingStr) : [];
      return batches.filter(b => b.status === 'pending' || b.status === 'failed' || b.status === 'syncing');
    } catch {
      return [];
    }
  }

  public async updateBatchStatus(id: number, status: 'pending' | 'syncing' | 'failed' | 'completed') {
    if (this.db) {
      try {
        if (status === 'completed') {
          await this.db.runAsync('DELETE FROM offline_batches WHERE id = ?', [id]);
        } else {
          await this.db.runAsync('UPDATE offline_batches SET status = ? WHERE id = ?', [status, id]);
        }
        return;
      } catch (err) {
        console.warn('SQLite updateBatchStatus failed:', err);
      }
    }

    try {
      const existingStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existingStr) return;
      let batches: OfflineBatch[] = JSON.parse(existingStr);
      if (status === 'completed') {
        batches = batches.filter(b => b.id !== id);
      } else {
        batches = batches.map(b => b.id === id ? { ...b, status } : b);
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
    } catch (err) {
      console.error('AsyncStorage updateBatchStatus failed:', err);
    }
  }

  public async syncPendingBatches() {
    const batches = await this.getPendingBatches();
    if (batches.length === 0) return;

    for (const batch of batches) {
      if (!batch.id) continue;
      
      await this.updateBatchStatus(batch.id, 'syncing');

      try {
        await analyzeBatch(JSON.parse(batch.images), 'image/webp', batch.crop_type, batch.latitude, batch.longitude);
        await this.updateBatchStatus(batch.id, 'completed');
      } catch (error) {
        console.error('Offline Sync Error:', error);
        await this.updateBatchStatus(batch.id, 'failed');
      }
    }
  }
}

export default new SyncService();
