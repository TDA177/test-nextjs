// components/CalendarModal.jsx
import React, { useState, useEffect } from 'react';
import { toKey, sameDay } from '../utils/helpers';

const VN_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function CalendarModal({ visible, current, activeDates, onPick, onClose }) {
  const [view, setView] = useState(new Date(current.getFullYear(), current.getMonth(), 1));

  useEffect(() => {
    if (visible) {
      setView(new Date(current.getFullYear(), current.getMonth(), 1));
    }
  }, [visible, current]);

  if (!visible) return null;

  const activeSet = new Set(activeDates);
  const monthLabel = `Tháng ${view.getMonth() + 1} • ${view.getFullYear()}`;
  const startWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shiftMonth = (delta) => {
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
  };

  return (
    <div className="modal-center-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ padding: '20px', width: '100%', maxWidth: '360px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Calendar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button 
            onClick={() => shiftMonth(-1)}
            style={{
              width: '36px', height: '36px', borderRadius: '50%', border: 'none',
              background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ←
          </button>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
            {monthLabel}
          </span>
          <button 
            onClick={() => shiftMonth(1)}
            style={{
              width: '36px', height: '36px', borderRadius: '50%', border: 'none',
              background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            →
          </button>
        </div>

        {/* Weekday Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
          {VN_WEEKDAYS.map((w) => (
            <span key={w} style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />;
            
            const cellDate = new Date(view.getFullYear(), view.getMonth(), d);
            const key = toKey(cellDate);
            const isActive = activeSet.has(key);
            const isCurrent = sameDay(cellDate, current);
            const isToday = sameDay(cellDate, new Date());

            return (
              <button
                key={`day-${d}`}
                onClick={() => onPick(cellDate)}
                style={{
                  aspectRatio: '1', border: 'none', background: 'transparent', cursor: 'pointer',
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px', padding: '0', outline: 'none'
                }}
              >
                {isCurrent ? (
                  <div
                    style={{
                      width: '100%', height: '100%', borderRadius: '12px',
                      background: 'var(--primary-gradient)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '14px', boxShadow: '0 2px 8px rgba(255, 143, 177, 0.4)'
                    }}
                  >
                    {d}
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%', height: '100%', borderRadius: '12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: isToday ? '800' : '500',
                      color: isToday ? '#EC4899' : '#334155',
                      backgroundColor: isToday ? '#fff1f4' : 'transparent',
                      border: isToday ? '1px solid #fbcfe8' : 'none'
                    }}
                  >
                    <span>{d}</span>
                    {isActive && (
                      <span 
                        style={{
                          position: 'absolute', bottom: '4px', width: '4px', height: '4px',
                          borderRadius: '50%', background: '#F472B6'
                        }}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Go to Today Button */}
        <button
          onClick={() => onPick(new Date())}
          style={{
            width: '100%', marginTop: '16px', background: '#eff6ff', border: 'none',
            padding: '12px', borderRadius: '14px', color: '#2563eb', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#dbeafe'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#eff6ff'}
        >
          Về hôm nay
        </button>
      </div>
    </div>
  );
}
