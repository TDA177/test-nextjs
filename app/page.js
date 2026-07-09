// app/page.js
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import BackgroundDecor from '../components/BackgroundDecor';
import CalendarModal from '../components/CalendarModal';
import Composer from '../components/Composer';
import FeaturedCard from '../components/FeaturedCard';
import StatsModal from '../components/StatsModal';
import Timeline from '../components/Timeline';

import { VN_DAYS, fmtFull, sameDay, toKey } from '../utils/helpers';
import { getEntries, setEntriesForDate, listEntryDates, deleteMediaBlob } from '../utils/db';

export default function HomeScreen() {
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [allDates, setAllDates] = useState([]);

  const dateKey = toKey(date);
  const isToday = sameDay(date, new Date());

  // Register PWA service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
          .catch((err) => console.warn('Service Worker registration failed:', err));
      });
    }
  }, []);

  // LOAD ENTRIES
  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      const arr = await getEntries(dateKey);
      if (active) {
        setEntries(arr.sort((a, b) => a.time.localeCompare(b.time)));
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [dateKey]);

  // REFRESH ACTIVE DATES LIST
  const refreshAllDates = useCallback(async () => {
    const ds = await listEntryDates();
    setAllDates(ds);
  }, []);

  useEffect(() => {
    refreshAllDates();
  }, [refreshAllDates]);

  // SAVE
  const persist = async (next) => {
    setEntries(next);
    await setEntriesForDate(dateKey, next);
    refreshAllDates();
  };

  const handleSave = async (entry) => {
    let next;

    if (entry.id && entries.some((e) => e.id === entry.id)) {
      const old = entries.find((e) => e.id === entry.id);
      
      // Clean up orphaned photos if the photo was changed
      if (old?.photo && old.photo !== entry.photo) {
        await deleteMediaBlob(old.photo);
      }
      
      // Clean up orphaned videos if the video was changed/removed
      if (old?.video?.uri && old.video.uri !== entry.video?.uri) {
        await deleteMediaBlob(old.video.uri);
      }

      next = entries.map((e) => (e.id === entry.id ? entry : e));
    } else {
      next = [
        ...entries,
        {
          ...entry,
          id: entry.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        },
      ];
    }

    next.sort((a, b) => a.time.localeCompare(b.time));
    await persist(next);

    setComposerOpen(false);
    setEditing(null);
  };

  const handleDelete = async (entry) => {
    if (entry.photo) {
      await deleteMediaBlob(entry.photo);
    }
    if (entry.video?.uri) {
      await deleteMediaBlob(entry.video.uri);
    }

    const next = entries.filter((e) => e.id !== entry.id);
    await persist(next);
  };

  const shiftDay = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
  };

  return (
    <div className="app-container">
      <BackgroundDecor />

      {/* HEADER SECTION */}
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 20px 12px 20px', position: 'relative', zIndex: 10
        }}
      >
        <button
          onClick={() => shiftDay(-1)}
          className="btn-circle"
          style={{ width: '44px', height: '44px', border: 'none', background: 'rgba(255,255,255,0.7)', fontSize: '18px', color: '#475569' }}
        >
          ◀
        </button>

        <div 
          onClick={() => setCalendarOpen(true)}
          style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
        >
          <h2 style={{ fontSize: '21px', fontWeight: '800', color: '#1E293B' }}>
            {fmtFull(date)}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            {VN_DAYS[date.getDay()]}
            {isToday ? ' • Hôm nay' : ''}
          </p>
        </div>

        <button
          onClick={() => shiftDay(1)}
          className="btn-circle"
          style={{ width: '44px', height: '44px', border: 'none', background: 'rgba(255,255,255,0.7)', fontSize: '18px', color: '#475569' }}
        >
          ▶
        </button>
      </header>

      {/* FEATURED GREETING CARD */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <FeaturedCard
          date={date}
          entryCount={entries.length}
        />
      </div>

      {/* DIARY LIST TIMELINE */}
      <section style={{ padding: '0 20px', marginTop: '20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>📔</span>
          <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#1E293B' }}>
            Nhật ký trong ngày
          </h3>
        </div>

        <div className="glass-card">
          {loading ? (
            <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid #cbd5e1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13px' }}>Đang mở sổ tay...</span>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '44px', marginBottom: '4px' }}>📓</span>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#334155' }}>Chưa có ghi chú nào</h4>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', maxWidth: '260px', lineHeight: '1.4' }}>
                Hãy ghi lại điều gì đó nhỏ xinh trong ngày — một câu nói, một tấm ảnh, một chiếc tâm trạng.
              </p>
              <button
                onClick={() => { setEditing(null); setComposerOpen(true); }}
                className="btn-primary"
                style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '999px', fontSize: '14px' }}
              >
                + Thêm ghi chú đầu tiên
              </button>
            </div>
          ) : (
            <Timeline
              entries={entries}
              onEdit={(e) => { setEditing(e); setComposerOpen(true); }}
              onDelete={handleDelete}
            />
          )}
        </div>
      </section>

      {/* STATS BUTTON */}
      <section style={{ padding: '0 20px', marginTop: '20px', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => setStatsOpen(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: '22px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#FFE3F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            📊
          </div>
          
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h4 style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>Thống kê</h4>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              {allDates.length} ngày đã ghi · chạm để xem
            </p>
          </div>
          
          <span style={{ color: '#cbd5e1', fontSize: '20px' }}>➔</span>
        </button>
      </section>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => { setEditing(null); setComposerOpen(true); }}
        className="btn-circle"
        style={{
          position: 'fixed', bottom: '24px', right: 'calc(50% - 240px + 24px)', // floating aligned within 480px width
          width: '64px', height: '64px', border: 'none', background: 'var(--primary-gradient)',
          color: 'white', fontSize: '32px', boxShadow: '0 8px 24px rgba(255, 143, 177, 0.4)',
          zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span>+</span>
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          ✨
        </div>
      </button>

      {/* MODALS */}
      <Composer
        visible={composerOpen}
        existing={editing}
        onClose={() => { setComposerOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      <CalendarModal
        visible={calendarOpen}
        current={date}
        activeDates={allDates}
        onPick={(d) => { setDate(d); setCalendarOpen(false); }}
        onClose={() => setCalendarOpen(false)}
      />

      <StatsModal
        visible={statsOpen}
        dates={allDates}
        onJump={(d) => { setDate(d); setStatsOpen(false); }}
        onClose={() => setStatsOpen(false)}
      />

      {/* Custom responsive media query spacing in case screen is smaller than 480px */}
      <style>{`
        @media (max-width: 480px) {
          .btn-circle {
            right: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
