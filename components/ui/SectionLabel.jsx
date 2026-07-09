export default function SectionLabel({ icon: Icon, text }) {
  return (
    <div className="ui-section-label">
      {Icon && (
        <span className="ui-section-label__icon">
          <Icon size={14} strokeWidth={2.25} />
        </span>
      )}
      <span className="ui-section-label__text">{text}</span>
    </div>
  );
}
