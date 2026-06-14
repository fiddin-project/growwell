import { useTranslation } from 'react-i18next'
import Spinner from './Spinner'

export function LoadingSpinner({ fullPage = false }) {
  const { t } = useTranslation()
  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div role="status" aria-label={t('loading')}>
          <Spinner size={40} className="text-primary" />
        </div>
      </div>
    )
  }
  return (
    <div role="status" aria-label={t('loading')} style={{ display: 'inline-flex' }}>
      <Spinner size={20} className="text-primary" />
    </div>
  )
}
