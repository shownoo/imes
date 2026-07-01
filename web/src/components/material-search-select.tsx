import { EntitySearchSelect } from 'components/entity-search-select'
import {
  buildMaterialSearchIndex,
  filterMaterialsBySearch,
  type EntitySearchSource,
} from 'lib/material-search'

export function MaterialSearchSelect({
  materials,
  value,
  onChange,
  placeholder = '选择物资',
  className,
  debounceTime = 300,
}: {
  materials: EntitySearchSource[]
  value: string
  onChange: (materialId: string) => void
  placeholder?: string
  className?: string
  debounceTime?: number
}) {
  return (
    <EntitySearchSelect
      items={materials}
      value={value}
      onChange={onChange}
      buildIndex={buildMaterialSearchIndex}
      filterItems={filterMaterialsBySearch}
      placeholder={placeholder}
      emptyLabel="无匹配物资"
      className={className}
      debounceTime={debounceTime}
    />
  )
}
