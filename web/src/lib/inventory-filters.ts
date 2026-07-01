import type { SegmentFilterConfig } from 'components/segment-filter-bar'
import { translate } from 'locales'

export const STOCK_ITEM_STATUS_FILTERS = [
  'all',
  'IN_STOCK',
  'IN_TRANSIT',
  'ISSUED',
  'SCRAPPED',
] as const

export const INVENTORY_STOCK_LEVEL_FILTERS = [
  'all',
  'NORMAL',
  'LOW',
  'HIGH',
  'EMPTY',
] as const

const STOCK_LEVEL_CONFIG: Record<string, SegmentFilterConfig> = {
  NORMAL: {
    label: translate('正常'),
    dotClass: 'bg-emerald-500',
    filterActiveClass: 'ring-emerald-400/35',
    activeBgClass: 'bg-emerald-50 dark:bg-emerald-950/35',
  },
  LOW: {
    label: translate('低库存'),
    dotClass: 'bg-amber-500',
    filterActiveClass: 'ring-amber-400/35',
    activeBgClass: 'bg-amber-50 dark:bg-amber-950/35',
  },
  HIGH: {
    label: translate('高库存'),
    dotClass: 'bg-sky-500',
    filterActiveClass: 'ring-sky-400/35',
    activeBgClass: 'bg-sky-50 dark:bg-sky-950/35',
  },
  EMPTY: {
    label: translate('零库存'),
    dotClass: 'bg-red-500',
    filterActiveClass: 'ring-red-400/35',
    activeBgClass: 'bg-red-50 dark:bg-red-950/35',
  },
}

export function getStockLevelFilterConfig(id: string): SegmentFilterConfig | null {
  const base = STOCK_LEVEL_CONFIG[id]
  if (!base) return null
  return { ...base, label: translate(base.label) }
}
