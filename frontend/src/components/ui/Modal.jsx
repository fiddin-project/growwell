import { useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import useFocusTrap from '../../hooks/useFocusTrap'

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  const { t } = useTranslation()
  const titleId = useId()
  const trapRef = useFocusTrap(open)

  useEffect(() => {
    if (!open || !trapRef.current) return
    const container = trapRef.current
    const handleEscape = () => onClose()
    container.addEventListener('trap-escape', handleEscape)
    return () => container.removeEventListener('trap-escape', handleEscape)
  }, [open, onClose, trapRef])

  useEffect(() => {
    if (open) {
      const count = parseInt(document.body.dataset.modalCount || '0', 10)
      document.body.dataset.modalCount = String(count + 1)
      if (count === 0) {
        document.body.style.overflow = 'hidden'
      }
    } else {
      const count = parseInt(document.body.dataset.modalCount || '0', 10)
      const next = Math.max(0, count - 1)
      document.body.dataset.modalCount = String(next)
      if (next === 0) {
        document.body.style.overflow = ''
      }
    }
    return () => {
      const count = parseInt(document.body.dataset.modalCount || '0', 10)
      const next = Math.max(0, count - 1)
      document.body.dataset.modalCount = String(next)
      if (next === 0) {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-sm sm:w-[384px]', md: 'max-w-lg sm:w-[512px]', lg: 'max-w-2xl sm:w-[672px]', xl: 'max-w-4xl sm:w-[896px]' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ width: '100%' }}
        className={`relative bg-surface-container-lowest rounded-xl shadow-[0_8px_32px_rgba(0,67,73,0.12),0_2px_8px_rgba(0,67,73,0.06)] border border-[rgba(0,67,73,0.08)] flex flex-col max-h-[90vh] ${sizes[size] || sizes.md}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h2 id={titleId} className="font-headline-md text-headline-md text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label={t('close')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
