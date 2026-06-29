import { getStatusConfig } from 'lib/order-status'
import { cn } from 'lib/utils'

type StatusBadgeProps = {
  status: string
  className?: string
  /** 紧凑模式，用于表格 */
  compact?: boolean
}

/** 状态标签：圆点 + 语义底色，浅色/深色均可读 */
export function StatusBadge({ status, className, compact }: StatusBadgeProps) {
  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium tabular-nums',
        compact ? 'gap-1.5 px-2 py-0.5 text-[11px]' : 'gap-2 px-2.5 py-0.5 text-xs',
        config.badgeClass,
        className,
      )}
    >
      <span className={cn('shrink-0 rounded-full', compact ? 'size-1.5' : 'size-2', config.dotClass)} aria-hidden />
      {config.label}
    </span>
  )
}
