import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from 'lib/utils'

const TRIGGER_PX = 72
const MAX_PULL_PX = 96

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return document.documentElement
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
}: {
  onRefresh: () => Promise<unknown> | unknown
  children: ReactNode
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pulling = useRef(false)
  const startY = useRef(0)
  const pullRef = useRef(0)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const setPullDistance = (next: number) => {
    pullRef.current = next
    setPull(next)
  }

  const atTop = useCallback(() => {
    const scrollParent = findScrollParent(rootRef.current)
    return (scrollParent?.scrollTop ?? 0) <= 0
  }, [])

  const runRefresh = useCallback(async () => {
    setRefreshing(true)
    setPullDistance(TRIGGER_PX)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing || !atTop()) return
      pulling.current = true
      startY.current = e.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing) return
      const y = e.touches[0]?.clientY ?? 0
      const delta = y - startY.current
      if (delta <= 0) {
        setPullDistance(0)
        return
      }
      if (!atTop()) {
        pulling.current = false
        setPullDistance(0)
        return
      }
      e.preventDefault()
      setPullDistance(Math.min(delta * 0.45, MAX_PULL_PX))
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullRef.current >= TRIGGER_PX) {
        void runRefresh()
      } else {
        setPullDistance(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    el.addEventListener('touchend', onTouchEnd, { capture: true })
    el.addEventListener('touchcancel', onTouchEnd, { capture: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart, { capture: true })
      el.removeEventListener('touchmove', onTouchMove, { capture: true })
      el.removeEventListener('touchend', onTouchEnd, { capture: true })
      el.removeEventListener('touchcancel', onTouchEnd, { capture: true })
    }
  }, [atTop, refreshing, runRefresh])

  const showIndicator = pull > 6 || refreshing
  const triggered = pull >= TRIGGER_PX

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex justify-center"
        style={{
          height: 0,
          opacity: showIndicator ? 1 : 0,
          transform: `translateY(${Math.min(pull, MAX_PULL_PX) - 36}px)`,
          transition: pull === 0 && !refreshing ? 'opacity 0.2s ease, transform 0.2s ease' : undefined,
        }}
        aria-hidden
      >
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm',
            triggered && !refreshing && 'border-primary/30',
          )}
        >
          <Loader2
            className={cn(
              'size-4 text-primary transition-transform',
              refreshing && 'animate-spin',
            )}
            style={!refreshing ? { transform: `rotate(${Math.min(pull / TRIGGER_PX, 1) * 180}deg)` } : undefined}
          />
        </div>
      </div>

      <div
        style={{
          transform: pull > 0 ? `translateY(${pull}px)` : undefined,
          transition: pull === 0 && !refreshing ? 'transform 0.2s ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
