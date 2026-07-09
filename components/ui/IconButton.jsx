export default function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'ui-icon-btn--sm' : size === 'lg' ? 'ui-icon-btn--lg' : '';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`ui-icon-btn ui-icon-btn--${variant} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} strokeWidth={2} />}
    </button>
  );
}
