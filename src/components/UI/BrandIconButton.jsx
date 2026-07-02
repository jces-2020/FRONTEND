import { COLORS } from '../../colors';

/**
 * BrandIconButton - Botón circular con icono estilo Vidriobras
 * 
 * Uso:
 * <BrandIconButton onClick={handleClick} ariaLabel="Usuario">
 *   <IconUser stroke={2.5} size={24} />
 * </BrandIconButton>
 * 
 * Props:
 * - children: Icono de Tabler Icons (required)
 * - onClick: Función al hacer clic
 * - ariaLabel: Texto descriptivo para accesibilidad
 * - size: Tamaño del botón - 'sm' | 'md' | 'lg' (default: 'md')
 * - className: Clases CSS adicionales
 * - disabled: Deshabilitar botón
 */
function BrandIconButton({ 
  children, 
  onClick, 
  ariaLabel, 
  size = 'md',
  tone = 'light',
  className = '',
  disabled = false,
  ...props 
}) {
  const sizeClasses = {
    sm: 'vb-icon-button--sm',
    md: 'vb-icon-button--md',
    lg: 'vb-icon-button--lg'
  };

  const toneClasses = {
    light: 'vb-icon-button--light',
    primary: 'vb-icon-button--primary',
    secondary: 'vb-icon-button--secondary',
    accent: 'vb-icon-button--accent'
  };

  return (
    <button
      className={`vb-icon-button ${sizeClasses[size] || sizeClasses.md} ${toneClasses[tone] || toneClasses.light} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default BrandIconButton;
