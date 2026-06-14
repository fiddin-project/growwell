const variants = {
  Normal: 'badge-normal',
  Borderline: 'badge-borderline',
  Abnormal: 'badge-abnormal',
}

export default function Badge({ children, variant = 'Normal', className = '' }) {
  return <span className={`${variants[variant] || variants.Normal} ${className}`.trim()} role="status">{children}</span>
}
