import Spinner from './Spinner'

export default function Button({ children, variant = 'primary', size = 'default', className = '', onClick, type = 'button', disabled = false, loading = false, ariaLabel }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    subtle: 'btn-subtle',
    whiteElevation: 'btn-white-elevation',
    graySecondary: 'btn-gray-secondary',
  }
  const sizes = {
    sm: { padding: '8px 14px', fontSize: '14px', minHeight: '36px', minWidth: '36px' },
    default: {},
  }

  const isIconOnly = !children && ariaLabel

  return (
    <button
      type={type}
      className={`${variants[variant] || variants.primary} ${isIconOnly ? 'btn-icon' : ''} ${className}`}
      style={size === 'sm' ? sizes.sm : sizes.default}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}
