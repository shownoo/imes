import { translate } from 'locales'
import { getStockLevelFilterConfig, INVENTORY_STOCK_LEVEL_FILTERS } from 'lib/inventory-filters'
import { SegmentFilterBar } from './segment-filter-bar'

type InventoryStockLevelFilterProps = {
  value: string
  onChange: (level: string) => void
  counts?: Record<string, number>
  className?: string
}

/** 库存汇总 — 按水位筛选 */
export function InventoryStockLevelFilter({
  value,
  onChange,
  counts,
  className,
}: InventoryStockLevelFilterProps) {
  return (
    <SegmentFilterBar
      value={value}
      options={INVENTORY_STOCK_LEVEL_FILTERS}
      onChange={onChange}
      counts={counts}
      getConfig={getStockLevelFilterConfig}
      ariaLabel={translate('按库存水位筛选')}
      className={className}
    />
  )
}
