// components/VideoRecorder.jsx
import React, { useState, useEffect, useRef } from 'react';
import VideoEditor from './VideoEditor';

export default function VideoRecorder({ visible, onClose, onVideoSaved }) {
  const [screen, setScreen] = useState('idle'); // 'idle' | 'camera' | 'editor'
  const [rawFile, setRawFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  
  const videoStreamRef = useRef(null);
  const videoElemRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setScreen('camera');
      setRawFile(null);
      setRecording(false);
      setRecordSecs(0);
      startCamera();
    } else {
      stopCamera();
      clearInterval(timerRef.current);
      setScreen('idle');
    }
    return () => {
      stopCamera();
      clearInterval(timerRef.current);
    };
  }, [visible]);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (screen === 'camera' && visible) {
      startCamera();
    }
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    // Allow the browser/hardware some time to release camera device
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Try exact facingMode first (required for back camera on many iOS devices),
    // fall back to ideal if exact is not supported
    const constraints = [
      { video: { facingMode: { exact: facingMode } }, audio: true },
      { video: { facingMode: facingMode }, audio: true },
      { video: true, audio: true },
    ];
    
    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        videoStreamRef.current = stream;
        if (videoElemRef.current) {
          videoElemRef.current.srcObject = stream;
        }
        return; // success, stop trying
      } catch (err) {
        console.warn('Camera constraint failed, trying next:', constraint, err);
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
    if (!videoStreamRef.current) return;
    chunksRef.current = [];
    
    // Select mime type support
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
    }

    try {
      const recorder = new MediaRecorder(videoStreamRef.current, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRawFile(blob);
        stopCamera();
        setScreen('editor');
      };

      recorder.start(10); // gather data slices
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
      alert('Không khởi động ghi hình được.');
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
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleEditorDone = ({ blob, timestamp, caption }) => {
    onVideoSaved({ file: blob, timestamp, caption });
    onClose();
  };

  const handleEditorClose = () => {
    setScreen('camera');
    setRawFile(null);
    startCamera();
  };

  if (!visible) return null;

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
            <button
              onClick={onClose}
              style={{
                width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.4)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={toggleFacingMode}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(0,0,0,0.4)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                🔄
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(0,0,0,0.4)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                📁
              </button>
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
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'hidden' }}>
            <video
              ref={videoElemRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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
              style={{
                width: '88px', height: '88px', borderRadius: '50%', border: 'none',
                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', outline: 'none'
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
