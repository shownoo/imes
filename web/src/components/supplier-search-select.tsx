import { EntitySearchSelect } from 'components/entity-search-select'
import {
  buildSupplierSearchIndex,
  filterSuppliersBySearch,
  type EntitySearchSource,
} from 'lib/supplier-search'

export function SupplierSearchSelect({
  suppliers,
  value,
  onChange,
  placeholder = '选择供应商',
  className,
  debounceTime = 300,
  allowClear,
}: {
  suppliers: EntitySearchSource[]
  value: string
  onChange: (supplierId: string) => void
  placeholder?: string
  className?: string
  debounceTime?: number
  allowClear?: boolean
}) {
  return (
    <EntitySearchSelect
      items={suppliers}
      value={value}
      onChange={onChange}
      buildIndex={buildSupplierSearchIndex}
      filterItems={filterSuppliersBySearch}
      placeholder={placeholder}
      emptyLabel="无匹配供应商"
      allowClear={allowClear}
      className={className}
      debounceTime={debounceTime}
    />
  )
}
