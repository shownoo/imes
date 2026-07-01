import {
  buildEntitySearchIndex,
  filterEntitySearch,
  type EntitySearchItem,
  type EntitySearchSource,
} from 'lib/entity-search'

export type { EntitySearchItem, EntitySearchSource }

export function supplierDisplayLabel(s: EntitySearchSource) {
  return `${String(s.code)} · ${String(s.name)}`
}

export function buildSupplierSearchIndex(suppliers: EntitySearchSource[]): EntitySearchItem[] {
  return buildEntitySearchIndex(suppliers, supplierDisplayLabel)
}

export const filterSuppliersBySearch = filterEntitySearch
