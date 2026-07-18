import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaStatus() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !needRefresh) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[100] flex justify-center pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-xl border border-outline-variant/50 bg-white p-4 shadow-xl">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {needRefresh ? <RefreshCw size={20} /> : <WifiOff size={20} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-body-strong">
            {needRefresh ? t('pwa_update_title') : t('pwa_offline_title')}
          </p>
          <p className="mt-1 text-caption">
            {needRefresh ? t('pwa_update_body') : t('pwa_offline_body')}
          </p>
          {needRefresh && (
            <button
              type="button"
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-focus"
              onClick={() => updateServiceWorker(true)}
            >
              <RefreshCw size={16} />
              {t('pwa_update_action')}
            </button>
          )}
        </div>

        {needRefresh && (
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
            onClick={() => setNeedRefresh(false)}
            aria-label={t('pwa_update_dismiss')}
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
