// utils/db.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ---------- Entries (text data) ----------

export async function getEntries(dateKey) {
  const res = await fetch(`${API_URL}/api/entries?dateKey=${dateKey}`);
  if (!res.ok) {
    const isServerError = res.status >= 500;
    if (isServerError) throw new Error(`Server error: ${res.status}`);
    return [];
  }
  return await res.json();
}

export async function setEntriesForDate(dateKey, entries) {
  try {
    const res = await fetch(`${API_URL}/api/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dateKey, entries }),
    });
    return res.ok;
  } catch (e) {
    console.error('setEntriesForDate failed:', e);
    return false;
  }
}

export async function listEntryDates() {
  const res = await fetch(`${API_URL}/api/entries/dates`);
  if (!res.ok) {
    if (res.status >= 500) throw new Error(`Server error: ${res.status}`);
    return [];
  }
  return await res.json();
}

// ---------- Media Blobs (Photos and Videos) ----------

export async function saveMediaBlob(mediaId, blob) {
  try {
    // Convert File/Blob to raw DataURL (base64)
    let safeBlob = blob;
    if (blob instanceof File) {
      safeBlob = new Blob([blob], { type: blob.type });
    }
    
    const dataUrl = await blobToDataURL(safeBlob);
    
    const res = await fetch(`${API_URL}/api/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaId, dataUrl }),
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.mediaId;
  } catch (e) {
    console.error('saveMediaBlob failed:', e);
    return null;
  }
}

export async function getMediaBlob(mediaId) {
  try {
    const res = await fetch(`${API_URL}/api/media?mediaId=${mediaId}`);
    if (!res.ok) return null;
    return await res.blob();
  } catch (e) {
    console.error('getMediaBlob failed:', e);
    return null;
  }
}

export async function deleteMediaBlob(mediaId) {
  if (!mediaId) return false;
  try {
    const res = await fetch(`${API_URL}/api/media?mediaId=${mediaId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error('deleteMediaBlob failed:', e);
    return false;
  }
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
