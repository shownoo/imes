import { Check } from 'lucide-react'
import { CHETA_VISUAL_VARIANT_OPTIONS } from 'lib/cheta-kpi-institutional'
import type { ChetaVisualVariantId } from 'lib/cheta-kpi-institutional'
import { cn } from 'lib/utils'

/** 界面方案 A–H 选择器（对齐 neoWebSchool CHETA_VISUAL_VARIANT_OPTIONS） */
export function DesignLanguageSelector({
  value,
  onChange,
  className,
}: {
  value: ChetaVisualVariantId
  onChange: (v: ChetaVisualVariantId) => void
  className?: string
}) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {CHETA_VISUAL_VARIANT_OPTIONS.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.description}
            onClick={() => onChange(opt.id)}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-[var(--leader-card-border)] bg-[var(--leader-card-bg)] hover:border-primary/30',
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                {opt.compactLabel}
              </span>
              {active && <Check className="size-4 text-primary" />}
            </div>
            <p className="text-sm font-semibold leading-snug">{opt.label}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{opt.description}</p>
          </button>
        )
      })}
    </div>
  )
}
