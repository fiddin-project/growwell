import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading = false, confirmLabel, confirmVariant = 'danger', icon: Icon = AlertTriangle }) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel || t('delete')}</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
          <Icon size={24} className="text-error" />
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
      </div>
    </Modal>
  )
}
