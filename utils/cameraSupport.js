export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** iOS PWA: native file input is far more stable than getUserMedia */
export function canUseInAppCamera() {
  if (typeof window === 'undefined') return false;
  if (isIOS()) return false;
  return window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
}

export function getCameraErrorMessage(err) {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Camera trong app cần HTTPS (hoặc localhost). Hãy chọn ảnh từ thư viện.';
  }
  const name = err?.name || '';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Không tìm thấy camera trên thiết bị này.';
  }
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Bạn chưa cấp quyền truy cập camera.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Camera đang được app khác sử dụng.';
  }
  return 'Không mở được camera.';
}
