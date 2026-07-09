// components/FeaturedCard.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DEFAULT_GREETINGS = [
  { emoji: '✨', title: 'Chào ngày mới',    sub: 'Một ngày mới lại bắt đầu rồi nè' },
  { emoji: '🌷', title: 'Note hôm nay',      sub: 'Lưu lại từng khoảnh khắc bé xíu nhé' },
  { emoji: '🌷', title: 'Cà phê chưa?',      sub: 'Hít thở sâu, mọi thứ rồi sẽ ổn thôi' },
  { emoji: '🌷', title: 'Sống chậm xíu',     sub: 'Một chút thôi, để cảm nhận hôm nay' },
  { emoji: '✨', title: 'Một ngày đáng yêu', sub: 'Hôm nay có gì vui kể mình nghe' },
];

const LIST_KEY = '@greetings_list';
const PIN_KEY  = '@greeting_pinned_index';

export default function FeaturedCard({ date, entryCount }) {
  const [greetings, setGreetings] = useState(DEFAULT_GREETINGS);
  const [pinnedIndex, setPinnedIndex] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawList = localStorage.getItem(LIST_KEY);
      const rawPin = localStorage.getItem(PIN_KEY);
      if (rawList) {
        try { setGreetings(JSON.parse(rawList)); } catch (_) {}
      }
      if (rawPin !== null && rawPin !== '') {
        setPinnedIndex(Number(rawPin));
      }
    }
  }, []);

  const dayIndex = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 86400000
  ) % greetings.length;

  const activeIndex = pinnedIndex !== null ? pinnedIndex % greetings.length : dayIndex;
  const g = greetings[activeIndex] || greetings[0] || DEFAULT_GREETINGS[0];

  const handleSave = ({ list, pinIndex }) => {
    setGreetings(list);
    setPinnedIndex(pinIndex);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
      localStorage.setItem(PIN_KEY, pinIndex !== null ? String(pinIndex) : '');
    }
    setEditorVisible(false);
  };

  return (
    <>
      <div style={{ padding: '0 20px', marginTop: '12px' }}>
        <div
          onClick={() => setEditorVisible(true)}
          style={{
            borderRadius: '24px',
            padding: '16px',
            background: 'var(--green-gradient)',
            border: '1px solid #A8E0BD',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '44px', userSelect: 'none' }}>{g.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1F7A48', letterSpacing: '-0.3px' }}>
              {g.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(15,23,42,0.7)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {g.sub}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>✏️</span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '9px', letterSpacing: '1.2px', color: 'rgba(31,122,72,0.7)', fontWeight: '700' }}>GHI CHÚ</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#1F7A48', lineHeight: '1' }}>{entryCount}</p>
            </div>
          </div>
        </div>
      </div>

      <GreetingsEditor
        visible={editorVisible}
        greetings={greetings}
        activeIndex={activeIndex}
        onSave={handleSave}
        onClose={() => setEditorVisible(false)}
      />
    </>
  );
}

// ─── GreetingsEditor ──────────────────────────────────────────────────────────
function GreetingsEditor({ visible, greetings, activeIndex, onSave, onClose }) {
  const [list, setList] = useState([]);
  const [pinIndex, setPinIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible) {
      setList(greetings.map((g, i) => ({ ...g, key: `${i}_${Date.now()}` })));
      setPinIndex(activeIndex ?? 0);
    }
  }, [visible, greetings, activeIndex]);

  if (!visible) return null;

  const update = (key, field, value) => {
    setList(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
  };

  const addRow = () => {
    setList(prev => [
      ...prev,
      { emoji: '🌟', title: 'Tiêu đề mới', sub: 'Mô tả của bạn...', key: String(Date.now()) },
    ]);
  };

  const removeRow = (key) => {
    if (list.length <= 1) {
      alert('Giữ ít nhất 1 greeting nhé 🥺');
      return;
    }
    const idx = list.findIndex(i => i.key === key);
    setList(prev => prev.filter(item => item.key !== key));
    if (idx === pinIndex) {
      setPinIndex(0);
    } else if (idx < pinIndex) {
      setPinIndex(pinIndex - 1);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Reset về mặc định? Toàn bộ greeting sẽ về nội dung ban đầu.')) {
      setList(DEFAULT_GREETINGS.map((g, i) => ({
        ...g, key: `${i}_${Date.now()}`,
      })));
      setPinIndex(0);
    }
  };

  const handleSave = () => {
    if (list.some(g => !g.emoji.trim() || !g.title.trim())) {
      alert('Emoji và tiêu đề không được để trống!');
      return;
    }
    onSave({
      list: list.map(({ key, ...rest }) => rest),
      pinIndex: pinIndex,
    });
  };

  const modalContent = (
    <div className="modal-backdrop">
      <div 
        className="modal-sheet" 
        style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-handle" />
        
        {/* Editor Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', color: '#6B7280' }}>
            Huỷ
          </button>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F7A48' }}>Tuỳ chỉnh greeting ✏️</span>
          <button onClick={handleSave} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#1F7A48' }}>
            Lưu
          </button>
        </div>

        {/* Hint row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', fontSize: '12px' }}>
          <span style={{ color: '#9CA3AF' }}>Bấm hàng hoặc ⭐ để ghim · chỉnh nội dung tuỳ ý 🌿</span>
          <button onClick={resetToDefault} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#1F7A48', fontWeight: '700' }}>
            ↺ Mặc định
          </button>
        </div>

        {/* List scroll container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.map((item, index) => {
            const isPinned = pinIndex === index;
            return (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '16px',
                  padding: '10px',
                  border: isPinned ? '2px solid #1F7A48' : '1px solid #A8E0BD',
                  cursor: 'pointer',
                  transition: 'border 0.2s',
                }}
                onClick={() => setPinIndex(index)}
              >
                <span style={{ fontSize: '22px', cursor: 'pointer', userSelect: 'none' }}>
                  {isPinned ? '⭐' : '☆'}
                </span>

                <input
                  type="text"
                  value={item.emoji}
                  onChange={(e) => update(item.key, 'emoji', e.target.value)}
                  maxLength={4}
                  style={{
                    width: '46px',
                    height: '46px',
                    fontSize: '24px',
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #D1FAE5',
                    outline: 'none',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => update(item.key, 'title', e.target.value)}
                    placeholder="Tiêu đề..."
                    maxLength={30}
                    style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1F7A48',
                      backgroundColor: '#fff',
                      borderRadius: '10px',
                      border: '1px solid #D1FAE5',
                      padding: '6px 10px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={item.sub}
                    onChange={(e) => update(item.key, 'sub', e.target.value)}
                    placeholder="Mô tả ngắn..."
                    maxLength={60}
                    style={{
                      fontSize: '12px',
                      color: '#374151',
                      backgroundColor: '#fff',
                      borderRadius: '10px',
                      border: '1px solid #D1FAE5',
                      padding: '6px 10px',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRow(item.key);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '8px',
                  }}
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Row Button */}
        <button
          onClick={addRow}
          style={{
            margin: '16px 20px',
            backgroundColor: '#D8F5E4',
            borderRadius: '16px',
            padding: '14px',
            border: '1px solid #A8E0BD',
            color: '#1F7A48',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#c7f0dc'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#D8F5E4'}
        >
          ＋ Thêm greeting mới
        </button>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
