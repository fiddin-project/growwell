import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ icon: Icon, title, subtitle, backTo, action, gradient = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${gradient ? 'bg-gradient-to-br from-primary-container to-primary -mx-6 -mt-6 px-6 pt-6 pb-7 rounded-b-2xl text-on-primary' : ''}`}>
      <div className="flex items-center gap-4">
        {backTo && (
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${gradient ? 'hover:bg-white/20 text-on-primary' : 'hover:bg-surface-container-high text-on-surface-variant'}`}
            onClick={() => navigate(backTo)}
            aria-label={t('go_back')}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${gradient ? 'bg-white/20' : 'bg-primary/10'}`}>
            <Icon size={28} className={gradient ? 'text-on-primary' : 'text-primary'} />
          </div>
        )}
        <div>
          <h2 className={`font-headline-xl text-headline-xl leading-tight ${gradient ? 'text-on-primary' : 'text-on-surface'}`}>{title}</h2>
          {subtitle && (
            <p className={`font-body-md text-body-md mt-0.5 ${gradient ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
