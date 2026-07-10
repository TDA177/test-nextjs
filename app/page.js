// app/page.js
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight, BookOpen, BarChart3, Plus, Sparkles,
} from 'lucide-react';
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
  const [dbError, setDbError] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [allDates, setAllDates] = useState([]);

  const dateKey = toKey(date);
  const isToday = sameDay(date, new Date());

  // Register PWA service worker (dev unregister, prod register)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV === 'development') {
      // Unregister any existing service workers to prevent reload loops
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
      return;
    }

    // Production registration
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered:', reg.scope))
        .catch((err) => console.warn('Service Worker registration failed:', err));
    });
  }, []);


  // LOAD ENTRIES
  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const arr = await getEntries(dateKey);
        if (active) {
          setEntries(arr.sort((a, b) => a.time.localeCompare(b.time)));
          setDbError(false);
        }
      } catch {
        if (active) {
          setEntries([]);
          setDbError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [dateKey]);

  // REFRESH ACTIVE DATES LIST
  const refreshAllDates = useCallback(async () => {
    try {
      const ds = await listEntryDates();
      setAllDates(ds);
    } catch {
      // silently ignore
    }
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
        <button onClick={() => shiftDay(-1)} className="ui-nav-btn" aria-label="Ngày trước">
          <ChevronLeft size={20} strokeWidth={2.5} />
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

        <button onClick={() => shiftDay(1)} className="ui-nav-btn" aria-label="Ngày sau">
          <ChevronRight size={20} strokeWidth={2.5} />
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
        <div className="ui-section-heading">
          <span className="ui-section-heading__icon">
            <BookOpen size={18} strokeWidth={2.25} />
          </span>
          <h3 className="ui-section-heading__title">Nhật ký trong ngày</h3>
        </div>

        <div className="glass-card">
          {loading ? (
            <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <div className="ui-spinner" />
              <span style={{ fontSize: '13px' }}>Đang mở sổ tay...</span>
            </div>
          ) : dbError ? (
            <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#94a3b8', textAlign: 'center' }}>
              <span style={{ fontSize: '36px' }}>📡</span>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#64748B' }}>Chưa kết nối được máy chủ</h4>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.5' }}>
                Có thể do mạng bị chặn hoặc server chưa sẵn sàng. Dữ liệu sẽ hiển thị khi kết nối lại.
              </p>
              <button
                onClick={() => { setDbError(false); setLoading(true); getEntries(dateKey).then(arr => { setEntries(arr.sort((a, b) => a.time.localeCompare(b.time))); setDbError(false); }).catch(() => setDbError(true)).finally(() => setLoading(false)); }}
                className="btn-primary"
                style={{ marginTop: '8px', padding: '10px 20px', borderRadius: '999px', fontSize: '13px' }}
              >
                🔄 Thử lại
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="ui-empty-state">
              <div className="ui-empty-state__icon">
                <BookOpen size={28} strokeWidth={2} />
              </div>
              <h4 className="ui-empty-state__title">Chưa có ghi chú nào</h4>
              <p className="ui-empty-state__desc">
                Hãy ghi lại điều gì đó nhỏ xinh trong ngày — một câu nói, một tấm ảnh, một chiếc tâm trạng.
              </p>
              <button
                onClick={() => { setEditing(null); setComposerOpen(true); }}
                className="btn-primary"
                style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '999px', fontSize: '14px', gap: '6px' }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Thêm ghi chú đầu tiên
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
        <button type="button" className="ui-stat-card" onClick={() => setStatsOpen(true)}>
          <div className="ui-stat-card__icon">
            <BarChart3 size={20} strokeWidth={2.25} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 className="ui-stat-card__title">Thống kê</h4>
            <p className="ui-stat-card__desc">
              {allDates.length} ngày đã ghi · chạm để xem
            </p>
          </div>
          <ChevronRight size={20} className="ui-stat-card__arrow" strokeWidth={2} />
        </button>
      </section>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        className="ui-fab"
        onClick={() => { setEditing(null); setComposerOpen(true); }}
        aria-label="Thêm ghi chú"
      >
        <Plus size={28} strokeWidth={2.5} />
        <div style={{
          position: 'absolute', top: '-2px', right: '-2px', width: '22px', height: '22px',
          borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', color: '#DB2777',
        }}>
          <Sparkles size={10} strokeWidth={2.5} />
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
    </div>
  );
}
