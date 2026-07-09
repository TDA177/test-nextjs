// components/Composer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MOODS } from '../constants/moods';
import { pad, parseTime } from '../utils/helpers';
import { saveMediaBlob, deleteMediaBlob, getMediaUrl } from '../utils/db';
import MusicPicker from './MusicPicker';
import TrackChip from './TrackChip';
import VideoPlayer from './VideoPlayer';
import VideoRecorder from './VideoRecorder';

function Label({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px' }}>{icon}</span>
      <span 
        style={{
          fontSize: '11px', fontWeight: '700', color: '#64748B',
          textTransform: 'uppercase', letterSpacing: '1.2px'
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function Composer({ visible, existing, onClose, onSave }) {
  const now = new Date();
  const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [time, setTime] = useState(defaultTime);
  const [timePicked, setTimePicked] = useState(false);
  const [moodId, setMoodId] = useState('yeu');
  const [note, setNote] = useState('');
  
  // media file states (can be string ID or File object)
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [video, setVideo] = useState(null); // { fileOrUri, timestamp, caption }
  const [track, setTrack] = useState(null);

  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const [videoRecorderOpen, setVideoRecorderOpen] = useState(false);
  
  const photoInputRef = useRef(null);

  // Reset fields when modal is opened
  useEffect(() => {
    if (visible) {
      const initialTime = existing?.time || `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
      setTime(initialTime);
      setTimePicked(existing?.timePicked || false);
      setMoodId(existing?.mood || 'yeu');
      setNote(existing?.note || '');
      setTrack(existing?.track || null);
      
      if (existing?.photo) {
        setPhoto(existing.photo);
        resolvePhotoUrl(existing.photo);
      } else {
        setPhoto(null);
        setPhotoUrl(null);
      }

      if (existing?.video) {
        setVideo(existing.video);
      } else {
        setVideo(null);
      }
    }
  }, [visible, existing]);

  // Clean up object URLs on unmount/close
  useEffect(() => {
    return () => {
      if (photoUrl && photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  const resolvePhotoUrl = async (val) => {
    if (val instanceof File || val instanceof Blob) {
      const url = URL.createObjectURL(val);
      setPhotoUrl(url);
    } else if (typeof val === 'string') {
      const url = await getMediaUrl(val);
      setPhotoUrl(url || val);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      resolvePhotoUrl(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoUrl(null);
  };

  const handleRemoveVideo = () => {
    if (window.confirm('Xoá video? Video này sẽ bị xoá khỏi ghi chú.')) {
      setVideo(null);
    }
  };

  const handleSave = async () => {
    if (!note.trim()) return;

    let finalPhotoId = existing?.photo || null;
    let finalVideoUri = existing?.video?.uri || null;

    // 1. Process Photo save
    if (photo instanceof File || photo instanceof Blob) {
      // If there was an old photo, clean it up
      if (existing?.photo) {
        await deleteMediaBlob(existing.photo);
      }
      finalPhotoId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await saveMediaBlob(finalPhotoId, photo);
    } else if (photo === null && existing?.photo) {
      await deleteMediaBlob(existing.photo);
      finalPhotoId = null;
    }

    // 2. Process Video save
    if (video) {
      const fileOrUri = video.file || video.uri;
      if (fileOrUri instanceof File || fileOrUri instanceof Blob) {
        // Clean up old video if exists
        if (existing?.video?.uri) {
          await deleteMediaBlob(existing.video.uri);
        }
        finalVideoUri = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await saveMediaBlob(finalVideoUri, fileOrUri);
      }
    } else if (video === null && existing?.video?.uri) {
      await deleteMediaBlob(existing.video.uri);
      finalVideoUri = null;
    }

    // 3. Save entry
    onSave({
      id: existing?.id,
      time,
      timePicked,
      mood: moodId,
      note: note.trim(),
      photo: finalPhotoId,
      video: video ? {
        uri: finalVideoUri,
        timestamp: video.timestamp,
        caption: video.caption
      } : null,
      track: track || null,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
  };

  if (!visible) return null;

  const canSave = note.trim().length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-sheet" 
        style={{ display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
            {existing ? 'Sửa ghi chú' : 'Ghi chú mới'}
          </span>
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

        {/* Scrollable Container */}
        <div className="modal-scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Time Picker */}
          <Label icon="🕒" text="Lúc mấy giờ (tuỳ chọn)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setTimePicked(true);
              }}
              style={{
                flex: 1, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '16px', padding: '12px 16px', fontSize: '16px', color: '#1e293b',
                outline: 'none', fontFamily: 'monospace'
              }}
            />
            {timePicked && (
              <button
                onClick={() => { setTime(defaultTime); setTimePicked(false); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#cbd5e1', fontSize: '20px' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Mood Selection */}
          <Label icon="❤️" text="Tâm trạng" />
          <div 
            style={{
              display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
              flexShrink: 0, minHeight: '44px'
            }}
          >
            {MOODS.map((m) => {
              const active = m.id === moodId;
              return (
                <button
                  key={m.id}
                  onClick={() => setMoodId(m.id)}
                  style={{
                    padding: '8px 14px', borderRadius: '999px', border: active ? `2px solid ${m.dot}` : '2px solid transparent',
                    backgroundColor: m.bg, color: m.fg, fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                    whiteSpace: 'nowrap', transition: 'all 0.15s ease', outline: 'none'
                  }}
                >
                  {m.emoji}  {m.label}
                </button>
              );
            })}
          </div>

          {/* Text Note Area */}
          <Label icon="✍️" text="Ghi gì hôm nay" />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hôm nay mình..."
            autoFocus
            style={{
              width: '100%', minHeight: '100px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: '16px', padding: '14px 16px', fontSize: '16px', color: '#1e293b',
              outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5'
            }}
          />

          {/* Photo Selection */}
          <Label icon="📸" text="Ảnh (tuỳ chọn)" />
          {photoUrl ? (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <img src={photoUrl} alt="" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
              <button
                onClick={handleRemovePhoto}
                style={{
                  position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => photoInputRef.current?.click()}
                style={{
                  flex: 1, height: '80px', borderRadius: '16px', border: '2px dashed #BFDBFE',
                  backgroundColor: '#EFF6FF', color: '#3B82F6', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '700', gap: '4px'
                }}
              >
                <span style={{ fontSize: '24px' }}>🖼️</span>
                Thêm ảnh
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Video Selection */}
          <Label icon="🎬" text="Video (tuỳ chọn)" />
          {video ? (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <VideoPlayer
                uri={video.file || video.uri}
                timestamp={video.timestamp}
                caption={video.caption}
                track={track}
                onRemove={handleRemoveVideo}
              />
            </div>
          ) : (
            <button
              onClick={() => setVideoRecorderOpen(true)}
              style={{
                width: '100%', borderRadius: '16px', border: '1px solid #FBCFE8', background: 'linear-gradient(135deg, #FFF1F4 0%, #FFF7F0 100%)',
                padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FFE3F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                🎥
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Quay video</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Có timestamp + caption</p>
              </div>
              <span style={{ color: '#FBCFE8', fontSize: '16px' }}>➔</span>
            </button>
          )}

          {/* Music Selection */}
          <Label icon="🎵" text="Nhạc đang nghe (tuỳ chọn)" />
          {track ? (
            <TrackChip track={track} onRemove={() => setTrack(null)} />
          ) : (
            <button
              onClick={() => setMusicPickerOpen(true)}
              style={{
                width: '100%', borderRadius: '16px', border: '1px solid #DDD6FE', background: 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)',
                padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                🎧
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#7c3aed' }}>Tìm và thêm bài hát</span>
            </button>
          )}

          {/* Save / Cancel Action Row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '14px 0', borderRadius: '16px', border: 'none',
                backgroundColor: '#F1F5F9', color: '#475569', fontWeight: '700', fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                flex: 2, padding: '14px 0', borderRadius: '16px', border: 'none',
                background: 'var(--primary-gradient)', color: 'white', fontWeight: '800', fontSize: '15px',
                cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5,
                boxShadow: canSave ? '0 4px 12px rgba(255, 143, 177, 0.3)' : 'none'
              }}
            >
              {existing ? 'Cập nhật' : 'Lưu vào sổ'}
            </button>
          </div>

        </div>
      </div>

      {/* Music Picker Modal */}
      <MusicPicker
        visible={musicPickerOpen}
        onClose={() => setMusicPickerOpen(false)}
        onSelect={(t) => setTrack(t)}
      />

      {/* Video Recorder / Upload Modal */}
      <VideoRecorder
        visible={videoRecorderOpen}
        onClose={() => setVideoRecorderOpen(false)}
        onVideoSaved={(meta) => setVideo(meta)} // meta = { file (Blob), timestamp, caption }
      />
    </div>
  );
}
