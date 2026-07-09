// components/PhotoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
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
          <span style={{ fontSize: '12px' }}>🎵</span>
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

export default function PhotoPlayer({ uri, timestamp, caption, track }) {
  const [imageUrl, setImageUrl] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const audioRef = useRef(null);
  const progressTimerRef = useRef(null);
  const duration = track ? 30000 : 7000; // 30s for music, 7s for standard story

  // Resolve IndexedDB photo blob URL
  useEffect(() => {
    let active = true;
    async function loadUrl() {
      if (uri) {
        const url = await getMediaUrl(uri);
        if (active) setImageUrl(url || uri);
      }
    }
    loadUrl();
    return () => {
      active = false;
    };
  }, [uri]);

  // Audio preview controls in fullscreen mode
  useEffect(() => {
    if (fullscreen && track?.previewUrl) {
      const audio = new Audio(track.previewUrl);
      audio.loop = true;
      audioRef.current = audio;
      
      if (isPlaying) {
        audio.play().catch((err) => console.warn('Audio play error:', err));
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [fullscreen, track]);

  // Handle play/pause audio sync
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle progress timer
  useEffect(() => {
    if (!fullscreen) {
      setProgress(0);
      return;
    }

    if (!isPlaying) {
      clearInterval(progressTimerRef.current);
      return;
    }

    const intervalTime = 100; // updates every 100ms
    const step = (intervalTime / duration) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Loop back to start
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      clearInterval(progressTimerRef.current);
    };
  }, [fullscreen, isPlaying, duration]);

  const openFullscreen = () => {
    setIsPlaying(true);
    setProgress(0);
    setFullscreen(true);
  };

  const closeFullscreen = () => {
    setFullscreen(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (!imageUrl) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: '16px' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid #cbd5e1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={openFullscreen}
        style={{
          height: '200px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#111',
          position: 'relative',
          cursor: 'pointer',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      />

      {/* Fullscreen Story Modal */}
      {fullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'black',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            userSelect: 'none',
          }}
        >
          {/* Background image container */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 1,
            }}
          />

          {/* Vignette bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '220px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Vignette top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Title & Caption Overlays */}
          {(timestamp || caption) && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px',
                zIndex: 3,
                pointerEvents: 'none',
                textAlign: 'center',
              }}
            >
              {timestamp && (
                <span
                  style={{
                    fontSize: '56px',
                    fontWeight: '900',
                    color: 'rgba(255,255,255,0.95)',
                    letterSpacing: '2px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                    fontFamily: 'monospace',
                  }}
                >
                  {timestamp}
                </span>
              )}
              {caption && (
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginTop: '6px',
                    textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                    lineHeight: '1.4',
                  }}
                >
                  {caption}
                </span>
              )}
            </div>
          )}

          {/* Interactive Tap Area (Toggle Play/Pause) */}
          <div
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {!isPlaying && (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  color: 'white',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                ▶
              </div>
            )}
          </div>

          {/* Top Story Controls */}
          <div
            style={{
              position: 'relative',
              zIndex: 5,
              padding: '16px 16px 8px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Story Progress Bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '1.5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'white', transition: 'width 0.1s linear' }} />
            </div>

            {/* Story Header Profile */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FF8FB1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  📔
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'white', fontSize: '13px', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Nhật ký</p>
                  {timestamp && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.5)', marginTop: '1px' }}>{timestamp}</p>}
                </div>
              </div>
              
              <button
                onClick={closeFullscreen}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.45)',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
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
