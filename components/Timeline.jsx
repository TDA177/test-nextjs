// components/Timeline.jsx
import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { moodById } from '../constants/moods';
import TrackChip from './TrackChip';
import VideoPlayer from './VideoPlayer';
import PhotoPlayer from './PhotoPlayer';
import MoodIcon from './ui/MoodIcon';

function TimelineItem({ entry, isLast, onEdit, onDelete }) {
  const mood = moodById(entry.mood);
  const [confirm, setConfirm] = useState(false);

  return (
    <div style={{ display: 'flex', position: 'relative', marginBottom: isLast ? '0' : '22px' }}>
      <div
        style={{
          width: '50px',
          fontSize: '12px',
          color: '#64748B',
          paddingTop: '6px',
          fontWeight: '700',
          fontFamily: 'monospace',
          flexShrink: 0,
          textAlign: 'left',
        }}
      >
        {entry.time}
      </div>

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
            zIndex: 2,
            boxShadow: 'var(--shadow-sm)',
            userSelect: 'none',
          }}
        >
          <MoodIcon moodId={mood.id} size={15} color={mood.fg} />
        </div>
      </div>

      <div style={{ flex: 1, paddingLeft: '4px', textAlign: 'left', minWidth: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: mood.bg,
            color: mood.fg,
            fontWeight: '700',
            fontSize: '11px',
            marginBottom: '8px',
            userSelect: 'none',
          }}
        >
          <MoodIcon moodId={mood.id} size={12} color={mood.fg} />
          {mood.label}
        </div>

        {entry.note && (
          <p style={{ fontSize: '15px', color: '#1e293b', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {entry.note}
          </p>
        )}

        {entry.photo && (
          <div style={{ marginTop: '10px', borderRadius: '16px', overflow: 'hidden', maxWidth: '260px', border: '1px solid #f1f5f9' }}>
            <PhotoPlayer
              uri={entry.photo}
              timestamp={entry.timePicked ? entry.time : null}
              track={entry.track}
            />
          </div>
        )}

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

        {entry.track && (
          <div style={{ maxWidth: '240px' }}>
            <TrackChip track={entry.track} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', alignItems: 'center' }}>
          <button type="button" className="ui-text-btn" onClick={() => onEdit(entry)}>
            <Pencil size={13} strokeWidth={2} />
            sửa
          </button>

          {!confirm ? (
            <button type="button" className="ui-text-btn" onClick={() => setConfirm(true)}>
              <Trash2 size={13} strokeWidth={2} />
              xoá
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="button" className="ui-text-btn ui-text-btn--danger" onClick={() => { onDelete(entry); setConfirm(false); }}>
                Xoá thật?
              </button>
              <button type="button" className="ui-text-btn" onClick={() => setConfirm(false)}>
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
      <div
        style={{
          position: 'absolute',
          left: '69px',
          top: '16px',
          bottom: '16px',
          width: '2px',
          borderLeft: '2px dashed #FBCFE8',
          zIndex: 1,
          pointerEvents: 'none',
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
