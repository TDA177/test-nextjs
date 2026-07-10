// components/VideoRecorder.jsx
import React, { useState, useEffect, useRef } from 'react';
import VideoEditor from './VideoEditor';
import { getCameraErrorMessage } from '../utils/cameraSupport';
import { getSupportedRecorderMimeType } from '../utils/videoUtils';
import IconButton from './ui/IconButton';
import { X, RefreshCw, FolderOpen } from 'lucide-react';

export default function VideoRecorder({ visible, onClose, onVideoSaved }) {
  const [screen, setScreen] = useState('idle'); // 'idle' | 'camera' | 'editor'
  const [rawFile, setRawFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  
  const videoElemRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoStreamRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setScreen('camera');
      setRawFile(null);
      setRecording(false);
      setRecordSecs(0);
    } else {
      stopCamera();
      clearInterval(timerRef.current);
      setScreen('idle');
    }
    return () => {
      stopCamera();
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (screen === 'camera' && visible) {
      startCamera();
    }
  }, [facingMode]);

  const cameraStartIdRef = useRef(0);

  const startCamera = async () => {
    stopCamera();

    // Unique ID to detect if another startCamera call superseded this one
    const thisId = ++cameraStartIdRef.current;

    // Allow the browser/hardware some time to release camera device
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Abort if a newer startCamera call was made while we waited
    if (thisId !== cameraStartIdRef.current) return;

    // Try exact facingMode first (required for back camera on many iOS devices),
    // fall back to ideal, then any camera
    const constraints = [
      { video: { facingMode: { exact: facingMode } }, audio: true },
      { video: { facingMode: facingMode }, audio: true },
      { video: true, audio: true },
    ];

    for (const constraint of constraints) {
      // Abort if superseded
      if (thisId !== cameraStartIdRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        // Abort if superseded while awaiting getUserMedia
        if (thisId !== cameraStartIdRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoStreamRef.current = stream;
        if (videoElemRef.current) {
          videoElemRef.current.srcObject = stream;
        }
        return; // success
      } catch (err) {
        console.warn('Camera constraint failed, trying next:', err.message);
      }
    }
    console.error('All camera constraints failed');
  };

  const stopCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (videoElemRef.current) {
      videoElemRef.current.srcObject = null;
    }
  };

  const handleToggleRecord = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!videoStreamRef.current) {
      alert('Camera chưa sẵn sàng. Vui lòng thử lại.');
      return;
    }
    chunksRef.current = [];

    // Detect supported mime type — iOS Safari only supports mp4, desktop supports webm
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',           // iOS Safari 14.3+
      'video/mp4;codecs=avc1', // iOS Safari fallback
    ];

    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    if (!selectedMime) {
      alert('Trình duyệt này không hỗ trợ quay video. Hãy dùng nút 📁 để chọn video từ thư viện.');
      return;
    }

    try {
      const recorder = new MediaRecorder(videoStreamRef.current, { mimeType: selectedMime });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blobType = selectedMime.startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size === 0) {
          alert('Không ghi được video. Hãy thử lại hoặc chọn từ thư viện.');
          setScreen('camera');
          // If retryCamera was a function we had, we would call it. But we just use startCamera
          startCamera();
          return;
        }
        setRawFile(blob);
        stopCamera();
        setScreen('editor');
      };

      recorder.start(100); // gather data slices every 100ms
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSecs(0);

      timerRef.current = setInterval(() => {
        setRecordSecs((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder start failed:', err);
      alert('Không khởi động ghi hình được. Hãy dùng nút 📁 để chọn video.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawFile(file);
      stopCamera();
      setScreen('editor');
    }
  };

  const toggleFacingMode = () => {
    if (recording || !ready) return;
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleEditorDone = ({ blob, timestamp, caption }) => {
    onVideoSaved({ file: blob, timestamp, caption });
    // Delay close so tap on XONG doesn't fall through to backdrop (iOS)
    setTimeout(() => onClose(), 350);
  };

  const handleEditorClose = () => {
    setScreen('camera');
    setRawFile(null);
    retryCamera();
  };

  if (!visible) return null;

  const cameraErrorMsg = error ? getCameraErrorMessage(error) : null;

  return (
    <>
      {/* CAMERA SCREEN */}
      {screen === 'camera' && (
        <div
          style={{
            position: 'fixed', inset: 0, background: '#050505', zIndex: 9999,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            fontFamily: 'sans-serif', color: 'white', userSelect: 'none'
          }}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '50px 24px 8px 24px', zIndex: 10 }}>
            <IconButton icon={X} label="Đóng" variant="dark" size="lg" onClick={onClose} />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <IconButton
                icon={RefreshCw}
                label="Đổi camera"
                variant="dark"
                size="lg"
                disabled={recording || !ready}
                onClick={toggleFacingMode}
              />
              
              <IconButton
                icon={FolderOpen}
                label="Chọn video"
                variant="dark"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
              />
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleSelectFile}
            />
          </div>

          {/* Camera Feed */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
            <video
              ref={videoElemRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />
            {(!ready || cameraErrorMsg) && (
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
                {cameraErrorMsg ? (
                  <div style={{ textAlign: 'center', padding: '0 32px' }}>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {cameraErrorMsg}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '12px 24px', borderRadius: '12px', border: 'none',
                        background: '#FF8FB1', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                      }}
                    >
                      Chọn video từ thư viện
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

          {/* Record Label overlay */}
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 40px', marginTop: '20px' }}>
            <span style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '10px', color: 'rgba(255,255,255,0.1)' }}>
              NHẬT KÝ
            </span>
            <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              {recording ? `ĐANG QUAY: ${recordSecs}s / 60s` : 'VIDEO · TỐI ĐA 60 GIÂY'}
            </p>
          </div>

          {/* Control Button Area */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '44px', gap: '20px' }}>
            <button
              onClick={handleToggleRecord}
              disabled={!ready}
              style={{
                width: '88px', height: '88px', borderRadius: '50%', border: 'none',
                background: 'transparent', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', outline: 'none', opacity: ready ? 1 : 0.35
              }}
            >
              {/* Outer pulsing ring */}
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: recording ? '4px solid #ef4444' : '2px solid rgba(255,255,255,0.6)',
                  transform: recording ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                  animation: recording ? 'pulseRing 1.1s infinite alternate' : 'none'
                }}
              />
              {/* Inner red dot */}
              <div
                style={{
                  width: recording ? '32px' : '72px',
                  height: recording ? '32px' : '72px',
                  borderRadius: recording ? '8px' : '50%',
                  backgroundColor: recording ? '#ef4444' : 'white',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              />
            </button>

            <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px' }}>
              {recording ? 'BẤM ĐỂ DỪNG QUAY' : 'NHẤN ĐỂ QUAY · ICON THƯ MỤC ĐỂ CHỌN'}
            </span>
          </div>

          {/* Pulse ring animation style */}
          <style>{`
            @keyframes pulseRing {
              from { transform: scale(1.05); opacity: 0.9; }
              to { transform: scale(1.25); opacity: 0.3; }
            }
          `}</style>
        </div>
      )}

      {/* VIDEO EDITOR SCREEN */}
      {screen === 'editor' && rawFile && (
        <VideoEditor
          visible={true}
          videoFile={rawFile}
          onClose={handleEditorClose}
          onDone={handleEditorDone}
        />
      )}
    </>
  );
}
