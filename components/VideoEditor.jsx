// components/VideoEditor.jsx
import React, { useState, useEffect, useRef } from 'react';

const CAPTION_PRESETS = [
  'hôm nay mình...',
  'khoảnh khắc này ✨',
  'ngày bình thường 🌤',
  'chill thôi nào',
  'busy day 📚',
  'ăn gì đây 🍜',
  'đang học bài',
  'trên đường về',
  'buổi sáng của mình ☀️',
  'tối rồi nè 🌙',
];

function genHourSlots() {
  const slots = [];
  const now = new Date();
  const currentH = now.getHours();
  const currentM = now.getMinutes();
  const hh = String(currentH).padStart(2, '0');
  const mm = String(currentM).padStart(2, '0');
  slots.push({ label: 'Bây giờ', value: `${hh}:${mm}` });
  for (let h = currentH; h >= 0; h--) {
    const label = `${String(h).padStart(2, '0')}:00`;
    slots.push({ label, value: label });
  }
  return slots;
}

export default function VideoEditor({ visible, videoFile, onClose, onDone }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [timestamp, setTimestamp] = useState(''); // empty = unselected
  const [caption, setCaption] = useState('');
  const [showTsPicker, setShowTsPicker] = useState(false);
  const [customTs, setCustomTs] = useState('');
  
  const videoRef = useRef(null);
  const hourSlots = genHourSlots();

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      setTimestamp('');
      setCaption('');
      setShowTsPicker(false);
      setCustomTs('');
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);

  const handleDone = () => {
    onDone({
      blob: videoFile,
      timestamp: timestamp.trim(),
      caption: caption.trim()
    });
  };

  if (!visible || !videoFile) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#050505', zIndex: 10000,
        display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif',
        color: 'white', userSelect: 'none'
      }}
    >
      {/* ── VIDEO PREVIEW OVERLAY ── */}
      <div style={{ height: '52%', background: '#111', position: 'relative', overflow: 'hidden' }}>
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#111' }} />
        )}

        {/* Bottom vignette */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />

        {/* Text overlays (SetLog style) */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: '0 24px', textAlign: 'center' }}>
          {timestamp.length > 0 ? (
            <span
              style={{
                fontSize: '50px', fontWeight: '900', color: 'rgba(255,255,255,0.92)',
                letterSpacing: '2px', textShadow: '0 2px 8px rgba(0,0,0,0.5)', fontFamily: 'monospace',
                animation: 'pulseText 1.8s infinite alternate'
              }}
            >
              {timestamp}
            </span>
          ) : (
            <span style={{ fontSize: '14px', fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
              chọn giờ phía dưới
            </span>
          )}
          
          {caption.trim().length > 0 ? (
            <span style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.88)', marginTop: '4px', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
              {caption}
            </span>
          ) : (
            <span style={{ fontSize: '16px', fontStyle: 'italic', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
              caption của bạn...
            </span>
          )}
        </div>

        {/* Top Header Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '50px 20px 12px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '8px'
            }}
          >
            ←
          </button>
          
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '4px', color: 'rgba(255,255,255,0.7)' }}>
            CHỈNH SỬA
          </span>
          
          <button
            onClick={handleDone}
            style={{
              backgroundColor: '#FF8FB1', border: 'none', color: 'white', padding: '7px 18px',
              borderRadius: '99px', fontWeight: '900', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer'
            }}
          >
            XONG
          </button>
        </div>
      </div>

      {/* ── EDITOR SLIDERS PANEL ── */}
      <div style={{ flex: 1, backgroundColor: '#0E0E0E', padding: '20px', overflowY: 'auto' }}>
        
        {/* TIME PICKER SECTION */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px' }}>
            <span>🕒</span> THỜI GIAN
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              onClick={() => setShowTsPicker(!showTsPicker)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
              }}
            >
              {timestamp.length > 0 ? (
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'white', fontFamily: 'monospace' }}>{timestamp}</span>
              ) : (
                <span style={{ fontSize: '14px', fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>Chưa chọn giờ (tuỳ chọn)</span>
              )}
              <span>{showTsPicker ? '▲' : '▼'}</span>
            </div>

            {timestamp.length > 0 && (
              <button
                onClick={() => { setTimestamp(''); setShowTsPicker(false); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '20px' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Time Picker Dropdown */}
          {showTsPicker && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Custom Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="vd: 08:30"
                  value={customTs}
                  onChange={(e) => setCustomTs(e.target.value)}
                  maxLength={5}
                  style={{
                    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px',
                    padding: '10px 14px', color: 'white', fontSize: '16px', fontWeight: '700',
                    border: '1px solid rgba(255,255,255,0.12)', outline: 'none', fontFamily: 'monospace'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && /^\d{2}:\d{2}$/.test(customTs)) {
                      setTimestamp(customTs);
                      setShowTsPicker(false);
                      setCustomTs('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (/^\d{2}:\d{2}$/.test(customTs)) {
                      setTimestamp(customTs);
                      setShowTsPicker(false);
                      setCustomTs('');
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(255,143,177,0.2)', border: '1px solid rgba(255,143,177,0.4)',
                    color: '#FF8FB1', padding: '0 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800'
                  }}
                >
                  OK
                </button>
              </div>

              {/* Preset Slots Scroll */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexShrink: 0, minHeight: '52px' }}>
                {hourSlots.map((slot, i) => {
                  const isActive = timestamp === slot.value;
                  const isNow = slot.label === 'Bây giờ';
                  return (
                    <button
                      key={i}
                      onClick={() => { setTimestamp(slot.value); setShowTsPicker(false); }}
                      style={{
                        backgroundColor: isActive ? 'rgba(255,143,177,0.15)' : 'rgba(255,255,255,0.06)',
                        border: isActive ? '1px solid #FF8FB1' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', padding: '8px 14px', color: 'white', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px'
                      }}
                    >
                      {isNow && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF8FB1', marginBottom: '3px' }} />}
                      <span style={{ fontSize: '11px', color: isNow ? '#FF8FB1' : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                        {slot.label}
                      </span>
                      {!isNow && <span style={{ fontSize: '13px', fontWeight: '800', marginTop: '2px', fontFamily: 'monospace' }}>{slot.value}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CAPTION SECTION */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px' }}>
            <span>📝</span> CAPTION
          </div>

          <input
            type="text"
            placeholder="ghi gì đó thật ngắn..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={60}
            style={{
              width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '12px',
              padding: '12px 16px', color: 'white', fontSize: '16px', fontWeight: '500',
              border: '1px solid rgba(255,255,255,0.1)', outline: 'none', marginBottom: '12px'
            }}
          />

          {/* Quick presets list */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexShrink: 0, minHeight: '34px' }}>
            {CAPTION_PRESETS.map((p) => {
              const isActive = caption === p;
              return (
                <button
                  key={p}
                  onClick={() => setCaption(p)}
                  style={{
                    backgroundColor: isActive ? 'rgba(255,143,177,0.15)' : 'rgba(255,255,255,0.06)',
                    border: isActive ? '1px solid #FF8FB1' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '99px', padding: '7px 14px', color: isActive ? '#FF8FB1' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap'
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseText {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
