export default function StatCard({ icon: Icon, value, label, className = '' }) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <div>
        <p className="stat-card-value">{value}</p>
        <p className="stat-card-label">{label}</p>
      </div>
      {Icon && (
        <div className="text-primary">
          <Icon size={24} aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
