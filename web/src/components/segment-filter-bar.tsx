import type { ReactNode } from 'react'
import { translate } from 'locales'
import { cn } from 'lib/utils'

export type SegmentFilterConfig = {
  label: string
  dotClass?: string
  filterActiveClass?: string
  activeBgClass?: string
}

const ALL_ACTIVE = {
  activeBgClass: 'bg-primary/8 dark:bg-primary/15',
  filterActiveClass: 'ring-primary/30',
}

type SegmentFilterBarProps = {
  value: string
  options: readonly string[]
  onChange: (id: string) => void
  counts?: Record<string, number>
  getConfig?: (id: string) => SegmentFilterConfig | null
  ariaLabel: string
  className?: string
}

/** 分段筛选 — 语义色点 + 数量角标，供状态/类型等 Tab 复用 */
export function SegmentFilterBar({
  value,
  options,
  onChange,
  counts,
  getConfig,
  ariaLabel,
  className,
}: SegmentFilterBarProps) {
  return (
    <div
      className={cn('flex min-w-0 flex-1 flex-wrap gap-0.5', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((id) => {
        const active = value === id
        const config = id === 'all' ? null : getConfig?.(id) ?? null
        const label = id === 'all' ? translate('全部') : config?.label ?? id
        const count = counts?.[id]
        const showCount = counts != null
        const activeStyle = id === 'all' ? ALL_ACTIVE : config

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-[6px] px-2.5 text-[12.5px] transition-all',
              active
                ? cn(
                    'font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)] ring-1',
                    activeStyle?.activeBgClass ?? 'bg-background',
                    activeStyle?.filterActiveClass ?? 'ring-primary/25',
                  )
                : 'text-muted-foreground/80 hover:bg-background/50 hover:text-foreground',
            )}
          >
            {config?.dotClass ? (
              <span
                className={cn('size-1.5 shrink-0 rounded-full', config.dotClass, !active && 'opacity-70')}
                aria-hidden
              />
            ) : null}
            <span>{label}</span>
            {showCount ? (
              <span
                className={cn(
                  'min-w-[1.125rem] rounded-full px-1 text-[10px] font-medium tabular-nums leading-none',
                  active
                    ? 'text-foreground'
                    : count && count > 0
                      ? 'text-muted-foreground/80'
                      : 'text-muted-foreground/45',
                )}
              >
                {count ?? 0}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** 筛选条外壳 — 左侧分段筛选 + 右侧附加控件（仓库等），同一容器 */
export function FilterBarRow({
  children,
  trailing,
  className,
}: {
  children: ReactNode
  trailing?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-0 overflow-hidden rounded-lg border border-border/50 bg-muted/30 sm:flex-row sm:items-center',
        className,
      )}
    >
      <div className="min-w-0 flex-1 overflow-x-auto p-0.5">{children}</div>
      {trailing ? (
        <>
          <div className="hidden w-px shrink-0 self-stretch bg-border/40 sm:block" aria-hidden />
          <div className="flex shrink-0 items-center border-t border-border/40 p-0.5 sm:border-t-0 sm:px-2">
            {trailing}
          </div>
        </>
      ) : null}
    </div>
  )
}
