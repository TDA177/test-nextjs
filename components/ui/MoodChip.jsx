import MoodIcon from './MoodIcon';

export default function MoodChip({ mood, active, onClick, size = 'md' }) {
  const isSm = size === 'sm';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ui-mood-chip ${active ? 'ui-mood-chip--active' : ''} ${isSm ? 'ui-mood-chip--sm' : ''}`}
      style={{
        backgroundColor: mood.bg,
        color: mood.fg,
        borderColor: active ? mood.dot : 'transparent',
      }}
    >
      <MoodIcon moodId={mood.id} size={isSm ? 13 : 15} color={mood.fg} />
      <span>{mood.label}</span>
    </button>
  );
}
