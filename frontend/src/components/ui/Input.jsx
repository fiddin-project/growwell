export default function Input({ label, id, error, hint, inputMode, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && id && <label htmlFor={id} className="label">{label}</label>}
      <input
        id={id}
        className="input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={id ? (error ? `${id}-error` : hint ? `${id}-hint` : undefined) : undefined}
        inputMode={inputMode}
        {...rest}
      />
      {id && error && <p id={`${id}-error`} className="input-error" role="alert">{error}</p>}
      {id && hint && !error && <p id={`${id}-hint`} className="text-fine-print">{hint}</p>}
    </div>
  )
}
