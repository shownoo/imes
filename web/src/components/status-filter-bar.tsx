import { getStatusConfig } from 'lib/order-status'
import { translate } from 'locales'
import { SegmentFilterBar, type SegmentFilterConfig } from './segment-filter-bar'

const STATUS_ACTIVE_BG: Record<string, string> = {
  neutral: 'bg-muted/70',
  amber: 'bg-amber-50 dark:bg-amber-950/35',
  blue: 'bg-sky-50 dark:bg-sky-950/35',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/35',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/35',
  teal: 'bg-teal-50 dark:bg-teal-950/35',
  green: 'bg-emerald-50 dark:bg-emerald-950/35',
  red: 'bg-red-50 dark:bg-red-950/35',
}

function statusToSegment(id: string): SegmentFilterConfig | null {
  const config = getStatusConfig(id)
  return {
    label: config.label,
    dotClass: config.dotClass,
    filterActiveClass: config.filterActiveClass,
    activeBgClass: STATUS_ACTIVE_BG[config.tone],
  }
}

type StatusFilterBarProps = {
  value: string
  options: readonly string[]
  onChange: (status: string) => void
  counts?: Record<string, number>
  className?: string
}

/** 状态筛选 — 分段 pill，选中态带语义色 */
export function StatusFilterBar({ value, options, onChange, counts, className }: StatusFilterBarProps) {
  return (
    <SegmentFilterBar
      value={value}
      options={options}
      onChange={onChange}
      counts={counts}
      getConfig={statusToSegment}
      ariaLabel={translate('按状态筛选')}
      className={className}
    />
  )
}
