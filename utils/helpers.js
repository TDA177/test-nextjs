export const VN_DAYS = [
  'Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy',
];

export const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fmtFull = (d) =>
  `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;

export const sameDay = (a, b) => toKey(a) === toKey(b);

export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const parseTime = (str) => {
  if (!str) return new Date();
  const [h, m] = str.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

export const keyToDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
