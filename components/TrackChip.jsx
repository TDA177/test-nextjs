// components/TrackChip.jsx
import React from 'react';

export default function TrackChip({ track, onRemove }) {
  if (!track) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#F5F3FF',
        border: '1px solid #DDD6FE',
        borderRadius: '16px',
        padding: '8px 12px',
        marginTop: '8px',
        gap: '10px',
        maxWidth: '100%',
      }}
    >
      {track.artworkUrl ? (
        <img
          src={track.artworkUrl}
          alt={track.title}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#EDE9FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          🎵
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#7C3AED',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '1.2',
          }}
        >
          {track.title}
        </p>
        <p
          style={{
            fontSize: '10px',
            color: '#A78BFA',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '1px',
          }}
        >
          {track.artist}
        </p>
      </div>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#A78BFA',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
