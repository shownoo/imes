import { Check } from 'lucide-react'
import type { StylePreviewWire } from 'lib/ui-design-catalog'
import { cn } from 'lib/utils'

type StyleCatalogPreviewProps = {
  preview: StylePreviewWire
  height?: number
  className?: string
}

/** 设计语言 / 色系 / 推荐组合 — 顶栏色条 + 导航条 + 内层容器 wireframe */
export function StyleCatalogPreview({ preview, height = 72, className }: StyleCatalogPreviewProps) {
  const pv = preview
  const stripeH = Math.max(4, height * 0.06)
  const navH = Math.max(14, height * 0.22)

  return (
    <div
      aria-hidden
      className={cn('w-full overflow-hidden shadow-sm', className)}
      style={{
        height,
        borderRadius: 12,
        background: pv.bg,
        border: `1px solid ${pv.border}`,
      }}
    >
      <div style={{ height: stripeH, background: pv.stripe }} />
      <div style={{ height: navH, background: pv.nav, opacity: pv.dark ? 0.95 : 1 }} />
      <div style={{ padding: height * 0.12, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {pv.layered ? (
          <div
            style={{
              flex: 1,
              borderRadius: 8,
              background: `color-mix(in srgb, ${pv.accent} 8%, ${pv.card})`,
              border: `1px solid ${pv.border}`,
              padding: 6,
            }}
          >
            <div
              style={{
                height: '100%',
                minHeight: height * 0.28,
                borderRadius: 6,
                background: pv.card,
                border: `1px solid color-mix(in srgb, ${pv.accent} 35%, ${pv.border})`,
              }}
            />
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: height * 0.28,
              borderRadius: 6,
              background: pv.card,
              border: `1px solid ${pv.border}`,
            }}
          />
        )}
      </div>
    </div>
  )
}

type StyleCatalogCardProps = {
  title: string
  desc: string
  preview: StylePreviewWire
  active?: boolean
  onClick?: () => void
  compact?: boolean
}

export function StyleCatalogCard({ title, desc, preview, active, onClick, compact }: StyleCatalogCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full rounded-2xl border bg-card p-4 text-left transition-all duration-200',
        'hover:border-primary/40 hover:shadow-md',
        active ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border/80',
      )}
    >
      <StyleCatalogPreview preview={preview} height={compact ? 56 : 72} className="mb-3" />
      <div className="flex items-start gap-2">
        {active ? (
          <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
        ) : (
          <span className="mt-0.5 inline-block size-4 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold leading-snug', active ? 'text-primary' : 'text-foreground')}>{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
        </div>
      </div>
    </button>
  )
}
