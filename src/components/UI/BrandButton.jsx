import { BUTTON_VARIANTS } from '../../colors';

const variantClasses = {
  primary: 'vb-button--primary',
  secondary: 'vb-button--secondary',
  accent: 'vb-button--accent',
  outline: 'vb-button--ghost',
  danger: 'vb-button--primary',
  ghost: 'vb-button--ghost',
};

const sizeClasses = {
  sm: 'vb-button--sm',
  md: 'vb-button--md',
  lg: 'vb-button--lg',
};

function BrandButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style = {},
  type = 'button',
  disabled = false,
  ...props
}) {
  const variantStyle = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`vb-button ${sizeClass} ${variantClass} ${className}`}
      style={{
        ...variantStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default BrandButton;
