export default function MediaTile({ icon: Icon, label, onClick, accent = 'orange' }) {
  return (
    <button type="button" onClick={onClick} className={`ui-media-tile ui-media-tile--${accent}`}>
      <span className={`ui-media-tile__icon ui-media-tile__icon--${accent}`}>
        {Icon && <Icon size={22} strokeWidth={2} />}
      </span>
      <span className="ui-media-tile__label">{label}</span>
    </button>
  );
}
