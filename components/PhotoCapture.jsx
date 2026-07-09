// components/PhotoCapture.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useCameraStream } from '../utils/useCameraStream';
import { getCameraErrorMessage } from '../utils/cameraSupport';

export default function PhotoCapture({ visible, onClose, onPhotoCaptured, onFallbackToGallery }) {
  const [screen, setScreen] = useState('camera'); // 'camera' | 'preview'
  const [facingMode, setFacingMode] = useState('environment');
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);

  const videoRef = useRef(null);
  const fallbackInputRef = useRef(null);
  const { streamRef, stopCamera, error, ready } = useCameraStream({
    active: visible && screen === 'camera',
    facingMode,
    videoRef,
    includeAudio: false,
  });

  const clearPreview = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
  };

  useEffect(() => {
    if (!visible) {
      stopCamera();
      clearPreview();
      setScreen('camera');
      setFacingMode('environment');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const resetState = () => {
    clearPreview();
    setScreen('camera');
    setFacingMode('environment');
  };

  const handleClose = () => {
    stopCamera();
    resetState();
    onClose();
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || video.videoWidth === 0) return;

    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings?.() || {};
    const w = settings.width || video.videoWidth;
    const h = settings.height || video.videoHeight;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedUrl(url);
        setScreen('preview');
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    clearPreview();
    setScreen('camera');
  };

  const handleUsePhoto = () => {
    if (capturedBlob) {
      onPhotoCaptured(capturedBlob);
    }
    handleClose();
  };

  const toggleFacingMode = () => {
    if (!ready) return;
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleFallbackPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    onFallbackToGallery?.(file);
    handleClose();
  };

  const errorMessage = error ? getCameraErrorMessage(error) : null;

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050505',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        color: 'white',
        userSelect: 'none',
      }}
    >
      {screen === 'camera' && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '50px 24px 8px 24px',
              zIndex: 10,
            }}
          >
            <button
              onClick={handleClose}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.4)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
            <button
              onClick={toggleFacingMode}
              disabled={!ready}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.4)',
                color: 'white',
                cursor: ready ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: ready ? 1 : 0.4,
              }}
            >
              🔄
            </button>
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              overflow: 'hidden',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />
            {(errorMessage || !ready) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                }}
              >
                {errorMessage ? (
                  <div style={{ textAlign: 'center', padding: '0 32px' }}>
                    <p style={{ fontSize: '40px', marginBottom: '16px' }}>📷</p>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: '20px' }}>
                      {errorMessage}
                    </p>
                    <button
                      onClick={() => fallbackInputRef.current?.click()}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#FF8FB1',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Chọn từ thư viện
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    Đang mở camera...
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 'auto',
              paddingBottom: '44px',
              gap: '16px',
            }}
          >
            <button
              onClick={handleCapture}
              disabled={!ready}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '4px solid white',
                background: 'white',
                cursor: ready ? 'pointer' : 'not-allowed',
                outline: 'none',
                opacity: ready ? 1 : 0.35,
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '3px',
              }}
            >
              NHẤN ĐỂ CHỤP
            </span>
          </div>

          <input
            ref={fallbackInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFallbackPick}
          />
        </>
      )}

      {screen === 'preview' && capturedUrl && (
        <>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: '#111',
            }}
          >
            <img
              src={capturedUrl}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '20px 24px 40px 24px',
              zIndex: 10,
            }}
          >
            <button
              onClick={handleRetake}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Chụp lại
            </button>
            <button
              onClick={handleUsePhoto}
              style={{
                flex: 2,
                padding: '14px 0',
                borderRadius: '16px',
                border: 'none',
                background: '#FF8FB1',
                color: 'white',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Dùng ảnh này
            </button>
          </div>
        </>
      )}
    </div>
  );
}
