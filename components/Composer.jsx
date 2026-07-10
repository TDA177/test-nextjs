// components/Composer.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Heart, PenLine, Camera, Image, Clapperboard, Music, Video,
} from 'lucide-react';
import { MOODS } from '../constants/moods';
import { pad, parseTime } from '../utils/helpers';
import { saveMediaBlob, deleteMediaBlob, getMediaUrl } from '../utils/db';
import { normalizeImageToJpeg } from '../utils/imageUtils';
import { canUseInAppCamera } from '../utils/cameraSupport';
import MusicPicker from './MusicPicker';
import TrackChip from './TrackChip';
import VideoPlayer from './VideoPlayer';
import VideoRecorder from './VideoRecorder';
import PhotoCapture from './PhotoCapture';
import SectionLabel from './ui/SectionLabel';
import IconButton from './ui/IconButton';
import ActionCard from './ui/ActionCard';
import MediaTile from './ui/MediaTile';
import MoodChip from './ui/MoodChip';
import { X } from 'lucide-react';

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
  const [video, setVideo] = useState(null); // { file, timestamp, caption } or { uri, ... }
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [track, setTrack] = useState(null);

  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const [videoRecorderOpen, setVideoRecorderOpen] = useState(false);
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);
  
  const photoInputRef = useRef(null);
  const nativeCaptureRef = useRef(null);
  const prevPhotoUrlRef = useRef(null);
  const prevVideoUrlRef = useRef(null);
  const modalWasOpenRef = useRef(false);
  const nativePickerActiveRef = useRef(false);
  const suppressBackdropCloseUntilRef = useRef(0);

  // iOS fires ghost clicks on backdrop after returning from native camera
  useEffect(() => {
    const onReturn = () => {
      suppressBackdropCloseUntilRef.current = Date.now() + 2000;
      // Reset picker lock after a delay (onChange may arrive late)
      setTimeout(() => {
        nativePickerActiveRef.current = false;
      }, 3000);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onReturn();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onReturn);
    };
  }, []);

  const handleBackdropClose = () => {
    if (Date.now() < suppressBackdropCloseUntilRef.current) return;
    if (nativePickerActiveRef.current) return;
    if (photoCaptureOpen || videoRecorderOpen || musicPickerOpen) return;
    onClose();
  };

  // Initialize fields only when modal opens (not on every re-render)
  useEffect(() => {
    if (!visible) {
      modalWasOpenRef.current = false;
      return;
    }
    if (modalWasOpenRef.current) return;
    modalWasOpenRef.current = true;

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
      resolveVideoUrl(existing.video);
    } else {
      setVideo(null);
      setVideoPreviewUrl(null);
    }
  }, [visible, existing]);

  // Revoke previous blob URL when photoUrl changes (not current one)
  useEffect(() => {
    const prev = prevPhotoUrlRef.current;
    if (prev && prev !== photoUrl && prev.startsWith('blob:')) {
      URL.revokeObjectURL(prev);
    }
    prevPhotoUrlRef.current = photoUrl;
  }, [photoUrl]);

  // Revoke previous video blob URL when videoPreviewUrl changes
  useEffect(() => {
    const prev = prevVideoUrlRef.current;
    if (prev && prev !== videoPreviewUrl && prev.startsWith('blob:')) {
      URL.revokeObjectURL(prev);
    }
    prevVideoUrlRef.current = videoPreviewUrl;
  }, [videoPreviewUrl]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (prevPhotoUrlRef.current && prevPhotoUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevPhotoUrlRef.current);
      }
      if (prevVideoUrlRef.current && prevVideoUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevVideoUrlRef.current);
      }
    };
  }, []);

  const resolvePhotoUrl = async (val) => {
    if (val instanceof File || val instanceof Blob) {
      const url = URL.createObjectURL(val);
      setPhotoUrl(url);
    } else if (typeof val === 'string') {
      const url = await getMediaUrl(val);
      setPhotoUrl(url || val);
    }
  };

  const resolveVideoUrl = async (val) => {
    const source = val?.file || val?.uri;
    if (source instanceof File || source instanceof Blob) {
      const url = URL.createObjectURL(source);
      setVideoPreviewUrl(url);
    } else if (typeof source === 'string') {
      const url = await getMediaUrl(source);
      setVideoPreviewUrl(url || source);
    }
  };

  const applyVideo = (meta) => {
    const blob = meta.file || meta.blob;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setVideo({
      file: blob,
      timestamp: meta.timestamp || '',
      caption: meta.caption || '',
    });
    setVideoPreviewUrl(url);
  };

  const applyPhoto = (blob) => {
    const url = URL.createObjectURL(blob);
    setPhoto(blob);
    setPhotoUrl(url);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    nativePickerActiveRef.current = false;
    suppressBackdropCloseUntilRef.current = Date.now() + 1500;
    if (!file || file.size === 0) return;

    try {
      const blob = await normalizeImageToJpeg(file);
      applyPhoto(blob);
    } catch (err) {
      console.error('Failed to process photo:', err);
      alert('Không đọc được ảnh. Hãy thử chụp lại hoặc chọn ảnh khác.');
    }
  };

  const handlePhotoCaptured = (blob) => {
    applyPhoto(blob);
  };

  const handleOpenCamera = () => {
    if (canUseInAppCamera()) {
      setPhotoCaptureOpen(true);
    } else {
      nativePickerActiveRef.current = true;
      suppressBackdropCloseUntilRef.current = Date.now() + 5000;
      nativeCaptureRef.current?.click();
    }
  };

  const handleOpenGallery = () => {
    nativePickerActiveRef.current = true;
    suppressBackdropCloseUntilRef.current = Date.now() + 5000;
    photoInputRef.current?.click();
  };

  const handleFallbackPhotoFile = async (file) => {
    try {
      const blob = await normalizeImageToJpeg(file);
      applyPhoto(blob);
    } catch (err) {
      console.error('Failed to process photo:', err);
      alert('Không đọc được ảnh. Hãy thử chọn ảnh khác.');
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoUrl(null);
  };

  const handleRemoveVideo = () => {
    if (window.confirm('Xoá video? Video này sẽ bị xoá khỏi ghi chú.')) {
      setVideo(null);
      setVideoPreviewUrl(null);
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
    <>
    <div className="modal-backdrop" onClick={handleBackdropClose}>
      <div 
        className="modal-sheet" 
        style={{ display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Header */}
        <div className="ui-modal-header">
          <span className="ui-modal-title">
            {existing ? 'Sửa ghi chú' : 'Ghi chú mới'}
          </span>
          <IconButton icon={X} label="Đóng" onClick={onClose} />
        </div>

        {/* Scrollable Container */}
        <div className="modal-scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Time Picker */}
          <SectionLabel icon={Clock} text="Lúc mấy giờ (tuỳ chọn)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="time"
              className="ui-input ui-input--mono"
              style={{ flex: 1 }}
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setTimePicked(true);
              }}
            />
            {timePicked && (
              <IconButton
                icon={X}
                label="Xóa giờ"
                size="sm"
                onClick={() => { setTime(defaultTime); setTimePicked(false); }}
              />
            )}
          </div>

          {/* Mood Selection */}
          <SectionLabel icon={Heart} text="Tâm trạng" />
          <div 
            style={{
              display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
              flexShrink: 0, minHeight: '44px'
            }}
          >
            {MOODS.map((m) => (
              <MoodChip
                key={m.id}
                mood={m}
                active={m.id === moodId}
                onClick={() => setMoodId(m.id)}
              />
            ))}
          </div>

          {/* Text Note Area */}
          <SectionLabel icon={PenLine} text="Ghi gì hôm nay" />
          <textarea
            className="ui-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hôm nay mình..."
            autoFocus
            style={{ minHeight: '100px', resize: 'vertical', lineHeight: '1.5' }}
          />

          {/* Photo Selection */}
          <SectionLabel icon={Camera} text="Ảnh (tuỳ chọn)" />
          {photoUrl ? (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#f1f5f9', minHeight: '220px' }}>
              <img
                src={photoUrl}
                alt="Ảnh đã chọn"
                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                onError={() => {
                  console.error('Preview failed for:', photoUrl);
                  setPhotoUrl(null);
                  setPhoto(null);
                }}
              />
              <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                <IconButton
                  icon={X}
                  label="Xóa ảnh"
                  variant="overlay"
                  size="sm"
                  onClick={handleRemovePhoto}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <MediaTile icon={Camera} label="Chụp ảnh" accent="orange" onClick={handleOpenCamera} />
              <MediaTile icon={Image} label="Thư viện" accent="blue" onClick={handleOpenGallery} />
              {/* Gallery picker input */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              {/* Native camera fallback for HTTP / no webcam */}
              <input
                ref={nativeCaptureRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Video Selection */}
          <SectionLabel icon={Clapperboard} text="Video (tuỳ chọn)" />
          {video && videoPreviewUrl ? (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', minHeight: '200px' }}>
              <VideoPlayer
                uri={videoPreviewUrl}
                timestamp={video.timestamp}
                caption={video.caption}
                track={track}
                onRemove={handleRemoveVideo}
              />
            </div>
          ) : video ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div className="ui-spinner" />
            </div>
          ) : (
            <ActionCard
              icon={Video}
              title="Quay video"
              subtitle="Có timestamp + caption"
              accent="pink"
              onClick={() => setVideoRecorderOpen(true)}
            />
          )}

          {/* Music Selection */}
          <SectionLabel icon={Music} text="Nhạc đang nghe (tuỳ chọn)" />
          {track ? (
            <TrackChip track={track} onRemove={() => setTrack(null)} />
          ) : (
            <ActionCard
              icon={Music}
              title="Tìm và thêm bài hát"
              accent="purple"
              onClick={() => setMusicPickerOpen(true)}
            />
          )}

          {/* Save / Cancel Action Row */}
          <div className="ui-btn-row">
            <button type="button" className="ui-btn-secondary" onClick={onClose}>
              Huỷ
            </button>
            <button
              type="button"
              className="ui-btn-primary"
              onClick={handleSave}
              disabled={!canSave}
            >
              {existing ? 'Cập nhật' : 'Lưu vào sổ'}
            </button>
          </div>

        </div>
      </div>
    </div>

      {/* Overlays rendered outside backdrop to avoid iOS ghost-click closing modal */}
      <MusicPicker
        visible={musicPickerOpen}
        onClose={() => setMusicPickerOpen(false)}
        onSelect={(t) => setTrack(t)}
      />

      <VideoRecorder
        visible={videoRecorderOpen}
        onClose={() => setVideoRecorderOpen(false)}
        onVideoSaved={(meta) => {
          suppressBackdropCloseUntilRef.current = Date.now() + 3000;
          applyVideo(meta);
        }}
      />

      <PhotoCapture
        visible={photoCaptureOpen}
        onClose={() => setPhotoCaptureOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        onFallbackToGallery={handleFallbackPhotoFile}
      />
    </>
  );
}
