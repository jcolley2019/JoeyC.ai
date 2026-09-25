import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

interface DialogProps {
  /** Called on Escape. Omit for dialogs that must be completed (no keyboard dismiss). */
  onClose?: () => void
  /** Accessible name; use one of the two. */
  'aria-label'?: string
  'aria-labelledby'?: string
  /** Element focused on open; defaults to the first focusable child, else the dialog itself. */
  initialFocus?: RefObject<HTMLElement | null>
  /**
   * Elements outside the dialog that stay interactive and inside the tab cycle — e.g. a
   * navbar whose toggle button doubles as the close control. Everything else outside the
   * dialog is made `inert` while it is open.
   */
  keepActive?: RefObject<HTMLElement | null>[]
  ref?: RefObject<HTMLDivElement | null>
  id?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * Modal dialog primitive (E5 / L4-20): `role="dialog"` + `aria-modal`, focus moved in on
 * open and returned on close, Tab/Shift+Tab cycle inside, Escape closes, and every element
 * outside the dialog (except `keepActive`) is `inert` — so neither Tab nor a screen reader
 * can reach the page behind it. Renders in place (no portal) so theme scopes such as
 * `.luxe-mode` still apply to the contents.
 */
export function Dialog({
  onClose,
  initialFocus,
  keepActive,
  ref,
  id,
  className,
  style,
  children,
  ...aria
}: DialogProps) {
  const localRef = useRef<HTMLDivElement>(null)
  const containerRef = ref ?? localRef
  const onCloseRef = useRef(onClose)
  // Keep the latest onClose for the Escape handler; synced after commit, before any keypress can read it
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const keep = (keepActive ?? []).map(r => r.current).filter((el): el is HTMLElement => !!el)
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Make everything outside the dialog inert: walk up to <body>, inerting each ancestor's siblings.
    const inerted: Element[] = []
    for (let node: HTMLElement | null = container; node && node !== document.body; node = node.parentElement) {
      const parent: HTMLElement | null = node.parentElement
      if (!parent) break
      const siblings: Element[] = Array.from(parent.children)
      for (const sibling of siblings) {
        if (sibling === node || sibling.tagName === 'SCRIPT') continue
        if (keep.some(k => sibling === k || sibling.contains(k) || k.contains(sibling))) continue
        if (sibling.hasAttribute('inert')) continue
        sibling.setAttribute('inert', '')
        inerted.push(sibling)
      }
    }

    const focusables = () => {
      const roots = [container, ...keep]
      const els = roots.flatMap(r => Array.from(r.querySelectorAll<HTMLElement>(FOCUSABLE)))
        .filter(el => el.offsetParent !== null || el === document.activeElement)
      return els.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    }

    const target = initialFocus?.current ?? container.querySelector<HTMLElement>(FOCUSABLE) ?? container
    target.focus({ preventScroll: true })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCloseRef.current) {
          e.preventDefault()
          e.stopPropagation()
          onCloseRef.current()
        }
        return
      }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (list.length === 0) {
        e.preventDefault()
        container.focus()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null
      const inside = active !== null && list.includes(active)
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (!inside || active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      inerted.forEach(el => el.removeAttribute('inert'))
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
    // keepActive/initialFocus are refs; the dialog's lifetime is the effect's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby']}
      tabIndex={-1}
      className={className}
      style={style}
    >
      {children}
    </div>
  )
}
