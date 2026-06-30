import { getMovementTypeConfig } from 'lib/movement-types'
import { translate } from 'locales'
import { cn } from 'lib/utils'

type MovementFilterBarProps = {
  value: string
  options: readonly string[]
  onChange: (type: string) => void
  counts?: Record<string, number>
  className?: string
}

export function MovementFilterBar({ value, options, onChange, counts, className }: MovementFilterBarProps) {
  return (
    <div
      className={cn('flex flex-wrap gap-1 rounded-xl border bg-muted/25 p-1', className)}
      style={{ borderColor: 'var(--leader-card-border, hsl(var(--border)))' }}
      role="tablist"
      aria-label={translate('按流水类型筛选')}
    >
      {options.map((id) => {
        const active = value === id
        const config = id === 'all' ? null : getMovementTypeConfig(id)
        const label = id === 'all' ? translate('全部') : config!.label
        const count = counts?.[id]

        return (
          <span key={id}>
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all',
                active
                  ? cn(
                      'bg-background font-medium text-foreground shadow-sm ring-1',
                      config?.filterActiveClass ?? 'ring-primary/20',
                    )
                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
              )}
            >
              {config && (
                <span
                  className={cn('size-1.5 shrink-0 rounded-full', config.dotClass, !active && 'opacity-70')}
                  aria-hidden
                />
              )}
              {label}
              {count != null && count > 0 && (
                <span
                  className={cn(
                    'min-w-[1.125rem] rounded-md px-1 text-[10px] font-semibold tabular-nums',
                    active ? 'bg-muted text-muted-foreground' : 'bg-muted/60 text-muted-foreground/80',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          </span>
        )
      })}
    </div>
  )
}
