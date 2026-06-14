import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const isId = i18n.language?.startsWith('id')

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang)
  }

  return (
    <div 
      className="inline-flex items-center p-1 rounded-full shadow-sm"
      style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)' }}
    >
      <div className="pl-2 pr-1" style={{ color: 'var(--color-ink-muted)' }}>
        <Globe size={16} />
      </div>
      <button
        onClick={() => setLanguage('id')}
        aria-pressed={isId}
        className="px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer"
        style={
          isId
            ? { background: 'var(--color-primary)', color: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
            : { background: 'transparent', color: 'var(--color-ink-muted)' }
        }
      >
        ID
      </button>
      <button
        onClick={() => setLanguage('en')}
        aria-pressed={!isId}
        className="px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer"
        style={
          !isId
            ? { background: 'var(--color-primary)', color: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
            : { background: 'transparent', color: 'var(--color-ink-muted)' }
        }
      >
        EN
      </button>
    </div>
  )
}
