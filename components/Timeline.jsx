// components/Timeline.jsx
import React, { useState } from 'react';
import { moodById } from '../constants/moods';
import TrackChip from './TrackChip';
import VideoPlayer from './VideoPlayer';
import PhotoPlayer from './PhotoPlayer';

function TimelineItem({ entry, isLast, onEdit, onDelete }) {
  const mood = moodById(entry.mood);
  const [confirm, setConfirm] = useState(false);

  return (
    <div style={{ display: 'flex', position: 'relative', marginBottom: isLast ? '0' : '22px' }}>
      {/* Time column */}
      <div
        style={{
          width: '50px',
          fontSize: '12px',
          color: '#64748B',
          paddingTop: '6px',
          fontWeight: '700',
          fontFamily: 'monospace',
          flexShrink: 0,
          textAlign: 'left'
        }}
      >
        {entry.time}
      </div>

      {/* Dot Column */}
      <div style={{ width: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: mood.bg,
            border: `2px solid ${mood.dot}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            zIndex: 2,
            boxShadow: 'var(--shadow-sm)',
            userSelect: 'none'
          }}
        >
          {mood.emoji}
        </div>
      </div>

      {/* Content Column */}
      <div style={{ flex: 1, paddingLeft: '4px', textAlign: 'left', minWidth: 0 }}>
        {/* Mood Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: mood.bg,
            color: mood.fg,
            fontWeight: '700',
            fontSize: '11px',
            marginBottom: '8px',
            userSelect: 'none'
          }}
        >
          {mood.emoji}  {mood.label}
        </div>

        {/* Note Text */}
        {entry.note && (
          <p style={{ fontSize: '15px', color: '#1e293b', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {entry.note}
          </p>
        )}

        {/* Photo Player */}
        {entry.photo && (
          <div style={{ marginTop: '10px', borderRadius: '16px', overflow: 'hidden', maxWidth: '260px', border: '1px solid #f1f5f9' }}>
            <PhotoPlayer
              uri={entry.photo}
              timestamp={entry.timePicked ? entry.time : null}
              track={entry.track}
            />
          </div>
        )}

        {/* Video Player */}
        {entry.video && (
          <div style={{ marginTop: '10px', borderRadius: '16px', overflow: 'hidden', maxWidth: '280px', border: '1px solid #f1f5f9' }}>
            <VideoPlayer
              uri={entry.video.uri ?? entry.video}
              timestamp={entry.video.timestamp}
              caption={entry.video.caption}
              track={entry.track}
            />
          </div>
        )}

        {/* Track Chip */}
        {entry.track && (
          <div style={{ maxWidth: '240px' }}>
            <TrackChip track={entry.track} />
          </div>
        )}

        {/* Actions Button */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', alignItems: 'center' }}>
          <button
            onClick={() => onEdit(entry)}
            style={{
              border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '12px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <span>✏️</span> sửa
          </button>

          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              style={{
                border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <span>🗑️</span> xoá
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => { onDelete(entry); setConfirm(false); }}
                style={{ border: 'none', background: 'transparent', color: '#e11d48', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Xoá thật?
              </button>
              <button
                onClick={() => setConfirm(false)}
                style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
              >
                huỷ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Timeline({ entries, onEdit, onDelete }) {
  return (
    <div style={{ position: 'relative', padding: '6px 0' }}>
      {/* Dashed vertical line */}
      <div
        style={{
          position: 'absolute',
          left: '69px', // aligned with the center of the dots (50px time + 40px/2 dot)
          top: '16px',
          bottom: '16px',
          width: '2px',
          borderLeft: '2px dashed #FBCFE8',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
      {entries.map((e, idx) => (
        <TimelineItem
          key={e.id}
          entry={e}
          isLast={idx === entries.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
