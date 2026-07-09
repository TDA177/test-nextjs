import { ChevronRight } from 'lucide-react';

export default function ActionCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
  accent = 'pink',
  showArrow = true,
  className = '',
}) {
  return (
    <button type="button" onClick={onClick} className={`ui-action-card ui-action-card--${accent} ${className}`.trim()}>
      <div className={`ui-action-card__icon ui-action-card__icon--${accent}`}>
        {Icon && <Icon size={22} strokeWidth={2} />}
      </div>
      <div className="ui-action-card__body">
        <p className="ui-action-card__title">{title}</p>
        {subtitle && <p className="ui-action-card__subtitle">{subtitle}</p>}
      </div>
      {showArrow && (
        <ChevronRight size={18} className="ui-action-card__arrow" strokeWidth={2} />
      )}
    </button>
  );
}
