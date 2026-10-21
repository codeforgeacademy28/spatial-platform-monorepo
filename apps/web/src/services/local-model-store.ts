export interface ModelTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface StoredModelAsset {
  id: 'active-model';
  name: string;
  mimeType: string;
  file: Blob;
  transform: ModelTransform;
  updatedAt: string;
}

const DATABASE_NAME = 'spatial-platform-local-assets';
const DATABASE_VERSION = 1;
const STORE_NAME = 'models';
const ACTIVE_MODEL_KEY = 'active-model';

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Persistent model storage is not available in this browser.'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open local model storage.'));
    request.onblocked = () => reject(new Error('Local model storage upgrade is blocked by another tab.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local model storage request failed.'));
  });
}

export async function loadStoredModelAsset(): Promise<StoredModelAsset | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const record = await requestResult(transaction.objectStore(STORE_NAME).get(ACTIVE_MODEL_KEY)) as StoredModelAsset | undefined;
    if (!record || !(record.file instanceof Blob) || !record.name || !isValidTransform(record.transform)) return null;
    return record;
  } finally {
    database.close();
  }
}

export async function saveStoredModelAsset(record: Omit<StoredModelAsset, 'id' | 'updatedAt'>): Promise<void> {
  if (!record.name.trim() || !(record.file instanceof Blob) || !isValidTransform(record.transform)) {
    throw new Error('Model asset metadata or transform is invalid.');
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ ...record, id: ACTIVE_MODEL_KEY, updatedAt: new Date().toISOString() } satisfies StoredModelAsset);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save the model asset locally.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Local model save was cancelled.'));
    });
  } finally {
    database.close();
  }
}

export async function removeStoredModelAsset(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(ACTIVE_MODEL_KEY);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to remove the local model asset.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Local model removal was cancelled.'));
    });
  } finally {
    database.close();
  }
}

export function isValidTransform(value: unknown): value is ModelTransform {
  if (!value || typeof value !== 'object') return false;
  const transform = value as Partial<ModelTransform>;
  return [transform.position, transform.rotation, transform.scale].every((tuple) =>
    Array.isArray(tuple) && tuple.length === 3 && tuple.every((component) => typeof component === 'number' && Number.isFinite(component)),
  ) && (transform.scale as number[]).every((component) => component > 0);
}

export const IDENTITY_MODEL_TRANSFORM: ModelTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};
