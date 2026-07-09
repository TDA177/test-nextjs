// utils/db.js
const DB_NAME = 'NhatKyBeXinhDB';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries');
        }
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media');
        }
      };
      
      request.onsuccess = (e) => {
        resolve(e.target.result);
      };
      
      request.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }
  return dbPromise;
}

// ---------- Entries (text data) ----------

export async function getEntries(dateKey) {
  const db = await getDB();
  if (!db) return [];
  
  return new Promise((resolve) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const request = store.get(dateKey);
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

export async function setEntriesForDate(dateKey, entries) {
  const db = await getDB();
  if (!db) return false;
  
  return new Promise((resolve) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    
    let request;
    if (!entries || entries.length === 0) {
      request = store.delete(dateKey);
    } else {
      request = store.put(entries, dateKey);
    }
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = () => {
      resolve(false);
    };
  });
}

export async function listEntryDates() {
  const db = await getDB();
  if (!db) return [];
  
  return new Promise((resolve) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const request = store.getAllKeys();
    
    request.onsuccess = () => {
      const keys = request.result || [];
      // Sort in reverse order to show newest dates first
      resolve(keys.sort().reverse());
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

// ---------- Media Blobs (Photos and Videos) ----------

export async function saveMediaBlob(mediaId, blob) {
  const db = await getDB();
  if (!db) return null;
  
  // Convert File objects to raw Blobs to prevent DataCloneError on iOS Safari
  let safeBlob = blob;
  if (blob instanceof File) {
    safeBlob = new Blob([blob], { type: blob.type });
  }
  
  return new Promise((resolve) => {
    const tx = db.transaction('media', 'readwrite');
    const store = tx.objectStore('media');
    const request = store.put(safeBlob, mediaId);
    
    request.onsuccess = () => {
      resolve(mediaId);
    };
    
    request.onerror = (e) => {
      console.error('saveMediaBlob failed:', e);
      resolve(null);
    };
  });
}

export async function getMediaBlob(mediaId) {
  const db = await getDB();
  if (!db) return null;
  
  return new Promise((resolve) => {
    const tx = db.transaction('media', 'readonly');
    const store = tx.objectStore('media');
    const request = store.get(mediaId);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = () => {
      resolve(null);
    };
  });
}

export async function deleteMediaBlob(mediaId) {
  if (!mediaId) return;
  const db = await getDB();
  if (!db) return;
  
  return new Promise((resolve) => {
    const tx = db.transaction('media', 'readwrite');
    const store = tx.objectStore('media');
    const request = store.delete(mediaId);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = () => {
      resolve(false);
    };
  });
}

// Helper to create object URL from Media ID
const objectUrlMap = new Map();

export async function getMediaUrl(mediaId) {
  if (!mediaId || typeof mediaId !== 'string') return null;
  
  // If it's already an HTTP or Blob URL, return as-is
  if (mediaId.startsWith('http') || mediaId.startsWith('blob:')) {
    return mediaId;
  }
  
  // Check if we already created an Object URL in this session
  if (objectUrlMap.has(mediaId)) {
    return objectUrlMap.get(mediaId);
  }
  
  const blob = await getMediaBlob(mediaId);
  if (!blob) return null;
  
  const url = URL.createObjectURL(blob);
  objectUrlMap.set(mediaId, url);
  return url;
}

export function revokeMediaUrl(mediaId) {
  if (objectUrlMap.has(mediaId)) {
    const url = objectUrlMap.get(mediaId);
    URL.revokeObjectURL(url);
    objectUrlMap.delete(mediaId);
  }
}
