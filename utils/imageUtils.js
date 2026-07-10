/**
 * Convert any image File/Blob to a JPEG Blob that all browsers can preview.
 * Uses createImageBitmap (supports HEIC on iOS Safari) with canvas fallback.
 */
export async function normalizeImageToJpeg(input) {
  if (!input || input.size === 0) {
    throw new Error('Empty image file');
  }

  // createImageBitmap handles HEIC on iOS Safari
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(input);
      const { width, height } = getScaledDimensions(bitmap.width, bitmap.height, 1920);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      const blob = await canvasToJpeg(canvas);
      if (blob) return blob;
    } catch (err) {
      console.warn('createImageBitmap failed, trying canvas fallback:', err);
    }
  }

  // Fallback: load via object URL + canvas
  const url = URL.createObjectURL(input);
  try {
    const blob = await loadUrlAsJpeg(url);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function getScaledDimensions(width, height, maxSize) {
  if (width <= maxSize && height <= maxSize) return { width, height };
  const ratio = width / height;
  if (width > height) return { width: maxSize, height: Math.round(maxSize / ratio) };
  return { width: Math.round(maxSize * ratio), height: maxSize };
}

function canvasToJpeg(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85); // slightly lower quality for size
  });
}

function loadUrlAsJpeg(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const { width, height } = getScaledDimensions(img.naturalWidth, img.naturalHeight, 1920);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const blob = await canvasToJpeg(canvas);
      blob ? resolve(blob) : reject(new Error('canvas toBlob failed'));
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = url;
  });
}
