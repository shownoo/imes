import { getMovementTypeConfig } from 'lib/movement-types'
import { cn } from 'lib/utils'

export function MovementTypeBadge({ type, className }: { type: string; className?: string }) {
  const config = getMovementTypeConfig(type)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        config.badgeClass,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dotClass)} aria-hidden />
      {config.label}
    </span>
  )
}
