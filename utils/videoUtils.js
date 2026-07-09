/** Pick the first MediaRecorder mime type supported by this browser/device */
export function getSupportedRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;

  const candidates = [
    'video/mp4',
    'video/mp4;codecs=avc1,mp4a',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

export function blobToVideoUrl(input) {
  if (!input) return null;
  if (input instanceof Blob || input instanceof File) {
    return URL.createObjectURL(input);
  }
  if (typeof input === 'string') {
    return input.startsWith('http') || input.startsWith('blob:') ? input : null;
  }
  return null;
}
