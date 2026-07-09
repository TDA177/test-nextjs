// components/MusicPicker.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

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

async function searchTracksFromITunes(query, limit = 25) {
  const url = `/api/itunes/search?term=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || `Search API status ${res.status}`);
  }

  return (json.results || []).map((t) => ({
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName,
    artworkUrl: (t.artworkUrl100 ?? '').replace('100x100bb', '300x300bb'),
    previewUrl: t.previewUrl ?? null,
    duration: t.trackTimeMillis ?? 0,
  }));
}

function fmtDur(ms) {
  if (!ms) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function MusicPicker({ visible, onClose, onSelect }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'lofi'
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  const debounceRef = useRef(null);
  const audioRef = useRef(null);

  // Stop music & reset state on visibility change
  useEffect(() => {
    if (visible) {
      setQuery('');
      setSearchResults([]);
      setError(null);
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

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tracks = await searchTracksFromITunes(q);
      setSearchResults(tracks);
    } catch (err) {
      console.error('iTunes search failed:', err);
      setError('Không tìm được nhạc. Kiểm tra mạng rồi thử lại.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 500);
  };

  const handlePlayToggle = (track) => {
    if (!track.previewUrl) {
      setError('Bài này không có bản nghe thử trên iTunes.');
      return;
    }

    setError(null);

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
        setError('Không phát được bản nghe thử. Thử bài khác hoặc vẫn có thể thêm nhạc.');
      });
  };

  const handleSelect = (track) => {
    stopAudio();
    onSelect(track);
    onClose();
  };

  if (!visible) return null;

  // Filter curated tracks if on lofi tab and query has text
  const lofiList = !query.trim() 
    ? CURATED_TRACKS 
    : CURATED_TRACKS.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.artist.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-sheet" 
        style={{ padding: '0px', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>Chọn nhạc nền</span>
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

        {/* Custom Tab Selector */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', margin: '12px 20px 8px 20px' }}>
          <button
            onClick={() => { setActiveTab('search'); stopAudio(); setQuery(''); }}
            style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px',
              backgroundColor: activeTab === 'search' ? 'white' : 'transparent',
              color: activeTab === 'search' ? '#7c3aed' : '#64748b',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            🔍 Thư viện iTunes (Full)
          </button>
          <button
            onClick={() => { setActiveTab('lofi'); stopAudio(); setQuery(''); }}
            style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px',
              backgroundColor: activeTab === 'lofi' ? 'white' : 'transparent',
              color: activeTab === 'lofi' ? '#7c3aed' : '#64748b',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            ☕ Nhạc Lofi Chill
          </button>
        </div>

        {/* Input search */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '14px', padding: '10px 14px', margin: '8px 20px 12px 20px' }}>
          <span style={{ marginRight: '8px', color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder={activeTab === 'search' ? "Tìm triệu bài hát trên iTunes..." : "Lọc nhạc Lofi gợi ý..."}
            value={query}
            onChange={activeTab === 'search' ? handleQueryChange : (e) => setQuery(e.target.value)}
            style={{
              flex: '1', border: 'none', background: 'transparent', outline: 'none',
              fontSize: '15px', color: '#1e293b', width: '100%'
            }}
            autoFocus
          />
          {query.length > 0 && (
            <button 
              onClick={() => { setQuery(''); setSearchResults([]); }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable list content */}
        <div style={{ flex: '1', overflowY: 'auto', padding: '0 20px 20px 20px', minHeight: '320px' }}>
          
          {/* Load indicator for Search Tab */}
          {activeTab === 'search' && loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px', color: '#94a3b8' }}>
              <div style={{ width: '24px', height: '24px', border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13px' }}>Đang tìm kiếm...</span>
            </div>
          )}

          {/* Error display (search errors + preview errors) */}
          {activeTab === 'search' && !loading && error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#94a3b8', gap: '6px' }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
              <span style={{ fontSize: '13px', textAlign: 'center' }}>{error}</span>
            </div>
          )}

          {/* Idle message on Search Tab */}
          {activeTab === 'search' && !loading && !error && query.trim().length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', color: '#94a3b8', textAlign: 'center' }}>
              <span style={{ fontSize: '44px', marginBottom: '8px' }}>🎧</span>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#475569' }}>Tìm kiếm bài hát yêu thích</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', maxWidth: '280px', lineHeight: '1.4' }}>
                Nhập tên bài hát hoặc nghệ sĩ để tìm kiếm đầy đủ trực tiếp từ kho âm nhạc iTunes.
              </p>
            </div>
          )}

          {/* List display */}
          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(activeTab === 'search' ? searchResults : lofiList).map((track) => {
                const isPlaying = playingId === track.id;
                const canPreview = !!track.previewUrl;
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
                    }}
                  >
                    {/* Cover Art / Play trigger */}
                    <div
                      onClick={() => canPreview && handlePlayToggle(track)}
                      style={{
                        position: 'relative',
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: canPreview ? 'pointer' : 'default',
                        flexShrink: 0,
                        opacity: canPreview ? 1 : 0.55,
                      }}
                    >
                      <img
                        src={track.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '16px',
                        }}
                      >
                        {canPreview ? (isPlaying ? '⏸' : '▶') : '—'}
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
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
                        {track.artist} {track.album ? `• ${track.album}` : ''}
                      </p>
                    </div>

                    {/* Action Select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {track.duration > 0 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {fmtDur(track.duration)}
                        </span>
                      )}
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

          {/* Empty display search results */}
          {activeTab === 'search' && !loading && !error && query.trim().length > 0 && searchResults.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <span style={{ fontSize: '13px' }}>Không thấy kết quả phù hợp trên iTunes</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
