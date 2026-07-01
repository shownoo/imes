import { getMovementTypeConfig } from 'lib/movement-types'
import { translate } from 'locales'
import { SegmentFilterBar, type SegmentFilterConfig } from './segment-filter-bar'

function movementToSegment(id: string): SegmentFilterConfig | null {
  const config = getMovementTypeConfig(id)
  return {
    label: config.label,
    dotClass: config.dotClass,
    filterActiveClass: config.filterActiveClass,
    activeBgClass: 'bg-background',
  }
}

type MovementFilterBarProps = {
  value: string
  options: readonly string[]
  onChange: (type: string) => void
  counts?: Record<string, number>
  className?: string
}

export function MovementFilterBar({ value, options, onChange, counts, className }: MovementFilterBarProps) {
  return (
    <SegmentFilterBar
      value={value}
      options={options}
      onChange={onChange}
      counts={counts}
      getConfig={movementToSegment}
      ariaLabel={translate('按流水类型筛选')}
      className={className}
    />
  )
}
