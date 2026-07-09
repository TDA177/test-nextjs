// components/DayReplayModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getEntries } from '../utils/db';
import { fmtFull, keyToDate } from '../utils/helpers';
import { getMediaUrl } from '../utils/db';

function normalizeClip(entry) {
  if (!entry?.video) return null;
  const v = entry.video;
  const uri = typeof v === 'string' ? v : v?.uri;
  if (!uri) return null;
  return {
    id: entry.id,
    uri,
    timestamp: (typeof v === 'object' && v.timestamp) || entry.time || '',
    caption: (typeof v === 'object' && v.caption) || entry.note || '',
    sortTime: entry.time || '00:00',
  };
}

function ReplayPanel({ clip, height, paused, onToggle, onExpand }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const url = await getMediaUrl(clip.uri);
      if (active) setVideoUrl(url || clip.uri);
    }
    load();
    return () => {
      active = false;
    };
  }, [clip.uri]);

  useEffect(() => {
    if (!videoRef.current || !ready) return;
    if (paused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [paused, ready]);

  if (error) {
    return (
      <div
        onClick={onToggle}
        style={{
          height: `${height}px`, background: '#111', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative'
        }}
      >
        <span>⚠️</span>
        <span style={{ fontSize: '12px' }}>Không phát được clip</span>
        <Overlay timestamp={clip.timestamp} caption={clip.caption} />
      </div>
    );
  }

  return (
    <div
      onClick={onToggle}
      onDoubleClick={onExpand}
      style={{
        height: `${height}px`, background: '#111', overflow: 'hidden', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.15)', position: 'relative'
      }}
    >
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay={!paused}
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onCanPlay={() => setReady(true)}
          onError={() => setError(true)}
        />
      )}

      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid #FF8FB1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {paused && ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white' }}>
            ▶
          </div>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        style={{
          position: 'absolute', top: '10px', right: '10px', width: '34px', height: '34px', borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.25)', color: 'white',
          fontSize: '14px', cursor: 'pointer', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        ⤢
      </button>

      <Overlay timestamp={clip.timestamp} caption={clip.caption} />
    </div>
  );
}

function ClipFullscreenModal({ clip, visible, onClose }) {
  const [videoUrl, setVideoUrl] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (clip?.uri) {
        const url = await getMediaUrl(clip.uri);
        if (active) setVideoUrl(url || clip.uri);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [clip?.uri]);

  useEffect(() => {
    if (!visible && videoRef.current) {
      videoRef.current.pause();
    }
  }, [visible]);

  if (!clip || !visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 10002, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch' }}>
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
        />
      )}

      <Overlay timestamp={clip.timestamp} caption={clip.caption} />

      {/* Top Navigation */}
      <div style={{ position: 'relative', zIndex: 5, padding: '50px 16px 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
        <button
          onClick={onClose}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ✕
        </button>
        <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: '3px' }}>CLIP</span>
        <div style={{ width: '40px' }} />
      </div>
    </div>
  );
}

function Overlay({ timestamp, caption }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', textAlign: 'center', pointerEvents: 'none', zIndex: 2 }}>
      {timestamp && (
        <span style={{ fontSize: '42px', fontWeight: '900', color: 'rgba(255,255,255,0.94)', letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.55)', fontFamily: 'monospace' }}>
          {timestamp}
        </span>
      )}
      {caption && (
        <span style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: '4px', textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}>
          {caption}
        </span>
      )}
    </div>
  );
}

export default function DayReplayModal({ visible, dateKey, onClose }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [expandedClip, setExpandedClip] = useState(null);
  const [containerHeight, setContainerHeight] = useState(480);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!visible || !dateKey) return;
    let active = true;

    (async () => {
      setLoading(true);
      setPaused(false);
      setExpandedClip(null);
      const entries = await getEntries(dateKey);
      const list = entries
        .map(normalizeClip)
        .filter(Boolean)
        .sort((a, b) => a.sortTime.localeCompare(b.sortTime));

      if (active) {
        setClips(list);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [visible, dateKey]);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, [loading, clips]);

  if (!visible) return null;

  const dateLabel = dateKey ? fmtFull(keyToDate(dateKey)) : '';
  const itemHeight = clips.length > 0
    ? (clips.length >= 3 ? containerHeight / 3 : containerHeight / clips.length)
    : 200;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'black', zIndex: 10001,
        display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif',
        color: 'white', userSelect: 'none'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '50px 16px 10px 16px', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10 }}>
        <button
          onClick={onClose}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
          <p style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: '3px' }}>DAY REPLAY</p>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dateLabel}
          </p>
        </div>

        <button
          onClick={() => setPaused(!paused)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {paused ? '▶' : '⏸'}
        </button>
      </div>

      {/* Main Grid Stack */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #FF8FB1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>Đang ghép clip...</span>
          </div>
        ) : clips.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center', gap: '12px' }}>
            <span style={{ fontSize: '48px' }}>🎬</span>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'white' }}>Chưa có video trong ngày này</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4', maxWidth: '260px' }}>
              Thêm ghi chú có video (Quay video) để xem Day Replay kiểu TikTok.
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {clips.map((clip) => (
              <ReplayPanel
                key={clip.id}
                clip={clip}
                height={itemHeight}
                paused={paused}
                onToggle={() => setPaused(!paused)}
                onExpand={() => setExpandedClip(clip)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!loading && clips.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px 20px 16px', backgroundColor: 'rgba(0,0,0,0.35)', fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: '600', zIndex: 10 }}>
          {clips.length} clip · chạm khung tạm dừng · đúp chuột/icon để phóng to
        </div>
      )}

      {/* Fullscreen expanded clip */}
      <ClipFullscreenModal
        clip={expandedClip}
        visible={!!expandedClip}
        onClose={() => setExpandedClip(null)}
      />
    </div>
  );
}
