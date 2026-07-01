import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { styleSwitcherMenuChrome, type StyleSwitcherMenuTheme } from 'lib/theme-customizer-surfaces'

/** 下拉菜单壳层 — 对齐 neoWebSchool StyleSwitcherMenu */
export function StyleSwitcherMenuShell({
  label,
  theme = 'light',
  panelMinWidth = 280,
  children,
  ariaLabel,
}: {
  label: string
  theme?: StyleSwitcherMenuTheme
  panelMinWidth?: number
  children: ReactNode
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; minWidth: number } | null>(
    null,
  )
  const chrome = styleSwitcherMenuChrome(theme)

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setPanelPos(null)
      return
    }
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (!rect) return
      setPanelPos({
        top: rect.bottom + 8,
        left: rect.right,
        minWidth: Math.max(rect.width, panelMinWidth),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, panelMinWidth])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const panel =
    open && panelPos ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label={ariaLabel ?? label}
        style={{
          position: 'fixed',
          top: panelPos.top,
          left: panelPos.left,
          transform: 'translateX(-100%)',
          minWidth: panelPos.minWidth,
          ...chrome.panel,
        }}
      >
        {children}
      </div>
    ) : null

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={chrome.trigger}
      >
        <span>{label}</span>
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  )
}
