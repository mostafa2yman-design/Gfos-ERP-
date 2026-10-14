import { exportData, importData } from './storage';

export interface BackupRecord {
  date: string;       // YYYY-MM-DD format
  timestamp: number;  // Date.now()
  data: string;       // JSON string from exportData()
  size: number;       // length of string
}

const DB_NAME = 'gfos_backups_db';
const STORE_NAME = 'daily_backups';
const DB_VERSION = 2;
const SETTINGS_STORE = 'backup_settings';

// Helper to open DB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Date will be our primary key (YYYY-MM-DD) so we only have one per day
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    };
  });
}

export async function getAllBackups(): Promise<BackupRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as BackupRecord[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get backups", error);
    return [];
  }
}

export async function createDailyBackup(): Promise<boolean> {
  try {
    const today = new Date();
    // Use local date for YYYY-MM-DD
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const db = await openDB();
    
    // Check if we already backed up today
    const exists = await new Promise<boolean>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(dateStr);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });

    if (exists) {
      // Already backed up today
      return false;
    }

    const data = await exportData();
    
    const record: BackupRecord = {
      date: dateStr,
      timestamp: Date.now(),
      data,
      size: data.length
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });


    // Try to write to external folder if configured and permitted
    try {
      const handle = await getBackupDirectoryHandle();
      if (handle) {
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          const fileHandle = await handle.getFileHandle(`gfos_auto_backup_${dateStr}.json`, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(data);
          await writable.close();
        }
      }
    } catch (err) {
      console.error("Failed to write external backup", err);
    }

    // Cleanup old backups (older than 30 days)
    await cleanupOldBackups(db);
    
    return true;
  } catch (error) {
    console.error("Failed to create daily backup", error);
    return false;
  }
}

async function cleanupOldBackups(db: IDBDatabase): Promise<void> {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(thirtyDaysAgo);
    
    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Check every minute if we crossed midnight while app is open
let checkInterval: number | null = null;
export function startBackupService() {
  if (checkInterval) return;
  
  // Initial check
  createDailyBackup();
  
  // Check every minute
  checkInterval = window.setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      createDailyBackup();
    } else {
       // Also just try creating it every hour to be safe, it's a no-op if already done today
       if (now.getMinutes() === 0) {
          createDailyBackup();
       }
    }
  }, 60000);
}

// Added this to be safer:
// Any time they open the app, we check.


export async function getBackupDirectoryHandle(): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const store = tx.objectStore(SETTINGS_STORE);
      const req = store.get('directoryHandle');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function setBackupDirectoryHandle(handle: any | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    const req = handle ? store.put(handle, 'directoryHandle') : store.delete('directoryHandle');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function verifyDirectoryPermission(handle: any, mode: 'read' | 'readwrite' = 'readwrite'): Promise<boolean> {
  if (!handle) return false;
  try {
    if ((await handle.queryPermission({ mode })) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission({ mode })) === 'granted') {
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

export async function deleteAllBackups(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error("Failed to delete backups", error);
    return false;
  }
}
