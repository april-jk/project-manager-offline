export type StoreName =
  | 'projects'
  | 'resources'
  | 'memos'
  | 'settings'
  | 'backups'
  | 'dataSources'
  | 'widgets';

const DB_NAME = 'project-hub';
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('resources')) {
        const store = db.createObjectStore('resources', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('memos')) {
        const store = db.createObjectStore('memos', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('dataSources')) {
        const store = db.createObjectStore('dataSources', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('widgets')) {
        const store = db.createObjectStore('widgets', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  return withStore(storeName, 'readonly', (store) => store.getAll());
}

export async function getItem<T>(
  storeName: StoreName,
  key: IDBValidKey
): Promise<T | undefined> {
  return withStore(storeName, 'readonly', (store) => store.get(key));
}

export async function putItem<T>(
  storeName: StoreName,
  value: T
): Promise<void> {
  await withStore(storeName, 'readwrite', (store) => store.put(value));
}

export async function putItems<T>(
  storeName: StoreName,
  values: T[]
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    values.forEach((value) => {
      store.put(value);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteItem(
  storeName: StoreName,
  key: IDBValidKey
): Promise<void> {
  await withStore(storeName, 'readwrite', (store) => store.delete(key));
}

export async function deleteItems(
  storeName: StoreName,
  keys: IDBValidKey[]
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    keys.forEach((key) => store.delete(key));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  await withStore(storeName, 'readwrite', (store) => store.clear());
}

export async function getAllFromIndex<T>(
  storeName: StoreName,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(query);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function countAll(
  storeName: StoreName
): Promise<number> {
  const result = await withStore(storeName, 'readonly', (store) => store.count());
  return result || 0;
}

export async function exportStore<T>(storeName: StoreName): Promise<T[]> {
  return getAll<T>(storeName);
}
