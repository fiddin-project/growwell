import { useEffect, useRef, useCallback } from 'react'

export default function useFocusTrap(active) {
  const containerRef = useRef(null)
  const previousFocusRef = useRef(null)

  const getFocusable = useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll(
      'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    ))
  }, [])

  useEffect(() => {
    if (!active || !containerRef.current) return

    previousFocusRef.current = document.activeElement

    const container = containerRef.current
    let focusable = getFocusable()
    let first = focusable[0]
    let last = focusable[focusable.length - 1]

    first?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        container.dispatchEvent(new CustomEvent('trap-escape'))
        return
      }
      if (e.key !== 'Tab') return

      focusable = getFocusable()
      first = focusable[0]
      last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [active, getFocusable])

  return containerRef
}
