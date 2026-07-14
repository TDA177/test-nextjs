// components/VideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Music, Video, Maximize2, Play, X, AlertCircle } from 'lucide-react';
import { getMediaUrl } from '../utils/db';

function WaveBarsSmall() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '10px' }}>
      {[0.4, 0.8, 0.5, 0.9].map((val, i) => (
        <div
          key={i}
          className="wave-bar-small"
          style={{
            width: '2px',
            height: '10px',
            borderRadius: '1px',
            backgroundColor: '#FF8FB1',
            animationDelay: `${i * 0.15}s`,
            animationDuration: `${0.6 + i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function StoryMusicSticker({ track }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        padding: '8px 12px',
        borderRadius: '22px',
        alignSelf: 'center',
        margin: '0 auto 20px auto',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        maxWidth: '85%',
        width: 'max-content',
        gap: '8px',
      }}
    >
      <div
        className="spinning"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#1E1E24',
          border: '1.5px solid rgba(255,255,255,0.4)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        ) : (
          <Music size={12} strokeWidth={2.25} aria-hidden />
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: '0', maxWidth: '160px', textAlign: 'left' }}>
        <span style={{ color: 'white', fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
        </span>
        <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
          {track.artist || 'Unknown Artist'}
        </span>
      </div>

      <WaveBarsSmall />
    </div>
  );
}

export default function VideoPlayer({ uri, timestamp, caption, style, onRemove, track }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fullPlaying, setFullPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fullProgress, setFullProgress] = useState(0);
  const [error, setError] = useState(false);

  const inlineVideoRef = useRef(null);
  const fullVideoRef = useRef(null);
  const audioRef = useRef(null);

  // Resolve video URL from blob URL string, Blob, or IndexedDB id
  useEffect(() => {
    let active = true;
    let ownedUrl = null;

    async function loadUrl() {
      if (!uri) {
        if (active) setVideoUrl('');
        return;
      }

      if (typeof uri === 'string') {
        if (uri.startsWith('blob:') || uri.startsWith('http')) {
          if (active) setVideoUrl(uri);
          return;
        }
        const url = await getMediaUrl(uri);
        if (active) setVideoUrl(url || '');
        return;
      }

      if (uri instanceof Blob || uri instanceof File) {
        ownedUrl = URL.createObjectURL(uri);
        if (active) setVideoUrl(ownedUrl);
      }
    }

    setError(false);
    loadUrl();

    return () => {
      active = false;
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    };
  }, [uri]);

  // Audio setup for background music in fullscreen mode
  useEffect(() => {
    if (fullscreen && track?.previewUrl) {
      const audio = new Audio(track.previewUrl);
      audio.loop = true;
      audioRef.current = audio;
      
      if (fullPlaying) {
        audio.play().catch((err) => console.warn('Fullscreen audio play error:', err));
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [fullscreen, track]);

  // Sync background music with fullscreen video play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (fullPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [fullPlaying]);

  // Handle inline video progress
  const handleInlineTimeUpdate = () => {
    if (inlineVideoRef.current) {
      const cur = inlineVideoRef.current.currentTime;
      const dur = inlineVideoRef.current.duration || 1;
      setProgress((cur / dur) * 100);
    }
  };

  // Handle fullscreen video progress
  const handleFullTimeUpdate = () => {
    if (fullVideoRef.current) {
      const cur = fullVideoRef.current.currentTime;
      const dur = fullVideoRef.current.duration || 1;
      setFullProgress((cur / dur) * 100);
    }
  };

  const handleInlinePlayPause = (e) => {
    e.stopPropagation();
    if (!inlineVideoRef.current) return;

    if (isPlaying) {
      inlineVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      inlineVideoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setError(true));
    }
  };

  const openFullscreen = () => {
    if (inlineVideoRef.current) {
      inlineVideoRef.current.pause();
      setIsPlaying(false);
    }
    setFullPlaying(true);
    setFullscreen(true);
  };

  const closeFullscreen = () => {
    setFullscreen(false);
    setFullPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleFullPlayToggle = () => {
    if (!fullVideoRef.current) return;

    if (fullPlaying) {
      fullVideoRef.current.pause();
      setFullPlaying(false);
    } else {
      fullVideoRef.current.play()
        .then(() => setFullPlaying(true))
        .catch(() => {});
    }
  };

  if (error) {
    return (
      <div 
        style={{
          height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#111', borderRadius: '16px', color: 'rgba(255,255,255,0.5)', gap: '8px', ...style
        }}
      >
        <AlertCircle size={22} strokeWidth={2} />
        <span style={{ fontSize: '12px' }}>Không thể phát video</span>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: '16px', ...style }}>
        <div className="ui-spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Inline Video Card */}
      <div
        style={{
          height: '200px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#111',
          position: 'relative',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          ...style
        }}
        onClick={openFullscreen}
      >
        <video
          ref={inlineVideoRef}
          src={videoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          playsInline
          onTimeUpdate={handleInlineTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={() => setError(true)}
        />

        {/* Timestamps / Caption overlays */}
        {(timestamp || caption) && (
          <div
            style={{
              position: 'absolute', inset: '0 0 32px 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center'
            }}
          >
            {timestamp && (
              <span style={{ fontSize: '22px', fontWeight: '900', color: 'rgba(255,255,255,0.92)', letterSpacing: '1px', textShadow: '0 2px 8px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
                {timestamp}
              </span>
            )}
            {caption && (
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.88)', marginTop: '2px', letterSpacing: '0.2px', textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                {caption}
              </span>
            )}
          </div>
        )}

        {/* Inline play / pause controls overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute', top: '10px', left: '10px', width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px'
            }}
          >
            <Maximize2 size={14} strokeWidth={2.25} />
          </div>
          
          <button
            onClick={handleInlinePlayPause}
            style={{
              width: '48px', height: '48px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(0,0,0,0.45)', color: 'white', cursor: 'pointer',
              display: isPlaying ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Play size={20} fill="white" strokeWidth={0} />
          </button>
        </div>

        {/* Inline close / remove button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            style={{
              position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 20
            }}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        )}

        {/* Bottom Progress Bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 10px 8px 10px', backgroundColor: 'rgba(0,0,0,0.4)', pointerEvents: 'none' }}>
          <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#FF8FB1', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,143,177,0.8)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', color: 'white' }}>
              <Video size={10} strokeWidth={2.5} />
              VIDEO
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Video Story Modal */}
      {fullscreen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'black', zIndex: 9999,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            alignItems: 'stretch', userSelect: 'none'
          }}
        >
          {/* Blurred Background Video */}
          <video
            src={videoUrl}
            muted
            playsInline
            autoPlay
            loop
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(20px) brightness(0.55)',
              transform: 'scale(1.1)',
              zIndex: 1,
            }}
          />

          {/* Foreground Video */}
          <video
            ref={fullVideoRef}
            src={videoUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 2,
            }}
            playsInline
            autoPlay
            loop
            muted={!!track} // Muted if separate background music track plays
            onTimeUpdate={handleFullTimeUpdate}
          />

          {/* Vignette bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', zIndex: 3, pointerEvents: 'none' }} />
          {/* Vignette top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)', zIndex: 3, pointerEvents: 'none' }} />

          {/* Overlays */}
          {(timestamp || caption) && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', zIndex: 3, pointerEvents: 'none', textAlign: 'center' }}>
              {timestamp && (
                <span style={{ fontSize: '56px', fontWeight: '900', color: 'rgba(255,255,255,0.94)', letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.7)', fontFamily: 'monospace' }}>
                  {timestamp}
                </span>
              )}
              {caption && (
                <span style={{ fontSize: '20px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: '6px', textShadow: '0 1px 6px rgba(0,0,0,0.7)', lineHeight: '1.4' }}>
                  {caption}
                </span>
              )}
            </div>
          )}

          {/* Play / Pause Tap Trigger */}
          <div
            onClick={handleFullPlayToggle}
            style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {!fullPlaying && (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white' }}>
                <Play size={28} fill="white" strokeWidth={0} />
              </div>
            )}
          </div>

          {/* Top Controls */}
          <div style={{ position: 'relative', zIndex: 5, padding: '16px 16px 8px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '1.5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${fullProgress}%`, background: 'white', transition: 'width 0.1s linear' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FF8FB1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Video size={14} strokeWidth={2.25} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'white', fontSize: '13px', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Nhật ký</p>
                  {timestamp && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.5)', marginTop: '1px' }}>{timestamp}</p>}
                </div>
              </div>
              
              <button
                onClick={closeFullscreen}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: '18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Bottom Music Sticker */}
          <div style={{ position: 'relative', zIndex: 5, paddingBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            {track && <StoryMusicSticker track={track} />}
          </div>
        </div>
      )}
    </>
  );
}
