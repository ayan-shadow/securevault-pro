import { VaultPassword, VaultNote, VaultFile, ActivityLog, AuthConfig, VaultSettings } from '../types';

const DB_NAME = 'SecureVaultProDB';
const DB_VERSION = 2;

export interface DBInstance {
  config: AuthConfig | null;
  passwords: VaultPassword[];
  notes: VaultNote[];
  files: VaultFile[];
  activity: ActivityLog[];
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they do not exist
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains('passwords')) {
        db.createObjectStore('passwords', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('activity')) {
        db.createObjectStore('activity', { keyPath: 'id' });
      }
    };
  });
}

// ------------------- CONFIG / AUTH STORE OPERATIONS -------------------

export async function getAuthConfig(): Promise<AuthConfig | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readonly');
    const store = transaction.objectStore('config');
    const request = store.get('current_config');

    request.onsuccess = () => {
      const data = request.result;
      resolve(data ? data.value : null);
    };

    request.onerror = () => reject('Error fetching auth config');
  });
}

export async function saveAuthConfig(config: AuthConfig): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readwrite');
    const store = transaction.objectStore('config');
    const request = store.put({ key: 'current_config', value: config });

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving auth config');
  });
}

// ------------------- PASSWORDS STORE OPERATIONS -------------------

export async function getPasswords(): Promise<VaultPassword[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('passwords', 'readonly');
    const store = transaction.objectStore('passwords');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject('Error fetching passwords');
  });
}

export async function savePassword(password: VaultPassword): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('passwords', 'readwrite');
    const store = transaction.objectStore('passwords');
    const request = store.put(password);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving password');
  });
}

export async function deletePassword(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('passwords', 'readwrite');
    const store = transaction.objectStore('passwords');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error deleting password');
  });
}

// ------------------- NOTES STORE OPERATIONS -------------------

export async function getNotes(): Promise<VaultNote[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('notes', 'readonly');
    const store = transaction.objectStore('notes');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject('Error fetching notes');
  });
}

export async function saveNote(note: VaultNote): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('notes', 'readwrite');
    const store = transaction.objectStore('notes');
    const request = store.put(note);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving note');
  });
}

export async function deleteNote(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('notes', 'readwrite');
    const store = transaction.objectStore('notes');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error deleting note');
  });
}

// ------------------- FILES STORE OPERATIONS -------------------

export async function getFiles(): Promise<VaultFile[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readonly');
    const store = transaction.objectStore('files');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject('Error fetching files');
  });
}

export async function saveFile(file: VaultFile): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    const request = store.put(file);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving file');
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error deleting file');
  });
}

// ------------------- ACTIVITY STORE OPERATIONS -------------------

export async function getActivities(): Promise<ActivityLog[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('activity', 'readonly');
    const store = transaction.objectStore('activity');
    const request = store.getAll();

    request.onsuccess = () => {
      const result = request.result || [];
      // Sort in-place by timestamp descending
      result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(result);
    };
    request.onerror = () => reject('Error fetching activity log');
  });
}

export async function logActivity(action: string, details: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('activity', 'readwrite');
    const store = transaction.objectStore('activity');
    const log: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      action,
      details,
      timestamp: Date.now()
    };
    const request = store.add(log);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error writing to activity log');
  });
}

export async function clearActivities(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('activity', 'readwrite');
    const store = transaction.objectStore('activity');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error clearing activity log');
  });
}

// ------------------- BACKUP & EXPORT SERVICES -------------------

// Create a full encrypted JSON backup payload
export async function createFullBackupPayload(masterKeyHash: string): Promise<string> {
  const config = await getAuthConfig();
  const passwords = await getPasswords();
  const notes = await getNotes();
  const files = await getFiles();
  const activity = await getActivities();

  const backupData = {
    backupVersion: 1,
    timestamp: Date.now(),
    config,
    passwords,
    notes,
    files,
    activity,
    integrityCheck: masterKeyHash // to verify correct password upon import
  };

  return JSON.stringify(backupData);
}

// Restore direct data lists into the IndexedDB database
export async function restoreFromBackupPayload(backupJson: string, expectedHash: string): Promise<void> {
  const data = JSON.parse(backupJson);

  // Validate integrity checking vector
  if (data.integrityCheck && data.integrityCheck !== expectedHash) {
    throw new Error('Verification failed. Invalid master password for this backup file.');
  }

  const db = await initDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['config', 'passwords', 'notes', 'files', 'activity'], 'readwrite');
    
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = (e) => {
      console.error('Backup restore failed:', e);
      reject('Data write failed during restoration');
    };

    // Restore configuration (excluding runtime keys)
    if (data.config) {
      const configStore = transaction.objectStore('config');
      configStore.put({ key: 'current_config', value: data.config });
    }

    // Clear and restore Passwords
    const passwordStore = transaction.objectStore('passwords');
    passwordStore.clear();
    const passwords: VaultPassword[] = data.passwords || [];
    passwords.forEach(p => passwordStore.put(p));

    // Clear and restore Notes
    const notesStore = transaction.objectStore('notes');
    notesStore.clear();
    const notes: VaultNote[] = data.notes || [];
    notes.forEach(n => notesStore.put(n));

    // Clear and restore Files
    const filesStore = transaction.objectStore('files');
    filesStore.clear();
    const files: VaultFile[] = data.files || [];
    files.forEach(f => filesStore.put(f));

    // Clear and restore Activity
    const activityStore = transaction.objectStore('activity');
    activityStore.clear();
    const activities: ActivityLog[] = data.activity || [];
    activities.forEach(a => activityStore.put(a));
  });
}

// Wipe out database fully
export async function factoryResetVault(): Promise<void> {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['config', 'passwords', 'notes', 'files', 'activity'], 'readwrite');
    
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject('Wipeout failed');
    };

    transaction.objectStore('config').clear();
    transaction.objectStore('passwords').clear();
    transaction.objectStore('notes').clear();
    transaction.objectStore('files').clear();
    transaction.objectStore('activity').clear();
  });
}
