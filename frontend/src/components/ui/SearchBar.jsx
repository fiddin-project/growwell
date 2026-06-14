import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, onClear, placeholder, children }) {
  const { t } = useTranslation()

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 mb-6 shadow-[0_1px_3px_rgba(0,67,73,0.04),0_4px_12px_rgba(0,67,73,0.03)] border border-[rgba(0,67,73,0.08)]">
      <div className="flex items-center gap-3">
        <div className="w-full md:w-96 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg pl-12 pr-10 py-2.5 text-body-sm font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
            placeholder={placeholder || t('search')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={t('search')}
          />
          {value && onClear && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              onClick={() => onClear('')}
              aria-label={t('clear_search')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
