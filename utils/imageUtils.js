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
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
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

function canvasToJpeg(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
}

function loadUrlAsJpeg(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const blob = await canvasToJpeg(canvas);
      blob ? resolve(blob) : reject(new Error('canvas toBlob failed'));
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = url;
  });
}
