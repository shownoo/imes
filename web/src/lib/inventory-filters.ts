import type { SegmentFilterConfig } from 'components/segment-filter-bar'

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
    label: '正常',
    dotClass: 'bg-emerald-500',
    filterActiveClass: 'ring-emerald-400/35',
    activeBgClass: 'bg-emerald-50 dark:bg-emerald-950/35',
  },
  LOW: {
    label: '低库存',
    dotClass: 'bg-amber-500',
    filterActiveClass: 'ring-amber-400/35',
    activeBgClass: 'bg-amber-50 dark:bg-amber-950/35',
  },
  HIGH: {
    label: '高库存',
    dotClass: 'bg-sky-500',
    filterActiveClass: 'ring-sky-400/35',
    activeBgClass: 'bg-sky-50 dark:bg-sky-950/35',
  },
  EMPTY: {
    label: '零库存',
    dotClass: 'bg-red-500',
    filterActiveClass: 'ring-red-400/35',
    activeBgClass: 'bg-red-50 dark:bg-red-950/35',
  },
}

export function getStockLevelFilterConfig(id: string): SegmentFilterConfig | null {
  return STOCK_LEVEL_CONFIG[id] ?? null
}
