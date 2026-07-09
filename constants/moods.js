// constants/moods.js
export const MOODS = [
  { id: 'yeu',     label: 'Yêu',      emoji: '🥰', bg: '#FFE4EC', fg: '#D6336C', dot: '#F783AC' },
  { id: 'vui',     label: 'Vui',      emoji: '😄', bg: '#FFF3BF', fg: '#B07000', dot: '#FFD43B' },
  { id: 'binhyen', label: 'Bình yên', emoji: '🌸', bg: '#FFE0E9', fg: '#C2255C', dot: '#FAA2C1' },
  { id: 'mongmo',  label: 'Mộng mơ',  emoji: '☁️', bg: '#DBE9FF', fg: '#1864AB', dot: '#74C0FC' },
  { id: 'met',     label: 'Mệt',      emoji: '😮‍💨', bg: '#E5DBFF', fg: '#5F3DC4', dot: '#B197FC' },
  { id: 'buon',    label: 'Buồn',     emoji: '🥺', bg: '#D0EBFF', fg: '#1971C2', dot: '#74C0FC' },
  { id: 'tuc',     label: 'Tức',      emoji: '😤', bg: '#FFE3E3', fg: '#C92A2A', dot: '#FF8787' },
  { id: 'wow',     label: 'Bất ngờ',  emoji: '✨', bg: '#FFF0DB', fg: '#B65500', dot: '#FFB366' },
  { id: 'an',      label: 'Ăn ngon',  emoji: '🍱', bg: '#FFE8CC', fg: '#A14D00', dot: '#FFA94D' },
  { id: 'caphe',   label: 'Cà phê',   emoji: '☕', bg: '#F1E4D3', fg: '#7B4B1A', dot: '#C49A6C' },
  { id: 'lam',     label: 'Làm việc', emoji: '💻', bg: '#D3F9D8', fg: '#2B8A3E', dot: '#69DB7C' },
  { id: 'choi',    label: 'Đi chơi',  emoji: '🎈', bg: '#FFDEEB', fg: '#A61E4D', dot: '#F783AC' },
];

export const moodById = (id) => MOODS.find(m => m.id === id) || MOODS[0];
