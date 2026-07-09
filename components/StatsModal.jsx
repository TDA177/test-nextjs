// components/StatsModal.jsx
import React, { useEffect, useState } from 'react';
import { moodById } from '../constants/moods';
import { getEntries } from '../utils/db';
import { keyToDate } from '../utils/helpers';
import DayReplayModal from './DayReplayModal';

function countVideos(entries) {
  return entries.filter((e) => {
    if (!e.video) return false;
    const uri = typeof e.video === 'string' ? e.video : e.video?.uri;
    return !!uri;
  }).length;
}

function Tile({ label, value, bg, fg }) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: '16px',
        padding: '12px',
        backgroundColor: bg,
        color: fg,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <span style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1.2' }}>{value}</span>
      <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1.2px', marginTop: '2px', opacity: 0.8 }}>
        {label}
      </span>
    </div>
  );
}

export default function StatsModal({ visible, dates, onJump, onClose }) {
  const [stats, setStats] = useState({ total: 0, photos: 0, moods: {} });
  const [recent, setRecent] = useState([]);
  const [replayDays, setReplayDays] = useState([]);
  const [replayDate, setReplayDate] = useState(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    
    (async () => {
      let total = 0;
      let photos = 0;
      const moods = {};
      const recents = [];
      const withVideos = [];
      
      // Load recent 30 dates details for stats
      for (const dKey of dates.slice(0, 30)) {
        const arr = await getEntries(dKey);
        total += arr.length;
        photos += arr.filter((e) => e.photo).length;
        
        arr.forEach((e) => {
          moods[e.mood] = (moods[e.mood] || 0) + 1;
        });
        
        recents.push({
          date: dKey,
          count: arr.length,
          sample: arr[0]?.note?.slice(0, 50) || '',
        });
        
        const videoCount = countVideos(arr);
        if (videoCount > 0) {
          withVideos.push({ date: dKey, videoCount });
        }
      }
      
      if (active) {
        setStats({ total, photos, moods });
        setRecent(recents);
        setReplayDays(withVideos);
      }
    })();

    return () => {
      active = false;
    };
  }, [visible, dates]);

  useEffect(() => {
    if (!visible) setReplayDate(null);
  }, [visible]);

  if (!visible) return null;

  const sortedMoods = Object.entries(stats.moods)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div 
          className="modal-sheet" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-handle" />
          
          <div className="modal-scrollable">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingTop: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Thống kê</span>
              <button 
                onClick={onClose}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            {/* Tiles Grid */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <Tile label="NGÀY" value={dates.length} bg="#DBE9FF" fg="#1864AB" />
              <Tile label="GHI CHÚ" value={stats.total} bg="#FFE4EC" fg="#D6336C" />
              <Tile label="ẢNH" value={stats.photos} bg="#FFF0DB" fg="#B65500" />
            </div>

            {/* Day Replay Section */}
            {replayDays.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  Day Replay
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '-4px', marginBottom: '4px' }}>
                  Ghép video cả ngày kiểu TikTok — chỉ xem trên máy này
                </p>
                {replayDays.slice(0, 10).map((r) => {
                  const dObj = keyToDate(r.date);
                  return (
                    <div
                      key={r.date}
                      onClick={() => setReplayDate(r.date)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
                        borderRadius: '16px', backgroundColor: '#FFF5F8', border: '1px solid #FFE3F1',
                        cursor: 'pointer', transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffeef3'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFF5F8'}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#FFE3F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        🎬
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                          {dObj.getDate()}/{dObj.getMonth() + 1}/{dObj.getFullYear()}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {r.videoCount} clip video
                        </p>
                      </div>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FF8FB1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>
                        ▶
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Frequented Moods Section */}
            {sortedMoods.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Tâm trạng hay gặp
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {sortedMoods.map(([id, n]) => {
                    const m = moodById(id);
                    return (
                      <div
                        key={id}
                        style={{
                          padding: '6px 12px', borderRadius: '999px', backgroundColor: m.bg,
                          color: m.fg, fontWeight: '700', fontSize: '13px'
                        }}
                      >
                        {m.emoji}  {m.label}  ×{n}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Diary Dates Section */}
            {recent.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Gần đây
                </h4>
                {recent.slice(0, 10).map((r) => {
                  const day = r.date.split('-')[2];
                  const month = r.date.split('-')[1];
                  return (
                    <div
                      key={r.date}
                      onClick={() => onJump(keyToDate(r.date))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 6px',
                        borderRadius: '14px', cursor: 'pointer', transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FFE4EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#D6336C', flexShrink: 0 }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', lineHeight: '1' }}>{day}</span>
                        <span style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>/{month}</span>
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={{ fontSize: '14px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.sample || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(không có nội dung)</span>}
                        </p>
                        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          {r.count} ghi chú
                        </p>
                      </div>
                      <span style={{ color: '#cbd5e1', fontSize: '16px' }}>→</span>
                    </div>
                  );
                })}
              </div>
            )}

            {dates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
                Chưa có dữ liệu — bắt đầu ghi nào!
              </div>
            )}
          </div>
        </div>
      </div>

      <DayReplayModal
        visible={!!replayDate}
        dateKey={replayDate}
        onClose={() => setReplayDate(null)}
      />
    </>
  );
}
