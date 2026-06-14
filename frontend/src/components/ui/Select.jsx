export default function Select({ label, id, error, className = '', children, ...rest }) {
  return (
    <div className={className}>
      {label && id && <label htmlFor={id} className="label">{label}</label>}
      <select
        id={id}
        className="select"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={id && error ? `${id}-error` : undefined}
        {...rest}
      >
        {children}
      </select>
      {id && error && <p id={`${id}-error`} className="input-error" role="alert">{error}</p>}
    </div>
  )
}
