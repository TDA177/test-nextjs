// components/MusicPicker.jsx
import React, { useState, useEffect, useRef } from 'react';

const CURATED_TRACKS = [
  {
    id: 'lofi_1',
    title: 'Sunset Dreams',
    artist: 'Kasger',
    album: 'Lofi Chill Vol. 1',
    artworkUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392f?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/1.mp3',
    duration: 180000,
  },
  {
    id: 'lofi_2',
    title: 'Rainy Night In Tokyo',
    artist: 'Chillhop Master',
    album: 'Midnight Tokyo',
    artworkUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/2.mp3',
    duration: 210000,
  },
  {
    id: 'lofi_3',
    title: 'Cozy Fireplace',
    artist: 'Lofi Producer',
    album: 'Winter Lofi Cozy',
    artworkUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/3.mp3',
    duration: 195000,
  },
  {
    id: 'lofi_4',
    title: 'Summer Clouds',
    artist: 'Itro & Tobu',
    album: 'Skyline Beats',
    artworkUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/4.mp3',
    duration: 204000,
  },
  {
    id: 'lofi_5',
    title: 'Morning Coffee Shop',
    artist: 'Cozy Jazz Duo',
    album: 'Caffeine & Lofi',
    artworkUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/5.mp3',
    duration: 220000,
  },
  {
    id: 'lofi_6',
    title: 'Study Session',
    artist: 'Lofi Chill Beats',
    album: 'Deep Focus Beats',
    artworkUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/6.mp3',
    duration: 185000,
  },
  {
    id: 'lofi_7',
    title: 'Warm Hug',
    artist: 'Acoustic Guitar Lofi',
    album: 'Sweet Acoustic Days',
    artworkUrl: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/7.mp3',
    duration: 190000,
  },
  {
    id: 'lofi_8',
    title: 'Bedtime Stories',
    artist: 'Lullaby Lofi Beats',
    album: 'Sweet Lullaby Chill',
    artworkUrl: 'https://images.unsplash.com/photo-1511295742364-5a63901b0a88?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/8.mp3',
    duration: 175000,
  },
  {
    id: 'lofi_9',
    title: 'Spring Blossom',
    artist: 'Piano & Lofi Chill',
    album: 'Spring Piano Notes',
    artworkUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=300&h=300&fit=crop',
    previewUrl: 'https://raw.githubusercontent.com/muhammederdem/mini-player/master/mp3/9.mp3',
    duration: 198000,
  }
];

function fmtDur(ms) {
  if (!ms) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function MusicPicker({ visible, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(CURATED_TRACKS);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  // Stop music & reset when modal is closed or opened
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults(CURATED_TRACKS);
      setPlayingId(null);
    } else {
      stopAudio();
    }
    return () => {
      stopAudio();
    };
  }, [visible]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
  };

  const handleSearch = (val) => {
    setQuery(val);
    if (!val.trim()) {
      setResults(CURATED_TRACKS);
      return;
    }
    const q = val.toLowerCase();
    const filtered = CURATED_TRACKS.filter(t => 
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
    setResults(filtered);
  };

  const handlePlayToggle = (track) => {
    if (!track.previewUrl) return;

    if (playingId === track.id) {
      stopAudio();
      return;
    }

    stopAudio();

    const audio = new Audio(track.previewUrl);
    audio.play()
      .then(() => {
        audioRef.current = audio;
        setPlayingId(track.id);
        
        audio.onended = () => {
          setPlayingId(null);
          audioRef.current = null;
        };
      })
      .catch((err) => {
        console.warn('Failed to play audio preview:', err);
      });
  };

  const handleSelect = (track) => {
    stopAudio();
    onSelect(track);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-sheet" 
        style={{ padding: '0px', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎵</span>
            <span style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>Chọn nhạc nền</span>
            <span style={{ fontSize: '11px', color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>Lofi Chill</span>
          </div>
          <button 
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%', border: 'none',
              background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 'bold', color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Guide / Legend */}
        <div style={{ display: 'flex', gap: '14px', background: '#EDE9FE', borderRadius: '12px', padding: '10px 14px', margin: '12px 20px 8px 20px', fontSize: '12px', color: '#5B21B6', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>▶</span> Nghe thử
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>➕</span> Chọn bài hát
          </div>
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '14px', padding: '10px 14px', margin: '8px 20px 12px 20px' }}>
          <span style={{ marginRight: '8px', color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm bài hát, nghệ sĩ..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              flex: '1', border: 'none', background: 'transparent', outline: 'none',
              fontSize: '15px', color: '#1e293b', width: '100%'
            }}
            autoFocus
          />
          {query.length > 0 && (
            <button 
              onClick={() => handleSearch('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results List */}
        <div style={{ flex: '1', overflowY: 'auto', padding: '0 20px 20px 20px', minHeight: '300px' }}>
          {results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#94a3b8', gap: '6px' }}>
              <span style={{ fontSize: '32px' }}>🎵</span>
              <span style={{ fontSize: '13px', textAlign: 'center' }}>Không tìm thấy bài hát nào</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((track) => {
                const isPlaying = playingId === track.id;
                return (
                  <div
                    key={track.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      border: '1px solid #f1f5f9',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Artwork / Play Button */}
                    <div
                      onClick={() => handlePlayToggle(track)}
                      style={{
                        position: 'relative',
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={track.artworkUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '16px',
                        }}
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: '800',
                          color: '#1e293b',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {track.title}
                      </h4>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          margin: '2px 0 0 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {track.artist} • {track.album}
                      </p>
                    </div>

                    {/* Action Select Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {fmtDur(track.duration)}
                      </span>
                      <button
                        onClick={() => handleSelect(track)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: '#7c3aed',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                          transition: 'transform 0.1s ease',
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ➕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
